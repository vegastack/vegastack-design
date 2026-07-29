import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";

import ts from "typescript";

import { authorityFingerprint } from "./authority-fingerprint.mjs";
import { git, ROOT } from "./change-set.mjs";

const IMPORT_OWNER_AUTHORITY = ["packages/ui/component-contracts.json"];
const RESOLUTION_SUFFIXES = [
  "",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  "/index.ts",
  "/index.tsx",
  "/index.js",
  "/index.jsx",
  "/index.mjs",
];
const SOURCE_EXTENSION = /\.(?:[cm]?[jt]sx?|mdx|json|css)$/;
const CODE_EXTENSION = /\.(?:[cm]?[jt]sx?)$/;

function normalized(path) {
  return posix.normalize(path.replaceAll("\\", "/")).replace(/^\.\//, "");
}

function ownerMap({ owners, ownerEntries = [] }) {
  const entries = [
    ...[...(owners?.entries?.() ?? [])].map(([path, owner]) => [
      path,
      owner,
      true,
    ]),
    ...ownerEntries,
  ];
  const result = new Map();
  const exclusiveByFile = new Map();
  for (const [rawPath, owner, exclusive = true] of entries) {
    const path = normalized(rawPath);
    if (
      result.has(path) &&
      !result.get(path).has(owner) &&
      (exclusiveByFile.get(path) || exclusive)
    )
      throw new Error(
        `duplicate file ownership: ${path} belongs to ${[...result.get(path)].join(", ")} and ${owner}`,
      );
    if (!result.has(path)) result.set(path, new Set());
    result.get(path).add(owner);
    exclusiveByFile.set(path, Boolean(exclusiveByFile.get(path) || exclusive));
  }
  return result;
}

function candidates(base) {
  const clean = normalized(base).replace(/\/$/, "");
  if (SOURCE_EXTENSION.test(clean)) return [clean];
  return RESOLUTION_SUFFIXES.map((suffix) => `${clean}${suffix}`);
}

function modeledAliasBase(importer, specifier, aliases) {
  for (const [prefix, target] of aliases)
    if (specifier.startsWith(prefix))
      return {
        base: `${target}${specifier.slice(prefix.length)}`,
        modeled: true,
      };

  if (!specifier.startsWith("@/")) return null;
  if (specifier.startsWith("@/components/ui/"))
    return {
      base: `packages/ui/registry/ui/${specifier.slice("@/components/ui/".length)}`,
      modeled: true,
    };
  if (importer.startsWith("apps/docs/"))
    return { base: `apps/docs/${specifier.slice(2)}`, modeled: true };
  for (const [prefix, target] of [
    ["@/components/", "packages/ui/registry/"],
    ["@/lib/", "packages/ui/registry/lib/"],
    ["@/hooks/", "packages/ui/registry/hooks/"],
  ])
    if (specifier.startsWith(prefix))
      return {
        base: `${target}${specifier.slice(prefix.length)}`,
        modeled: true,
      };
  return { base: specifier, modeled: true };
}

function resolveInternal(importer, specifier, sourceSet, aliases) {
  let base;
  let modeledAlias = false;
  if (specifier.startsWith("."))
    base = posix.join(dirname(importer), specifier);
  else {
    const alias = modeledAliasBase(importer, specifier, aliases);
    if (!alias) return { external: true };
    base = alias.base;
    modeledAlias = alias.modeled;
  }
  for (const candidate of candidates(base))
    if (sourceSet.has(candidate)) return { path: candidate };
  return {
    issue: modeledAlias
      ? `unresolved modeled alias ${specifier}`
      : `unresolved internal import ${specifier}`,
  };
}

function mdxExecutableBlocks(source) {
  const lines = source.split("\n");
  const visible = [];
  let fence = null;
  for (const line of lines) {
    const marker = /^\s*(```+|~~~+)/.exec(line)?.[1] ?? null;
    if (marker) {
      fence = fence ? (marker[0] === fence[0] ? null : fence) : marker;
      visible.push("");
      continue;
    }
    visible.push(fence ? "" : line.replace(/`[^`\n]*`/g, ""));
  }
  const clean = visible.join("\n");
  const blocks = [];

  // MDX ESM is legal only at the beginning of a line. Parse the complete statement rather than a
  // line fragment so multiline imports, re-exports, and exported dynamic loaders stay visible.
  for (let index = 0; index < visible.length; index++) {
    if (!/^\s*(?:import|export)\b/.test(visible[index])) continue;
    const statement = [visible[index]];
    let braces =
      (visible[index].match(/[({[]/g) ?? []).length -
      (visible[index].match(/[)}\]]/g) ?? []).length;
    while (
      index + 1 < visible.length &&
      (braces > 0 ||
        (!/[;"']\s*$/.test(statement.at(-1)) &&
          !/^\s*$/.test(visible[index + 1])))
    ) {
      const next = visible[++index];
      statement.push(next);
      braces += (next.match(/[({[]/g) ?? []).length;
      braces -= (next.match(/[)}\]]/g) ?? []).length;
    }
    blocks.push(statement.join("\n"));
  }

  // JavaScript inside MDX expressions can span lines. Extract balanced expression bodies while
  // respecting strings; prose braces that contain no module expression are harmless.
  let start = -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = 0; index < clean.length; index++) {
    const character = clean[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") {
      if (depth === 0) start = index + 1;
      depth++;
    } else if (character === "}" && depth > 0) {
      depth--;
      if (depth === 0) {
        const expression = clean.slice(start, index);
        if (/\b(?:import|require)\s*\(/.test(expression))
          blocks.push(expression);
        start = -1;
      }
    }
  }
  if (depth !== 0 && /\b(?:import|require)\s*\(/.test(clean.slice(start)))
    blocks.push("import(unclosedMdxExpression)");
  return blocks;
}

function mdxSpecifiers(source) {
  return mdxExecutableBlocks(source).flatMap((block, index) =>
    codeSpecifiers(`mdx-block-${index}.tsx`, block).map((entry) =>
      entry.issue
        ? { issue: entry.issue.replace("computed", "computed MDX") }
        : entry,
    ),
  );
}

function codeSpecifiers(path, source) {
  const kind = path.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : path.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : path.endsWith(".js") || path.endsWith(".mjs") || path.endsWith(".cjs")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const found = [];
  function literal(node, importKind) {
    if (node && ts.isStringLiteralLike(node))
      found.push({ specifier: node.text, kind: importKind });
    else found.push({ issue: `computed ${importKind} import` });
  }
  function visit(node) {
    if (ts.isImportDeclaration(node)) literal(node.moduleSpecifier, "static");
    else if (ts.isExportDeclaration(node) && node.moduleSpecifier)
      literal(node.moduleSpecifier, "static");
    else if (ts.isCallExpression(node)) {
      if (node.expression.getText(file) === "import.meta.glob") {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument))
          found.push({ glob: argument.text, kind: "import-meta-glob" });
        else found.push({ issue: "computed import.meta.glob" });
      } else if (node.expression.kind === ts.SyntaxKind.ImportKeyword)
        literal(node.arguments[0], "dynamic");
      else if (
        ts.isIdentifier(node.expression) &&
        node.expression.text === "require"
      )
        literal(node.arguments[0], "require");
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return found;
}

function cssSpecifiers(source) {
  const found = [];
  for (const match of source.matchAll(/@(import|source)\s+["']([^"']+)["']/g))
    found.push(
      match[1] === "source"
        ? { glob: match[2], kind: "css-source" }
        : { specifier: match[2], kind: "css-import" },
    );
  for (const line of source.split("\n"))
    if (/^\s*@(import|source)\b/.test(line) && !/["'][^"']+["']/.test(line))
      found.push({ issue: "computed CSS dependency directive" });
  return found;
}

function globRegex(pattern) {
  let output = "^";
  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index];
    if (character === "*" && pattern[index + 1] === "*") {
      if (pattern[index + 2] === "/") {
        output += "(?:.*/)?";
        index += 2;
      } else {
        output += ".*";
        index++;
      }
    } else if (character === "*") output += "[^/]*";
    else if (character === "{") {
      const end = pattern.indexOf("}", index + 1);
      if (end < 0) return null;
      output += `(?:${pattern
        .slice(index + 1, end)
        .split(",")
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|")})`;
      index = end;
    } else output += character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`${output}$`);
}

function expandGlob(importer, pattern, sourceSet) {
  if (!pattern.startsWith("."))
    return { issue: `unmodeled non-relative glob ${pattern}` };
  const normalizedPattern = normalized(posix.join(dirname(importer), pattern));
  const regex = globRegex(normalizedPattern);
  if (!regex) return { issue: `malformed glob ${pattern}` };
  const paths = [...sourceSet].filter((path) => regex.test(path)).sort();
  return paths.length > 0
    ? { paths }
    : { issue: `glob matched zero modeled sources ${pattern}` };
}

export function buildImportGraph({
  sources,
  owners,
  ownerEntries = [],
  aliases = new Map(),
} = {}) {
  if (!(sources instanceof Map) || sources.size === 0)
    throw new Error("import graph requires a nonempty source map");
  const normalizedSources = new Map(
    [...sources].map(([path, source]) => [normalized(path), String(source)]),
  );
  const sourceSet = new Set(normalizedSources.keys());
  const ownerByFile = ownerMap({ owners, ownerEntries });
  const edges = [];
  const issues = [];
  const reverse = new Map();
  const forward = new Map();

  for (const [path, source] of [...normalizedSources].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const specifiers = path.endsWith(".mdx")
      ? mdxSpecifiers(source)
      : path.endsWith(".css")
        ? cssSpecifiers(source)
        : CODE_EXTENSION.test(path)
          ? codeSpecifiers(path, source)
          : [];
    for (const entry of specifiers) {
      if (entry.issue) {
        issues.push({ importer: path, reason: entry.issue });
        continue;
      }
      if (entry.glob) {
        const expanded = expandGlob(path, entry.glob, sourceSet);
        if (expanded.issue) {
          issues.push({ importer: path, reason: expanded.issue });
          continue;
        }
        for (const target of expanded.paths) {
          edges.push({ from: path, to: target, kind: entry.kind });
          if (!forward.has(path)) forward.set(path, new Set());
          forward.get(path).add(target);
          if (!reverse.has(target)) reverse.set(target, new Set());
          reverse.get(target).add(path);
        }
        continue;
      }
      const resolved = resolveInternal(
        path,
        entry.specifier,
        sourceSet,
        aliases,
      );
      if (resolved.external) continue;
      if (resolved.issue) {
        issues.push({ importer: path, reason: resolved.issue });
        continue;
      }
      edges.push({ from: path, to: resolved.path, kind: entry.kind });
      if (!forward.has(path)) forward.set(path, new Set());
      forward.get(path).add(resolved.path);
      if (!reverse.has(resolved.path)) reverse.set(resolved.path, new Set());
      reverse.get(resolved.path).add(path);
    }
  }

  edges.sort((a, b) =>
    `${a.from}\0${a.to}\0${a.kind}`.localeCompare(
      `${b.from}\0${b.to}\0${b.kind}`,
    ),
  );
  issues.sort((a, b) =>
    `${a.importer}\0${a.reason}`.localeCompare(`${b.importer}\0${b.reason}`),
  );
  const sourceFacts = [...normalizedSources]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, source]) => ({
      path,
      sha256: createHash("sha256").update(source).digest("hex"),
    }));
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        generation: "vegastack-import-closure-v1",
        sources: sourceFacts,
        edges,
        issues,
        owners: [...ownerByFile]
          .map(([path, ownerSet]) => [path, [...ownerSet].sort()])
          .sort(([a], [b]) => a.localeCompare(b)),
      }),
    )
    .digest("hex");
  return {
    schema: 1,
    generation: "vegastack-import-closure-v1",
    digest,
    sources: sourceFacts.map(({ path }) => path),
    edges,
    issues,
    ownerByFile,
    reverse,
    forward,
  };
}

export function importImpact(changedFiles, graph = repositoryImportGraph()) {
  const reached = new Set();
  const queue = [...new Set(changedFiles.map(normalized))];
  while (queue.length > 0) {
    const path = queue.shift();
    if (reached.has(path)) continue;
    reached.add(path);
    for (const importer of graph.reverse.get(path) ?? []) queue.push(importer);
  }
  const owners = new Set();
  for (const path of reached) {
    for (const owner of graph.ownerByFile.get(path) ?? []) owners.add(owner);
  }
  // An unresolved/computed edge has no target, so reverse traversal can never prove that its
  // importer is unrelated to a changed leaf. Until its domain is independently bounded, any issue
  // invalidates every product closure derived from this graph.
  const relevantIssues = graph.issues;
  return {
    full: relevantIssues.length > 0,
    owners: [...owners].sort(),
    files: [...reached].sort(),
    reasons: relevantIssues.map(
      ({ importer, reason }) => `${importer}: ${reason}`,
    ),
    graphDigest: graph.digest,
  };
}

export function importDependencies(
  changedFiles,
  graph = repositoryImportGraph(),
) {
  const reached = new Set();
  const queue = [...new Set(changedFiles.map(normalized))];
  while (queue.length > 0) {
    const path = queue.shift();
    if (reached.has(path)) continue;
    reached.add(path);
    for (const dependency of graph.forward.get(path) ?? [])
      queue.push(dependency);
  }
  const owners = new Set();
  for (const path of reached)
    for (const owner of graph.ownerByFile.get(path) ?? []) owners.add(owner);
  return {
    full: graph.issues.length > 0,
    owners: [...owners].sort(),
    files: [...reached].sort(),
    reasons: graph.issues.map(
      ({ importer, reason }) => `${importer}: ${reason}`,
    ),
    graphDigest: graph.digest,
  };
}

function repositorySources() {
  const roots = [
    "packages/ui",
    "packages/design/src",
    "apps/docs/app",
    "apps/docs/components",
    "apps/docs/content",
    "apps/docs/lib",
  ];
  const listed = [
    ...git(["ls-files", "-z", "--", ...roots]).split("\0"),
    ...git([
      "ls-files",
      "-z",
      "--others",
      "--exclude-standard",
      "--",
      ...roots,
    ]).split("\0"),
  ].filter(
    (path) =>
      SOURCE_EXTENSION.test(path) &&
      existsSync(join(ROOT, path)) &&
      lstatSync(join(ROOT, path)).isFile(),
  );
  return new Map(
    listed.map((path) => [path, readFileSync(join(ROOT, path), "utf8")]),
  );
}

function repositoryOwners(sources, records) {
  const entries = [];
  for (const record of records) {
    for (const path of [
      ...(record.sourceFiles ?? []),
      ...(record.testFiles ?? []),
    ])
      if (sources.has(path)) entries.push([path, record.name, false]);
    const preview = `apps/docs/components/preview/${record.name}.tsx`;
    if (sources.has(preview)) entries.push([preview, record.name, false]);
    if (record.docsSlug) {
      const mdx = `apps/docs/content${record.docsSlug}.mdx`;
      if (sources.has(mdx)) entries.push([mdx, record.name, false]);
    }
  }
  return entries;
}

export function repositoryImportGraph({ fresh = false } = {}) {
  // Read ownership and source bytes together. `fresh` remains part of the public API for explicit
  // call-site intent; a cross-tree cache is forbidden because this graph is not a trust root.
  void fresh;
  const contracts = JSON.parse(
    readFileSync(join(ROOT, "packages/ui/component-contracts.json"), "utf8"),
  );
  const records = [
    ...contracts.components,
    ...contracts.hooks,
    ...contracts.blocks,
  ];
  const sources = repositorySources();
  const aliases = new Map([
    ["@/components/ui/", "packages/ui/registry/ui/"],
    ["@/components/preview/", "apps/docs/components/preview/"],
  ]);
  const graph = buildImportGraph({
    sources,
    ownerEntries: repositoryOwners(sources, records),
    aliases,
  });
  return {
    ...graph,
    authorityFingerprint: authorityFingerprint(IMPORT_OWNER_AUTHORITY),
  };
}

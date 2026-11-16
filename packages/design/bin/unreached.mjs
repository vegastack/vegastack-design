// Which registry-owned files nothing in the consuming project reaches — the copies a pull keeps
// refreshing although no screen uses them (`vegastack-design owned-files --unreached`).
//
// A project's unused-code scan cannot say: it ignores the registry folders, because their files
// are the design system's to change, so a copy nobody imports rides along with every pull. This
// walks the imports the project's OWN files make — static and dynamic `import`, `export … from`,
// `require`, `vi.mock`, and the ESM blocks of an `.mdx` page (never its code fences) — follows
// them through the registry files they land on, and reports the owned files it never lands on.
// With the project's own `typescript` installed (every TS consumer has it) the specifiers come
// from TypeScript's pre-processor and resolve exactly as the compiler resolves them — the
// effective `tsconfig.json` (`extends` included), alias precedence and fallbacks, `.js` → `.ts`.
// Without it, a masked-source scan and the root `tsconfig.json` `paths` stand in. Read-only.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import { maskNonUsage } from "./doctor.mjs";

const SOURCE = /\.(?:[cm]?[jt]sx?|mdx)$/;
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  ".source",
  "dist",
  "build",
  "out",
  "coverage",
]);
const EXTENSIONS = [
  "",
  ".ts",
  ".tsx",
  ".mts",
  ".js",
  ".jsx",
  ".mjs",
  "/index.ts",
  "/index.tsx",
  "/index.js",
];
const SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|\bvi\.(?:mock|doMock|importActual)\s*\(\s*)(["'`])([^"'`\n]+)\1/g;

function sourceFiles(root, dir = root, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") || SKIP_DIRS.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) sourceFiles(root, full, out);
    else if (e.isFile() && SOURCE.test(e.name)) out.push(full);
  }
  return out;
}

/**
 * An `.mdx` page's ESM: each block that starts a line with `import`/`export` outside a code fence
 * and runs to the next blank line once its braces close (MDX's own rule), so a multi-line import
 * counts and an example inside a fence does not.
 */
export function mdxEsm(src) {
  const out = [];
  let fence = null;
  let inEsm = false;
  let depth = 0;
  const braces = (line) =>
    (line.match(/[{(]/g)?.length ?? 0) - (line.match(/[})]/g)?.length ?? 0);
  for (const line of src.split("\n")) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (
        marker &&
        marker[1][0] === fence[0] &&
        marker[1].length >= fence.length
      )
        fence = null;
      continue;
    }
    if (inEsm) {
      // A blank line ends the block once its statement is complete (MDX parses an open brace on).
      if (line.trim() === "" && depth <= 0) inEsm = false;
      else {
        out.push(line);
        depth += braces(line);
      }
      continue;
    }
    if (marker) fence = marker[1];
    else if (/^(?:import|export)\b/.test(line)) {
      inEsm = true;
      depth = braces(line);
      out.push(line);
    }
  }
  return out.join("\n");
}

/** `vi.mock("x")` and friends: the module a test replaces is a module it reaches. */
const VI_MOCK =
  /\bvi\.(?:mock|doMock|importActual)\s*\(\s*(["'`])([^"'`\n]+)\1/g;

/**
 * The module specifiers a file's code imports. With TypeScript, read from the syntax tree — import
 * and export declarations, `import()` and import types, `require` and `vi.mock` calls — so a
 * string or a regex that merely looks like an import reaches nothing. Without it, a masked scan.
 */
export function specifiersOf(file, src, ts = null) {
  const code = file.endsWith(".mdx") ? mdxEsm(src) : src;
  if (!ts) {
    const masked = maskNonUsage(code);
    return [
      ...[...masked.matchAll(SPECIFIER)].map((m) => m[2]),
      ...[...masked.matchAll(VI_MOCK)].map((m) => m[2]),
    ];
  }
  const out = [];
  const literal = (node) =>
    node &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      ? node.text
      : null;
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    )
      out.push(literal(node.moduleSpecifier));
    else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    )
      out.push(literal(node.moduleReference.expression));
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      out.push(literal(node.argument.literal));
    else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (
        callee.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(callee) && callee.text === "require") ||
        (ts.isPropertyAccessExpression(callee) &&
          ts.isIdentifier(callee.expression) &&
          callee.expression.text === "vi" &&
          ["mock", "doMock", "importActual"].includes(callee.name.text))
      )
        out.push(literal(node.arguments[0]));
    }
    ts.forEachChild(node, visit);
  };
  const kind = /\.[cm]?jsx?$/.test(file)
    ? ts.ScriptKind.JSX
    : ts.ScriptKind.TSX;
  visit(ts.createSourceFile(file, code, ts.ScriptTarget.Latest, false, kind));
  return out.filter(Boolean);
}

/** The consuming project's own TypeScript, when it has one. */
function projectTypeScript(root) {
  try {
    return createRequire(join(root, "package.json"))("typescript");
  } catch {
    return null;
  }
}

/** `tsconfig.json`'s `paths` as [prefix, absolute target prefix] pairs (`@/` → `<root>/src/`). */
function pathAliases(root) {
  let config;
  try {
    // tsconfig allows comments and trailing commas: drop both, leaving strings ("**/*.ts") alone.
    const text = readFileSync(join(root, "tsconfig.json"), "utf8")
      .replace(
        /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
        (m, str) => str ?? "",
      )
      .replace(
        /("(?:\\.|[^"\\])*")|,(\s*[}\]])/g,
        (m, str, tail) => str ?? tail,
      );
    config = JSON.parse(text);
  } catch {
    return [];
  }
  const base = resolve(root, config?.compilerOptions?.baseUrl ?? ".");
  return Object.entries(config?.compilerOptions?.paths ?? {}).flatMap(
    ([from, targets = []]) =>
      from.endsWith("/*")
        ? [
            [
              from.slice(0, -1),
              targets
                .filter((t) => typeof t === "string" && t.endsWith("/*"))
                .map((t) => resolve(base, t.slice(0, -2)) + sep),
            ],
          ]
        : [],
  );
}

/** Resolution exactly as the project's compiler does it, from its effective tsconfig. */
function compilerResolver(ts, root) {
  const configPath = ts.findConfigFile(
    root,
    ts.sys.fileExists,
    "tsconfig.json",
  );
  let options = {
    allowJs: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  };
  if (configPath) {
    const parsed = ts.getParsedCommandLineOfConfigFile(
      configPath,
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: () => {},
      },
    );
    if (parsed) options = { ...parsed.options, allowJs: true };
  }
  const host = ts.createCompilerHost(options);
  // The effective `paths` (inherited ones included), for the `.mdx` targets the compiler skips.
  const pathsBase = resolve(
    options.pathsBasePath ??
      options.baseUrl ??
      (configPath ? dirname(configPath) : root),
  );
  const effective = Object.entries(options.paths ?? {}).flatMap(
    ([from, targets]) =>
      from.endsWith("/*")
        ? [
            [
              from.slice(0, -1),
              targets
                .filter((t) => t.endsWith("/*"))
                .map((t) => resolve(pathsBase, t.slice(0, -2)) + sep),
            ],
          ]
        : [],
  );
  const fallback = fallbackResolver(root, effective);
  return (from, spec) => {
    const hit = ts.resolveModuleName(spec, from, options, host).resolvedModule;
    if (
      hit &&
      !hit.isExternalLibraryImport &&
      SOURCE.test(hit.resolvedFileName)
    )
      return resolve(hit.resolvedFileName);
    // An `.mdx` target, which the compiler does not resolve.
    return spec.endsWith(".mdx") ? fallback(from, spec) : null;
  };
}

/**
 * Without TypeScript (or for an `.mdx` target): relative paths and `paths` aliases — the longest
 * prefix first, each of its targets in order.
 */
function fallbackResolver(root, aliases = pathAliases(root)) {
  const sorted = [...aliases].sort((a, b) => b[0].length - a[0].length);
  const probe = (base) => {
    const stem = base.replace(/\.(?:[cm]?js|jsx)$/, "");
    for (const candidate of [base, ...EXTENSIONS.map((ext) => stem + ext)])
      if (existsSync(candidate) && SOURCE.test(candidate)) return candidate;
    return null;
  };
  return (from, spec) => {
    if (/^\.\.?(?:\/|$)/.test(spec)) return probe(resolve(dirname(from), spec));
    const hit = sorted.find(([prefix]) => spec.startsWith(prefix));
    if (!hit) return null;
    for (const target of hit[1]) {
      const found = probe(target + spec.slice(hit[0].length));
      if (found) return found;
    }
    return null;
  };
}

/**
 * The owned files (root-relative, as `ownedFiles` lists them) that no project-owned file
 * reaches, sorted. `ts` defaults to the project's own TypeScript (null: the fallback scan).
 */
export function unreachedFiles(
  root,
  owned,
  { ts = projectTypeScript(root) } = {},
) {
  const ownedAbs = new Set(owned.map((f) => resolve(root, f)));
  const resolveSpec = ts ? compilerResolver(ts, root) : fallbackResolver(root);
  const queue = sourceFiles(root).filter((f) => !ownedAbs.has(f));
  const seen = new Set(queue);
  const reached = new Set();
  while (queue.length > 0) {
    const file = queue.pop();
    let src;
    try {
      src = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const spec of specifiersOf(file, src, ts)) {
      const target = resolveSpec(file, spec);
      if (!target || seen.has(target)) continue;
      seen.add(target);
      if (ownedAbs.has(target)) reached.add(target);
      queue.push(target);
    }
  }
  return owned
    .filter((f) => SOURCE.test(f) && !reached.has(resolve(root, f)))
    .map((f) => relative(root, resolve(root, f)).split(sep).join("/"))
    .sort();
}

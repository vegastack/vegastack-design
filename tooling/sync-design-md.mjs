#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// Both imported by PACKAGE NAME from root devDependencies. They were previously reached through
// `../packages/design-tokens/node_modules/style-dictionary/lib/StyleDictionary.js` (an internal
// file, not the public entry) and `../node_modules/.pnpm/node_modules/yaml/dist/index.js` (pnpm's
// PRIVATE virtual store). Neither path is guaranteed — any hoisting change or a store layout bump
// silently breaks root `pnpm lint`, and neither package was declared anywhere.
import StyleDictionary from "style-dictionary";
import * as YAML from "yaml";
import "../packages/design-tokens/sd-hooks.mjs";
import { designMdConfig } from "./design-md.config.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkMode = process.argv.includes("--check");
const selfTestMode = process.argv.includes("--self-test");
const allowedArguments = new Set(["--check", "--self-test"]);
const unexpectedArguments = process.argv
  .slice(2)
  .filter((argument) => !allowedArguments.has(argument));

if (unexpectedArguments.length > 0) {
  throw new Error(
    `Unknown argument${unexpectedArguments.length === 1 ? "" : "s"}: ${unexpectedArguments.join(", ")}`,
  );
}

const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor < 24 || (nodeMajor === 24 && nodeMinor < 14)) {
  throw new Error(
    `Node >=24.14.0 is required; received ${process.versions.node}`,
  );
}

const TRANSFORMS = [
  "attribute/cti",
  "name/kebab",
  "color/oklch",
  "dimension/css",
  "duration/css",
  "cubicBezier/css",
  "fontFamily/css",
  "shadow/css",
];

function absolute(path) {
  return resolve(repositoryRoot, path);
}

function read(path) {
  return readFileSync(absolute(path), "utf8");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fileRecord(path) {
  const value = readFileSync(absolute(path));
  return { path, bytes: value.byteLength, sha256: sha256(value) };
}

function parseJson(path) {
  try {
    return JSON.parse(read(path));
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${error.message}`, {
      cause: error,
    });
  }
}

function compactOklch(value) {
  if (Array.isArray(value)) return value.map(compactOklch);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, compactOklch(child)]),
    );
  }
  if (typeof value !== "string") return value;
  return value.replace(/oklch\(([^)]+)\)/g, (_, inner) => {
    const [components, alpha] = inner.split("/");
    const compactComponents = components
      .trim()
      .split(/\s+/)
      .map(Number)
      .join(" ");
    return alpha == null
      ? `oklch(${compactComponents})`
      : `oklch(${compactComponents} / ${Number(alpha)})`;
  });
}

function tokenEntry(token) {
  const entry = {
    type: token.$type ?? token.type,
    value: compactOklch(token.$value ?? token.value),
  };
  if (token.$description ?? token.description) {
    entry.description = token.$description ?? token.description;
  }
  return entry;
}

async function transformedSemanticTokens(sources, sourceNeedle) {
  const dictionary = new StyleDictionary({
    preprocessors: ["derive-interaction-states"],
    source: sources.map(absolute),
    platforms: { designMd: { transforms: TRANSFORMS } },
  });
  await dictionary.hasInitialized;
  const platform = await dictionary.getPlatformTokens("designMd");
  return Object.fromEntries(
    platform.allTokens
      .filter((token) => token.filePath.includes(sourceNeedle))
      .map((token) => [token.name, tokenEntry(token)])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function validateSourceManifest() {
  const path = designMdConfig.sourceManifest;
  const manifest = parseJson(path);
  if (
    manifest.schemaVersion !== 1 ||
    !Array.isArray(manifest.sources) ||
    manifest.sources.length === 0
  ) {
    throw new Error(
      `${path} must contain schemaVersion 1 and a non-empty sources array`,
    );
  }
  for (const source of manifest.sources) {
    if (!source.id || !source.snapshot?.path || !source.snapshot?.sha256) {
      throw new Error(
        `${path} source entries require id, snapshot.path, and snapshot.sha256`,
      );
    }
    for (const record of [source.snapshot, source.license?.evidence].filter(
      Boolean,
    )) {
      const actual = fileRecord(record.path);
      if (actual.sha256 !== record.sha256 || actual.bytes !== record.bytes) {
        throw new Error(
          `${record.path} differs from ${path}: expected ${record.bytes} bytes/${record.sha256}, received ${actual.bytes} bytes/${actual.sha256}`,
        );
      }
    }
  }
  return { manifest, record: fileRecord(path) };
}

function splitFrontmatter(value, path) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(value);
  if (!match)
    throw new Error(`${path} must contain a leading YAML frontmatter block`);
  return { yaml: match[1], body: match[2].replace(/^\n*/, "") };
}

function parseYaml(value, path) {
  const document = YAML.parseDocument(value, { uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(
      `${path} has invalid YAML frontmatter: ${document.errors.map((error) => error.message).join("; ")}`,
    );
  }
  document.toJS({ maxAliasCount: 0 });
}

function serializeFrontmatter(frontmatter) {
  const value = YAML.stringify(frontmatter, {
    lineWidth: 0,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
    doubleQuotedAsJSON: true,
    aliasDuplicateObjects: false,
  });
  parseYaml(value, "generated frontmatter");
  return value;
}

function assertEqualSets(light, darkOverride) {
  for (const key of Object.keys(darkOverride)) {
    if (!(key in light))
      throw new Error(`Dark token "${key}" has no light counterpart`);
  }
}

function validateRecipeReferences(recipes, tokens) {
  const references = [];
  function visit(value, path) {
    if (typeof value === "string") {
      const match = /^\{([^}]+)\}$/.exec(value);
      if (match) references.push({ token: match[1], path });
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value))
      visit(child, `${path}.${key}`);
  }
  visit(recipes, "recipes");
  for (const reference of references) {
    if (!(reference.token in tokens)) {
      throw new Error(
        `${reference.path} references missing token "${reference.token}"`,
      );
    }
  }
  return references.length;
}

function tokenValue(entry) {
  return typeof entry?.value === "string"
    ? entry.value
    : JSON.stringify(entry?.value);
}

function foundationTable(id, tokenNames, light, dark) {
  const rows = tokenNames.map((name) => {
    if (!light[name] || !dark[name])
      throw new Error(`foundation table ${id}: missing token ${name}`);
    return `| \`--${name}\` | \`${tokenValue(light[name])}\` | \`${tokenValue(dark[name])}\` |`;
  });
  return [
    `{/* DESIGN-TOKENS:${id}:START */}`,
    "{/* GENERATED by tooling/sync-design-md.mjs from resolved DTCG tokens. Do not hand-edit. */}",
    "| Token | Light | Dark |",
    "|---|---|---|",
    ...rows,
    `{/* DESIGN-TOKENS:${id}:END */}`,
  ].join("\n");
}

function synchronizeFoundationTables(light, dark) {
  let changed = 0;
  for (const [id, spec] of Object.entries(designMdConfig.foundationTables)) {
    const path = spec.path;
    const source = read(path);
    const start = `{/* DESIGN-TOKENS:${id}:START */}`;
    const end = `{/* DESIGN-TOKENS:${id}:END */}`;
    const pattern = new RegExp(
      `${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    );
    if (!pattern.test(source))
      throw new Error(`${path} is missing ${start}/${end} markers`);
    const expected = source.replace(
      pattern,
      foundationTable(id, spec.tokens, light, dark),
    );
    if (checkMode) {
      if (source !== expected)
        throw new Error(`${path} generated ${id} token table is stale`);
    } else if (writeIfChanged(path, expected)) {
      changed += 1;
    }
  }
  return changed;
}

function writeIfChanged(path, value) {
  const target = absolute(path);
  if (existsSync(target) && readFileSync(target, "utf8") === value)
    return false;
  writeFileSync(target, value);
  return true;
}

for (const path of Object.values(designMdConfig.tokenSources)) parseJson(path);
const sourceManifest = validateSourceManifest();

const light = await transformedSemanticTokens(
  [designMdConfig.tokenSources.primitives, designMdConfig.tokenSources.light],
  "semantic.tokens",
);
const darkOverride = await transformedSemanticTokens(
  [designMdConfig.tokenSources.primitives, designMdConfig.tokenSources.dark],
  "semantic.dark.tokens",
);
assertEqualSets(light, darkOverride);
const dark = Object.fromEntries(
  Object.keys(light)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => [key, darkOverride[key] ?? light[key]]),
);
const recipeReferenceCount = validateRecipeReferences(
  designMdConfig.recipes,
  light,
);

if (selfTestMode) {
  let rejectedMissingReference = false;
  try {
    validateRecipeReferences(
      {
        ...designMdConfig.recipes,
        __negative: { foreground: "{__missing_token__}" },
      },
      light,
    );
  } catch (error) {
    rejectedMissingReference =
      error instanceof Error && error.message.includes("__missing_token__");
  }
  if (!rejectedMissingReference) {
    throw new Error(
      "design.md recipe-reference negative self-test did not fail closed",
    );
  }
  console.log("✓ design.md negative self-test: missing recipe token rejected");
  process.exit(0);
}

const foundationTableChanges = synchronizeFoundationTables(light, dark);

const generatorPath = relative(repositoryRoot, fileURLToPath(import.meta.url));
const configPath = "tooling/design-md.config.mjs";
const frontmatter = {
  schemaVersion: designMdConfig.schemaVersion,
  version: designMdConfig.version,
  name: designMdConfig.name,
  description: designMdConfig.description,
  generated: {
    command: "node tooling/sync-design-md.mjs",
    check: "node tooling/sync-design-md.mjs --check",
    tokenFormat: "DTCG 2025.10 resolved to CSS values",
    inputs: {
      generator: fileRecord(generatorPath),
      config: fileRecord(configPath),
      primitives: fileRecord(designMdConfig.tokenSources.primitives),
      light: fileRecord(designMdConfig.tokenSources.light),
      dark: fileRecord(designMdConfig.tokenSources.dark),
      externalSources: sourceManifest.record,
    },
  },
  themes: { light, dark },
  recipes: designMdConfig.recipes,
};

const canonicalPath = designMdConfig.outputs.canonical;
const publicPath = designMdConfig.outputs.public;
const canonicalValue = read(canonicalPath);
const canonicalParts = splitFrontmatter(canonicalValue, canonicalPath);
const expected = `---\n${serializeFrontmatter(frontmatter)}---\n\n${canonicalParts.body}`;

if (checkMode) {
  parseYaml(canonicalParts.yaml, canonicalPath);
  if (canonicalValue !== expected) {
    throw new Error(
      `${canonicalPath} is stale; run node tooling/sync-design-md.mjs with Node >=24.14`,
    );
  }
  if (!existsSync(absolute(publicPath)))
    throw new Error(`${publicPath} is missing`);
  const publicValue = read(publicPath);
  parseYaml(splitFrontmatter(publicValue, publicPath).yaml, publicPath);
  if (publicValue !== canonicalValue) {
    throw new Error(
      `${publicPath} does not byte-match ${canonicalPath}; run node tooling/sync-design-md.mjs`,
    );
  }
  console.log(
    `design.md check passed: ${Object.keys(light).length} resolved tokens per theme; ${recipeReferenceCount} recipe references and ${Object.keys(designMdConfig.foundationTables).length} foundation tables verified; public copy matches (${sha256(canonicalValue)}).`,
  );
} else {
  const canonicalChanged = writeIfChanged(canonicalPath, expected);
  const publicChanged = writeIfChanged(publicPath, expected);
  console.log(
    `design.md synchronized: ${Object.keys(light).length} resolved tokens per theme; ${recipeReferenceCount} recipe references verified; ${foundationTableChanges} foundation table file(s) updated; canonical ${canonicalChanged ? "updated" : "unchanged"}; public ${publicChanged ? "updated" : "unchanged"}.`,
  );
}

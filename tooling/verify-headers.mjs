// Provenance-header audit gate (requirements §157.3 + G23). Fails CLOSED if any shipped copy of a
// registry component is missing the `// @vegastack <name>@<version> sha256-<sha>` header, OR its
// embedded sha ≠ the item's meta.integrity, OR the version ≠ @vegastack/ui's package.json version.
// Checks all three shipped surfaces: the registry-JSON files[].content, the registry SOURCE file,
// and the docs copy-in. Run as the last step of `registry:build` and standalone in CI/audit.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readProvenanceHeader } from "./registry-hash.mjs";
import {
  assertExistingPathInside,
  assertPathInside,
  resolveInside,
} from "./safe-path.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");

const dir = join(repoRoot, "apps/docs/public/r");
const SKIP = new Set(["integrity-manifest.json", "registry.json"]);
const sourceRegistry = JSON.parse(
  readFileSync(join(repoRoot, "packages/ui/registry.json"), "utf8"),
);
const sourceNames = (sourceRegistry.items ?? []).map((item) => item.name);
const expectedNames = [...sourceNames].sort();
const expectedSet = new Set(expectedNames);

const uiPkg = JSON.parse(
  readFileSync(join(repoRoot, "packages/ui/package.json"), "utf8"),
);
const version = uiPkg.version;

// Resolve a shadcn `@ui/` (etc.) placeholder target to the docs app's on-disk copy-in path via
// apps/docs/components.json aliases — MUST mirror tooling/registry-header.mjs `resolveDocsCopyPath`
// (since R12 the targets are placeholders, not relative paths; resolving with a plain join silently
// missed the copy-in surface).
const docsRoot = join(repoRoot, "apps/docs");
const docsAliases =
  JSON.parse(readFileSync(join(docsRoot, "components.json"), "utf8")).aliases ??
  {};
function resolveDocsCopyPath(target) {
  const m = /^@([a-z]+)\/(.+)$/.exec(target);
  if (!m)
    throw new Error(
      `docs copy target is not a registry alias placeholder: ${target}`,
    );
  const aliasValue = docsAliases[m[1]];
  if (typeof aliasValue !== "string") {
    throw new Error(`docs components.json has no alias for target ${target}`);
  }
  const aliasRoot = resolveInside(docsRoot, aliasValue.replace(/^@\//, ""));
  const safeAliasRoot = assertExistingPathInside(docsRoot, aliasRoot);
  return resolveInside(safeAliasRoot, m[2]);
}

const registrySourceRoots = [
  join(repoRoot, "packages/ui/registry/ui"),
  join(repoRoot, "packages/ui/registry/blocks"),
];
function resolveRegistrySourcePath(sourcePath) {
  const candidate = resolveInside(repoRoot, sourcePath);
  for (const root of registrySourceRoots) {
    try {
      return { candidate: assertPathInside(root, candidate), root };
    } catch {
      // Try the next sanctioned canonical-source root.
    }
  }
  throw new Error(
    `registry source is outside sanctioned canonical roots: ${sourcePath}`,
  );
}

const problems = [];
let checked = 0;

if (sourceNames.some((name) => typeof name !== "string" || name.length === 0)) {
  problems.push("source registry contains an item without a valid name");
}
if (expectedSet.size !== expectedNames.length) {
  problems.push(
    `source registry contains ${expectedNames.length - expectedSet.size} duplicate item name(s)`,
  );
}

const outputFilenames = readdirSync(dir)
  .filter((name) => name.endsWith(".json") && !SKIP.has(name))
  .sort();
const outputNames = outputFilenames.map((name) => name.replace(/\.json$/, ""));
const outputSet = new Set(outputNames);
const missingOutputs = expectedNames.filter((name) => !outputSet.has(name));
const unexpectedOutputs = outputNames.filter((name) => !expectedSet.has(name));
if (outputSet.size !== outputNames.length) {
  problems.push(
    `registry output contains ${outputNames.length - outputSet.size} duplicate item filename(s)`,
  );
}
if (missingOutputs.length)
  problems.push(`registry output is missing: ${missingOutputs.join(", ")}`);
if (unexpectedOutputs.length)
  problems.push(
    `registry output is unexpected: ${unexpectedOutputs.join(", ")}`,
  );

// Validate one piece of content's header against the expected item identity.
function check(label, content, name, integrity) {
  const provenanceLines = content.match(/^\/\/ @vegastack \S+@\S+.*$/gm) ?? [];
  if (!content.startsWith("// @vegastack ")) {
    problems.push(`${label}: provenance header must be line 1`);
  }
  if (provenanceLines.length !== 1) {
    problems.push(
      `${label}: expected exactly one provenance header, found ${provenanceLines.length}`,
    );
  }
  const hdr = readProvenanceHeader(content);
  if (!hdr) {
    problems.push(
      `${label}: missing provenance header (expected "// @vegastack ${name}@${version} ${integrity}")`,
    );
    return;
  }
  if (hdr.name !== name)
    problems.push(`${label}: header name "${hdr.name}" ≠ item name "${name}"`);
  if (hdr.version !== version)
    problems.push(
      `${label}: header version "${hdr.version}" ≠ @vegastack/ui version "${version}"`,
    );
  if (hdr.integrity !== integrity) {
    problems.push(
      `${label}: header sha "${hdr.integrity}" ≠ meta.integrity "${integrity}" (drift)`,
    );
  }
}

for (const f of outputFilenames) {
  const item = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const filenameName = f.replace(/\.json$/, "");
  if (item.name !== filenameName) {
    problems.push(
      `${f}: embedded item name ${JSON.stringify(item.name)} does not match filename`,
    );
  }
  const integrity = item.meta?.integrity;
  if (!integrity) {
    problems.push(`${item.name ?? f}: item is missing meta.integrity`);
    continue;
  }
  for (const file of item.files ?? []) {
    if (typeof file.content !== "string") continue;
    // JSON payloads (registry:file data fixtures, e.g. a block's data.json) carry NO per-file
    // provenance header — a `//` comment would corrupt the JSON. The item-level meta.integrity
    // (checked above / in the manifest) still covers their content. Mirrors registry-header.mjs.
    if (file.path?.endsWith(".json")) {
      checked++;
      continue;
    }
    // (a) registry-JSON content
    check(
      `${item.name} [json ${file.path}]`,
      file.content,
      item.name,
      integrity,
    );
    // (b) registry SOURCE file
    if (file.path) {
      try {
        const { candidate: srcPath } = resolveRegistrySourcePath(file.path);
        if (existsSync(srcPath))
          check(
            `${item.name} [source ${file.path}]`,
            readFileSync(assertExistingPathInside(repoRoot, srcPath), "utf8"),
            item.name,
            integrity,
          );
        else
          problems.push(
            `${item.name}: registry source missing at ${file.path}`,
          );
      } catch (error) {
        problems.push(`${item.name}: ${error.message}`);
      }
    }
    // (c) docs copy-in (placeholder target → on-disk path; must exist — fail closed if missing).
    // Plain-path targets (registry:page/registry:file, consumer-app routes) have no docs copy-in
    // — mirrors registry-header.mjs.
    if (file.target && file.target.startsWith("@")) {
      const copyPath = resolveDocsCopyPath(file.target);
      if (existsSync(copyPath))
        check(
          `${item.name} [copy-in ${file.target}]`,
          readFileSync(assertExistingPathInside(docsRoot, copyPath), "utf8"),
          item.name,
          integrity,
        );
      else
        problems.push(
          `${item.name}: docs copy-in missing at ${copyPath} (resolved from target ${file.target})`,
        );
    }
    checked++;
  }
}

// (d) public registry INDEX integrity must mirror the per-item integrity / manifest (Codex R16).
try {
  const manifest = JSON.parse(
    readFileSync(join(dir, "integrity-manifest.json"), "utf8"),
  );
  const index = JSON.parse(readFileSync(join(dir, "registry.json"), "utf8"));
  const manifestNames = Object.keys(manifest).sort();
  const manifestSet = new Set(manifestNames);
  const indexItems = index.items ?? [];
  const indexNames = indexItems.map((item) => item.name);
  const indexSet = new Set(indexNames);
  const describeMismatch = (label, names, set) => {
    const missing = expectedNames.filter((name) => !set.has(name));
    const unexpected = names.filter((name) => !expectedSet.has(name));
    if (set.size !== names.length)
      problems.push(`${label}: duplicate item name(s) found`);
    if (missing.length)
      problems.push(`${label}: missing ${missing.join(", ")}`);
    if (unexpected.length)
      problems.push(`${label}: unexpected ${unexpected.join(", ")}`);
  };
  describeMismatch("manifest", manifestNames, manifestSet);
  describeMismatch("index", indexNames, indexSet);
  for (const name of expectedNames) {
    const itemPath = join(dir, `${name}.json`);
    if (!existsSync(itemPath)) continue;
    const item = JSON.parse(readFileSync(itemPath, "utf8"));
    if (item.meta?.integrity !== manifest[name]) {
      problems.push(
        `manifest: ${name} integrity does not match the per-item file`,
      );
    }
  }
  for (const item of indexItems) {
    const idx = item.meta?.integrity;
    const expected = manifest[item.name];
    if (!idx)
      problems.push(
        `index: ${item.name} is missing meta.integrity in registry.json`,
      );
    else if (idx !== expected)
      problems.push(
        `index: ${item.name} meta.integrity "${idx}" ≠ manifest "${expected}" (drift)`,
      );
  }
} catch (err) {
  problems.push(
    `index: could not verify registry.json integrity — ${err.message}`,
  );
}

if (problems.length) {
  console.error(`✗ verify-headers: ${problems.length} problem(s)`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(
  `✓ verify-headers: ${checked} component file(s) carry a valid provenance header (v${version})`,
);

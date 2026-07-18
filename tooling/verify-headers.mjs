// Provenance-header audit gate (requirements §157.3 + G23). Fails CLOSED if any shipped copy of a
// registry component is missing the `// @vegastack <name>@<version> sha256-<sha>` header, OR its
// embedded sha ≠ the item's meta.integrity, OR the version ≠ @vegastack/ui's package.json version.
// Checks all three shipped surfaces: the registry-JSON files[].content, the registry SOURCE file,
// and the docs copy-in. Run as the last step of `registry:build` and standalone in CI/audit.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readProvenanceHeader } from './registry-hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const dir = join(repoRoot, 'apps/docs/public/r');
const SKIP = new Set(['integrity-manifest.json', 'registry.json']);

const uiPkg = JSON.parse(readFileSync(join(repoRoot, 'packages/ui/package.json'), 'utf8'));
const version = uiPkg.version;

// Resolve a shadcn `@ui/` (etc.) placeholder target to the docs app's on-disk copy-in path via
// apps/docs/components.json aliases — MUST mirror tooling/registry-header.mjs `resolveDocsCopyPath`
// (since R12 the targets are placeholders, not relative paths; resolving with a plain join silently
// missed the copy-in surface).
const docsRoot = join(repoRoot, 'apps/docs');
const docsAliases = JSON.parse(readFileSync(join(docsRoot, 'components.json'), 'utf8')).aliases ?? {};
function resolveDocsCopyPath(target) {
  const m = /^@([a-z]+)\/(.+)$/.exec(target);
  if (m && docsAliases[m[1]]) {
    return join(docsRoot, docsAliases[m[1]].replace(/^@\//, ''), m[2]);
  }
  return join(docsRoot, target);
}

const problems = [];
let checked = 0;

// Validate one piece of content's header against the expected item identity.
function check(label, content, name, integrity) {
  const hdr = readProvenanceHeader(content);
  if (!hdr) {
    problems.push(`${label}: missing provenance header (expected "// @vegastack ${name}@${version} ${integrity}")`);
    return;
  }
  if (hdr.name !== name) problems.push(`${label}: header name "${hdr.name}" ≠ item name "${name}"`);
  if (hdr.version !== version) problems.push(`${label}: header version "${hdr.version}" ≠ @vegastack/ui version "${version}"`);
  if (hdr.integrity !== integrity) {
    problems.push(`${label}: header sha "${hdr.integrity}" ≠ meta.integrity "${integrity}" (drift)`);
  }
}

for (const f of readdirSync(dir).filter((n) => n.endsWith('.json') && !SKIP.has(n))) {
  const item = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const integrity = item.meta?.integrity;
  if (!integrity) {
    problems.push(`${item.name ?? f}: item is missing meta.integrity`);
    continue;
  }
  for (const file of item.files ?? []) {
    if (typeof file.content !== 'string') continue;
    // JSON payloads (registry:file data fixtures, e.g. a block's data.json) carry NO per-file
    // provenance header — a `//` comment would corrupt the JSON. The item-level meta.integrity
    // (checked above / in the manifest) still covers their content. Mirrors registry-header.mjs.
    if (file.path?.endsWith('.json')) {
      checked++;
      continue;
    }
    // (a) registry-JSON content
    check(`${item.name} [json ${file.path}]`, file.content, item.name, integrity);
    // (b) registry SOURCE file
    if (file.path) {
      const srcPath = join(repoRoot, file.path);
      if (existsSync(srcPath)) check(`${item.name} [source ${file.path}]`, readFileSync(srcPath, 'utf8'), item.name, integrity);
      else problems.push(`${item.name}: registry source missing at ${file.path}`);
    }
    // (c) docs copy-in (placeholder target → on-disk path; must exist — fail closed if missing).
    // Plain-path targets (registry:page/registry:file, consumer-app routes) have no docs copy-in
    // — mirrors registry-header.mjs.
    if (file.target && file.target.startsWith('@')) {
      const copyPath = resolveDocsCopyPath(file.target);
      if (existsSync(copyPath)) check(`${item.name} [copy-in ${file.target}]`, readFileSync(copyPath, 'utf8'), item.name, integrity);
      else problems.push(`${item.name}: docs copy-in missing at ${copyPath} (resolved from target ${file.target})`);
    }
    checked++;
  }
}

// (d) public registry INDEX integrity must mirror the per-item integrity / manifest (Codex R16).
try {
  const manifest = JSON.parse(readFileSync(join(dir, 'integrity-manifest.json'), 'utf8'));
  const index = JSON.parse(readFileSync(join(dir, 'registry.json'), 'utf8'));
  for (const item of index.items ?? []) {
    const idx = item.meta?.integrity;
    const expected = manifest[item.name];
    if (!idx) problems.push(`index: ${item.name} is missing meta.integrity in registry.json`);
    else if (idx !== expected) problems.push(`index: ${item.name} meta.integrity "${idx}" ≠ manifest "${expected}" (drift)`);
  }
} catch (err) {
  problems.push(`index: could not verify registry.json integrity — ${err.message}`);
}

if (problems.length) {
  console.error(`✗ verify-headers: ${problems.length} problem(s)`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`✓ verify-headers: ${checked} component file(s) carry a valid provenance header (v${version})`);

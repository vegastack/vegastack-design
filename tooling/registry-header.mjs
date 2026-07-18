// Run AFTER `registry-stamp.mjs` (which writes each item's meta.integrity): stamp the
// provenance header (requirements §157.3 + G23) — `// @vegastack <name>@<version> sha256-<sha>` —
// onto every shipped copy of each component:
//   (a) the registry-JSON `files[].content` (apps/docs/public/r/<name>.json),
//   (b) the registry SOURCE file              (packages/ui/registry/ui/<name>.tsx, from files[].path),
//   (c) the docs copy-in                       (apps/docs/components/ui/<name>.tsx, from files[].target),
//       re-synced byte-for-byte from the source so it inherits the SAME header.
//
// <version> is @vegastack/ui's package.json version. <sha> is the item's meta.integrity (the
// SAME sha256-… already stamped by registry-stamp.mjs). itemHash() strips the header before
// hashing, so the embedded sha == meta.integrity stays self-consistent and re-running
// `registry:build` is IDEMPOTENT (stable hashes → stable headers → zero diff).
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { applyProvenanceHeader } from './registry-hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const dir = join(repoRoot, 'apps/docs/public/r');
const SKIP = new Set(['integrity-manifest.json', 'registry.json']);

// Registry items use shadcn target PLACEHOLDERS (`@ui/`, `@components/`, `@lib/`, `@hooks/`,
// `@utils/`) so they install under each consumer's configured aliases (portable across layouts).
// The docs app is itself such a consumer: resolve the placeholder to its on-disk copy-in path via
// apps/docs/components.json aliases (`@/` ⇒ the docs app root). e.g. `@ui/button.tsx` →
// apps/docs/components/ui/button.tsx.
const docsRoot = join(repoRoot, 'apps/docs');
const docsAliases = JSON.parse(readFileSync(join(docsRoot, 'components.json'), 'utf8')).aliases ?? {};
function resolveDocsCopyPath(target) {
  const m = /^@([a-z]+)\/(.+)$/.exec(target);
  if (m) {
    const aliasValue = docsAliases[m[1]]; // e.g. "@/components/ui"
    if (aliasValue) {
      // alias value's leading `@/` maps to the docs app root.
      const rel = aliasValue.replace(/^@\//, '');
      return join(docsRoot, rel, m[2]);
    }
  }
  // non-placeholder (legacy relative) target — join under the docs app as before.
  return join(docsRoot, target);
}

// <version> comes from @vegastack/ui's package.json (the package that ships these components).
const uiPkg = JSON.parse(readFileSync(join(repoRoot, 'packages/ui/package.json'), 'utf8'));
const version = uiPkg.version;

let stampedItems = 0;
let stampedSources = 0;
let syncedCopyIns = 0;

// Prune stale item JSONs first: `shadcn build` is additive-only, so renamed/removed items leave
// their old JSON behind — and a stale old-name JSON later in this loop re-stamps the SAME source
// file with the old identity, clobbering the fresh stamp (bit hard by the 439-icon `icon-` rename:
// 965 files had accumulated for 525 items). Anything in public/r not named for a current
// registry.json item is generated garbage — delete it.
{
  const currentNames = new Set(
    JSON.parse(readFileSync(join(repoRoot, 'packages/ui/registry.json'), 'utf8')).items.map((i) => i.name),
  );
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json') && !SKIP.has(n))) {
    if (!currentNames.has(f.replace(/\.json$/, ''))) {
      rmSync(join(dir, f));
      console.log(`pruned stale ${f}`);
    }
  }
}

for (const f of readdirSync(dir).filter((n) => n.endsWith('.json') && !SKIP.has(n))) {
  const itemPath = join(dir, f);
  const item = JSON.parse(readFileSync(itemPath, 'utf8'));
  const integrity = item.meta?.integrity;
  if (!integrity) {
    console.error(`✗ ${item.name ?? f}: missing meta.integrity — run registry-stamp.mjs first`);
    process.exit(1);
  }

  let jsonChanged = false;
  for (const file of item.files ?? []) {
    if (typeof file.content !== 'string') continue;

    // JSON payloads (registry:file data fixtures, e.g. a block's data.json) can't carry a `//`
    // provenance header — it would corrupt the JSON. Their integrity is still covered by the
    // ITEM-level meta.integrity hash; skip per-file stamping entirely.
    if (file.path?.endsWith('.json')) continue;

    // (a) refresh header on the registry-JSON content
    const stamped = applyProvenanceHeader(file.content, item.name, version, integrity);
    if (stamped !== file.content) {
      file.content = stamped;
      jsonChanged = true;
    }

    // (b) refresh header at the top of the registry SOURCE file
    if (file.path) {
      const srcPath = join(repoRoot, file.path);
      if (existsSync(srcPath)) {
        const srcRaw = readFileSync(srcPath, 'utf8');
        const srcStamped = applyProvenanceHeader(srcRaw, item.name, version, integrity);
        if (srcStamped !== srcRaw) {
          writeFileSync(srcPath, srcStamped);
          stampedSources++;
        }
      } else {
        console.error(`✗ ${item.name}: registry source not found at ${file.path}`);
        process.exit(1);
      }

      // (c) re-sync the docs copy-in from the (now header-stamped) source so it is byte-identical.
      // CREATES the copy-in when missing (a renamed or brand-new registry item) — the copy-in is
      // generated output, so absence is never meaningful.
      // ONLY `@placeholder/` targets are docs copy-ins. Plain-path targets (registry:page /
      // registry:file, e.g. a block's `app/dashboard/page.tsx`) address the CONSUMER app's file
      // tree — installing them into the docs app would create real routes there (caught: the
      // dashboard-01 block briefly shipped a broken /dashboard route into the showcase).
      if (file.target && file.target.startsWith('@')) {
        const copyPath = resolveDocsCopyPath(file.target);
        const sourceContent = readFileSync(join(repoRoot, file.path), 'utf8');
        const copyContent = existsSync(copyPath) ? readFileSync(copyPath, 'utf8') : null;
        if (sourceContent !== copyContent) {
          mkdirSync(dirname(copyPath), { recursive: true });
          writeFileSync(copyPath, sourceContent);
          syncedCopyIns++;
        }
      }
    }
  }

  if (jsonChanged) {
    writeFileSync(itemPath, JSON.stringify(item, null, 2));
    stampedItems++;
  }
}

console.log(
  `stamped provenance header v${version}: ${stampedItems} item JSON(s), ${stampedSources} source file(s), ${syncedCopyIns} copy-in(s) updated`,
);

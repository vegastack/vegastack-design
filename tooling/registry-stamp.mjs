// Run AFTER `shadcn build`: stamp each item's meta.integrity + emit a manifest.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { itemHash } from './registry-hash.mjs';

const dir = 'apps/docs/public/r';
const manifest = {};

// The hash is computed over each PER-ITEM file (which carries files[].content). Skip the manifest and
// the index — those are stamped separately below.
const SKIP = new Set(['integrity-manifest.json', 'registry.json']);
for (const f of readdirSync(dir).filter((n) => n.endsWith('.json') && !SKIP.has(n))) {
  const item = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const hash = itemHash(item);
  item.meta = { ...(item.meta ?? {}), integrity: hash };
  writeFileSync(`${dir}/${f}`, JSON.stringify(item, null, 2));
  manifest[item.name] = hash;
}

writeFileSync(`${dir}/integrity-manifest.json`, JSON.stringify(manifest, null, 2));

// Mirror each item's integrity into the public registry INDEX (`registry.json`) so the catalog is
// self-describing for drift inspection (Codex R16): a consumer reading the index sees the same
// `meta.integrity` the per-item file + the signed manifest carry. (The index lists items WITHOUT
// `files[].content`, so its integrity is the per-item hash, not a hash of the contentless index
// entry.) The build-INPUT source `packages/ui/registry.json` is intentionally left unstamped — it has
// no content + is not a distributed artifact.
const indexPath = `${dir}/registry.json`;
let stampedIndex = 0;
try {
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  for (const item of index.items ?? []) {
    if (manifest[item.name]) {
      item.meta = { ...(item.meta ?? {}), integrity: manifest[item.name] };
      stampedIndex++;
    }
  }
  writeFileSync(indexPath, JSON.stringify(index, null, 2));
} catch (err) {
  console.error(`✗ could not stamp registry index ${indexPath}: ${err.message}`);
  process.exit(1);
}

console.log(`stamped ${Object.keys(manifest).length} registry items + ${stampedIndex} index entries`);

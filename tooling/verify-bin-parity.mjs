// Guards against the two item-hash implementations diverging.
// The shipped bin (packages/design/bin/verify-registry-item.mjs) INLINES the canonical
// hash logic; tooling/registry-hash.mjs is the source of truth. This asserts both produce
// the SAME hash for a known registry item, and that the hash matches the item's stored
// meta.integrity. Run in CI (Node 24).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { itemHash as canonicalHash } from './registry-hash.mjs';
import { itemHash as binHash } from '../packages/design/bin/verify-registry-item.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const itemPath = join(here, '..', 'apps', 'docs', 'public', 'r', 'button.json');
const item = JSON.parse(readFileSync(itemPath, 'utf8'));

const fromTooling = canonicalHash(item);
const fromBin = binHash(item);
const stored = item.meta?.integrity;

let ok = true;
if (fromTooling !== fromBin) {
  console.error(`HASH PARITY FAIL: tooling=${fromTooling} bin=${fromBin}`);
  ok = false;
}
if (fromBin !== stored) {
  console.error(`HASH vs meta.integrity FAIL: bin=${fromBin} stored=${stored}`);
  ok = false;
}
if (!ok) process.exit(1);
console.log(`hash parity OK (button): ${fromBin}`);

// Guards against the two item-hash implementations diverging.
// The shipped bin (packages/design/bin/verify-registry-item.mjs) INLINES the canonical
// hash logic; tooling/registry-hash.mjs is the source of truth. This asserts both produce
// the SAME hash for every built registry item, and that each hash matches the item's stored
// meta.integrity. It also pins the duplicated consumer/tooling Sigstore default exactly. Run in CI.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { itemHash as canonicalHash } from "./registry-hash.mjs";
import { itemHash as binHash } from "../packages/design/bin/verify-registry-item.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const registryDir = join(root, "apps", "docs", "public", "r");
const itemFiles = readdirSync(registryDir)
  .filter(
    (name) =>
      name.endsWith(".json") &&
      !["integrity-manifest.json", "registry.json"].includes(name),
  )
  .sort();

assert.ok(itemFiles.length > 0, "registry parity gate found zero item files");
for (const file of itemFiles) {
  const item = JSON.parse(readFileSync(join(registryDir, file), "utf8"));
  const fromTooling = canonicalHash(item);
  const fromBin = binHash(item);
  assert.equal(
    fromBin,
    fromTooling,
    `${file}: shipped bin hash diverges from canonical tooling`,
  );
  assert.equal(
    fromBin,
    item.meta?.integrity,
    `${file}: computed hash diverges from meta.integrity`,
  );
}

const expectedSigner =
  /process\.env\.VEGASTACK_SIGNER_REPO\s*\?\?\s*["']vegastack\/vegastack-design["']/;
for (const file of [
  "packages/design/bin/verify-registry-item.mjs",
  "tooling/verify-item.mjs",
]) {
  assert.match(
    readFileSync(join(root, file), "utf8"),
    expectedSigner,
    `${file}: Sigstore signer default must preserve the canonical lowercase GitHub repository identity`,
  );
}

console.log(
  `verify-bin-parity: ${itemFiles.length}/${itemFiles.length} hashes + signer identity match`,
);

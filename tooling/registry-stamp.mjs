// Run AFTER `shadcn build`: prune stale output, stamp each expected item's
// meta.integrity, and emit an exact manifest.
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { itemHash } from "./registry-hash.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(repoRoot, "apps/docs/public/r");
const sourceRegistry = JSON.parse(
  readFileSync(join(repoRoot, "packages/ui/registry.json"), "utf8"),
);
const sourceNames = (sourceRegistry.items ?? []).map((item) => item.name);
const expectedNames = [...sourceNames].sort();
const uniqueNames = new Set(expectedNames);

if (sourceNames.some((name) => typeof name !== "string" || name.length === 0)) {
  throw new Error(
    "packages/ui/registry.json contains an item without a valid name",
  );
}
if (uniqueNames.size !== expectedNames.length) {
  throw new Error("packages/ui/registry.json contains duplicate item names");
}

const manifest = {};

// `shadcn build` is additive-only. Prune item files that no longer exist in the machine authority
// before hashing so a rename/removal is correct in a single build, not only after a second run.
const SKIP = new Set(["integrity-manifest.json", "registry.json"]);
for (const filename of readdirSync(dir).filter(
  (name) => name.endsWith(".json") && !SKIP.has(name),
)) {
  if (!uniqueNames.has(filename.replace(/\.json$/, ""))) {
    rmSync(join(dir, filename));
    console.log(`pruned stale ${filename}`);
  }
}

// Hash exactly the expected per-item files in stable source-name order. Filename and embedded item
// identity must agree; otherwise a misplaced or duplicate payload could be signed under the wrong
// catalog entry.
for (const name of expectedNames) {
  const itemPath = join(dir, `${name}.json`);
  if (!existsSync(itemPath)) {
    throw new Error(
      `shadcn build did not emit expected registry item: ${name}.json`,
    );
  }
  const item = JSON.parse(readFileSync(itemPath, "utf8"));
  if (item.name !== name) {
    throw new Error(
      `${name}.json embeds item name ${JSON.stringify(item.name)} instead of ${JSON.stringify(name)}`,
    );
  }
  const hash = itemHash(item);
  item.meta = { ...(item.meta ?? {}), integrity: hash };
  writeFileSync(itemPath, JSON.stringify(item, null, 2));
  manifest[name] = hash;
}

writeFileSync(
  join(dir, "integrity-manifest.json"),
  JSON.stringify(manifest, null, 2),
);

// Mirror each item's integrity into the public registry INDEX (`registry.json`) so the catalog is
// self-describing for drift inspection (Codex R16): a consumer reading the index sees the same
// `meta.integrity` the per-item file + the signed manifest carry. (The index lists items WITHOUT
// `files[].content`, so its integrity is the per-item hash, not a hash of the contentless index
// entry.) The build-INPUT source `packages/ui/registry.json` is intentionally left unstamped — it has
// no content + is not a distributed artifact.
const indexPath = join(dir, "registry.json");
let stampedIndex = 0;
try {
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  const indexItems = index.items ?? [];
  const indexNames = indexItems.map((item) => item.name);
  const indexSet = new Set(indexNames);
  const missing = expectedNames.filter((name) => !indexSet.has(name));
  const unexpected = indexNames.filter((name) => !uniqueNames.has(name));
  if (
    indexSet.size !== indexNames.length ||
    missing.length ||
    unexpected.length
  ) {
    throw new Error(
      `registry index does not exactly match source authority ` +
        `(duplicates=${indexNames.length - indexSet.size}, missing=${missing.join(",") || "none"}, ` +
        `unexpected=${unexpected.join(",") || "none"})`,
    );
  }
  for (const item of indexItems) {
    item.meta = { ...(item.meta ?? {}), integrity: manifest[item.name] };
    stampedIndex++;
  }
  writeFileSync(indexPath, JSON.stringify(index, null, 2));
} catch (err) {
  console.error(
    `✗ could not stamp registry index ${indexPath}: ${err.message}`,
  );
  process.exit(1);
}

console.log(
  `stamped ${Object.keys(manifest).length} registry items + ${stampedIndex} index entries`,
);

#!/usr/bin/env node

import assert from "node:assert/strict";

import { retainInventoryPaths } from "./lib/change-set.mjs";

const raw = (entries) =>
  new Map(
    entries.map(([path, status, oldMode, newMode]) => [
      path,
      { status, oldMode, newMode },
    ]),
  );

const allChanged = [
  "provenance-only.tsx",
  "content.tsx",
  "mode-only.sh",
  "empty-added",
  "empty-deleted",
  "rename-old",
  "rename-new",
  "type-changed",
  "untracked.bin",
];
const retained = retainInventoryPaths({
  allChanged,
  substantive: ["content.tsx"],
  rawByPath: raw([
    ["provenance-only.tsx", "M", "100644", "100644"],
    ["content.tsx", "M", "100644", "100644"],
    ["mode-only.sh", "M", "100644", "100755"],
    ["empty-added", "A", "000000", "100644"],
    ["empty-deleted", "D", "100644", "000000"],
    ["rename-old", "D", "100644", "000000"],
    ["rename-new", "A", "000000", "100644"],
    ["type-changed", "T", "100644", "120000"],
  ]),
  untracked: new Set(["untracked.bin"]),
});

assert.deepEqual(retained, [
  "content.tsx",
  "mode-only.sh",
  "empty-added",
  "empty-deleted",
  "rename-old",
  "rename-new",
  "type-changed",
  "untracked.bin",
]);
assert.equal(retained.includes("provenance-only.tsx"), false);

console.log(
  "✓ change inventory: provenance-only content drops, while mode/type/add/delete/rename/untracked mutations remain fail-closed",
);

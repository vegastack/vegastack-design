#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { reconcileGateTree } from "./lib/gate-tree.mjs";

const start = { hash: "a".repeat(64), files: ["a.ts", "b.ts"] };
assert.deepEqual(reconcileGateTree(start, { ...start }), {
  ...start,
  unchanged: true,
});
assert.throws(
  () => reconcileGateTree(start, { ...start, hash: "b".repeat(64) }),
  /changed during gate execution/,
);
assert.throws(
  () => reconcileGateTree(start, { ...start, files: ["a.ts", "c.ts"] }),
  /changed during gate execution/,
  "same-hash malformed file-universe replacement must fail",
);
assert.throws(() => reconcileGateTree({}, start), /must contain/);
const gateSource = readFileSync("tooling/gates.mjs", "utf8");
const receiptBody = /function writeReceipt\(\) \{([\s\S]*?)\n\}/.exec(
  gateSource,
)?.[1];
assert.ok(receiptBody, "writeReceipt implementation must remain inspectable");
assert.doesNotMatch(
  receiptBody,
  /workingTreeContentHash/,
  "receipt construction must use the already-reconciled tree, never a later rehash",
);
assert.match(receiptBody, /const \{ hash, files \} = gateTree/);

console.log(
  "✓ gate tree: hash/file-universe changes and malformed snapshots fail closed",
);

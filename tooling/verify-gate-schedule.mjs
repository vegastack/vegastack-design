#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function body(source, name, endMarker) {
  const start = source.indexOf(`async function ${name}()`);
  const end = source.indexOf(endMarker, start + 1);
  assert.ok(start >= 0 && end > start, `could not isolate ${name}`);
  return source.slice(start, end);
}

function verify(source) {
  const problems = [];
  for (const [name, endMarker] of [
    ["runPush", "async function runComponent()"],
    ["runComponent", "async function runShip()"],
    ["runShip", "function writeReceipt()"],
  ]) {
    const lane = body(source, name, endMarker);
    const start = lane.indexOf("startDocsBuild()");
    const barrier = lane.indexOf("await awaitDocsBuild()");
    const unit = lane.indexOf('gate("unit"');
    if (!(start >= 0 && barrier > start && unit > barrier))
      problems.push(
        `${name} must finish the docs warm-up before every browser lane`,
      );
  }
  return problems;
}

const source = readFileSync("tooling/gates.mjs", "utf8");
assert.deepEqual(verify(source), []);

let mutations = 0;
for (const [name, endMarker] of [
  ["runPush", "async function runComponent()"],
  ["runComponent", "async function runShip()"],
  ["runShip", "function writeReceipt()"],
]) {
  const lane = body(source, name, endMarker);
  const mutated = source.replace(
    lane,
    lane.replace(/\s*await awaitDocsBuild\(\);/, ""),
  );
  assert.ok(
    verify(mutated).some((problem) => problem.startsWith(name)),
    `${name} overlap mutation was not rejected`,
  );
  mutations += 1;
}

console.log(
  `✓ gate schedule: component + push + ship finish docs warm-up before every browser lane; ${mutations} overlap mutations rejected`,
);

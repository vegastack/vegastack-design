#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function body(source, name, endMarker) {
  const start = source.indexOf(`async function ${name}()`);
  const end = source.indexOf(endMarker, start + 1);
  assert.ok(start >= 0 && end > start, `could not isolate ${name}`);
  return source.slice(start, end);
}

function occurrences(source, needle) {
  const found = [];
  let offset = 0;
  while (true) {
    const index = source.indexOf(needle, offset);
    if (index < 0) return found;
    found.push(index);
    offset = index + needle.length;
  }
}

const BROWSER_WRAPPERS = [
  '"tooling/vitest-run.mjs"',
  '"tooling/contracts-run.mjs"',
];

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
    // Browser execution is owned by the structured Vitest and contract wrappers. Enumerate every
    // occurrence: keeping unit behind the barrier must not hide smoke/all-browser/contracts moving
    // ahead of it.
    const browserInvocations = BROWSER_WRAPPERS.flatMap((wrapper) =>
      occurrences(lane, wrapper),
    ).sort((left, right) => left - right);
    if (!(
      start >= 0 &&
      barrier > start &&
      browserInvocations.length > 0 &&
      browserInvocations.every((index) => index > barrier)
    ))
      problems.push(
        `${name} must finish the docs warm-up before every browser lane`,
      );
    if (
      name === "runComponent" &&
      (!lane.includes("if (closure.length > 0) startDocsBuild();") ||
        !lane.includes("if (closure.length > 0) await awaitDocsBuild();"))
    )
      problems.push(
        "runComponent must guard both docs warm-up start and barrier with the same nonempty route closure",
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

  const wrappers = BROWSER_WRAPPERS.flatMap((wrapper) =>
    occurrences(lane, wrapper).map((index) => ({ index, wrapper })),
  ).sort((left, right) => left.index - right.index);
  for (const [browserIndex, { index, wrapper }] of wrappers.entries()) {
    const marker = `__moved_browser_${name}_${browserIndex}__`;
    const withoutOccurrence =
      lane.slice(0, index) + marker + lane.slice(index + wrapper.length);
    const movedLane = withoutOccurrence
      .replace(
        "await awaitDocsBuild();",
        `${wrapper};\n  await awaitDocsBuild();`,
      )
      .replace(marker, wrapper);
    const moved = source.replace(lane, movedLane);
    assert.ok(
      verify(moved).some((problem) => problem.startsWith(name)),
      `${name} browser occurrence ${browserIndex + 1} pre-barrier mutation was not rejected`,
    );
    mutations += 1;
  }
}

const componentLane = body(source, "runComponent", "async function runShip()");
for (const [label, mutatedLane] of [
  [
    "warm-up start",
    componentLane.replace(
      "if (closure.length > 0) startDocsBuild();",
      "startDocsBuild();",
    ),
  ],
  [
    "warm-up barrier",
    componentLane.replace(
      "if (closure.length > 0) await awaitDocsBuild();",
      "await awaitDocsBuild();",
    ),
  ],
]) {
  assert.ok(
    verify(source.replace(componentLane, mutatedLane)).some((problem) =>
      problem.includes("same nonempty route closure"),
    ),
    `runComponent route-less ${label} guard mutation was not rejected`,
  );
  mutations += 1;
}

console.log(
  `✓ gate schedule: component + push + ship finish docs warm-up before every Vitest/contract browser lane; ${mutations} overlap/guard mutations rejected`,
);

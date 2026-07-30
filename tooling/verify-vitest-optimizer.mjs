#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const CONFIG = "packages/ui/vitest.config.ts";
const REQUIRED_ENTRIES = ["registry/**/*.test.tsx", "test/**/*.test.tsx"];
const REQUIRED_LINKED = ["@vegastack/design", "@vegastack/design/theme-scope"];

function verify(source) {
  const problems = [];
  for (const entry of REQUIRED_ENTRIES)
    if (!source.includes(`"${entry}"`))
      problems.push(`optimizer does not crawl browser test entry ${entry}`);
  for (const dependency of REQUIRED_LINKED)
    if (!source.includes(`"${dependency}"`))
      problems.push(
        `optimizer does not pre-bundle linked package ${dependency}`,
      );
  return problems;
}

const source = readFileSync(CONFIG, "utf8");
assert.deepEqual(verify(source), []);

let mutations = 0;
for (const [label, token, pattern] of [
  ["test entry removed", REQUIRED_ENTRIES[0], /does not crawl/],
  ["linked root removed", REQUIRED_LINKED[0], /does not pre-bundle/],
  ["linked subpath removed", REQUIRED_LINKED[1], /does not pre-bundle/],
]) {
  const mutated = source.replace(`"${token}"`, '"removed-by-mutation"');
  assert.ok(
    verify(mutated).some((problem) => pattern.test(problem)),
    `${label} did not fail for ${pattern}`,
  );
  mutations += 1;
}

console.log(
  `✓ vitest optimizer: ${REQUIRED_ENTRIES.length} browser entry globs + ` +
    `${REQUIRED_LINKED.length} linked entrypoints; ${mutations} mutations rejected`,
);

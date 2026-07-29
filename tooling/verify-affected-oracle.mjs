#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  oracleEnvironment,
  PRODUCTION_ORACLE_GATES,
  validateAffectedOracle,
} from "./lib/affected-oracle.mjs";

const startedAt = "2026-07-30T10:00:00.000Z";
const tree = "tree-example";
const summary = {
  mode: "ship",
  profile: "production-full",
  tree,
  runId: "run-current",
  startedAt: "2026-07-30T10:00:01.000Z",
  completedAt: "2026-07-30T10:00:02.000Z",
  gates: PRODUCTION_ORACLE_GATES.map((id) => ({
    id,
    status: "pass",
    required: id !== "docs-warmup",
  })),
};
const input = {
  mode: "ship",
  profile: "production-full",
  tree,
  startedAt,
  processResult: { status: 0, signal: null },
  summary,
};
assert.equal(validateAffectedOracle(input).outcome, "pass");

for (const [label, mutate, expected] of [
  [
    "GATES_SKIP exit-zero",
    (value) => {
      value.summary.gates.find((gate) => gate.id === "unit").status = "fail";
    },
    /exit 0 conflicts/,
  ],
  [
    "signal termination",
    (value) => {
      value.processResult = { status: null, signal: "SIGTERM" };
    },
    /ordinary integer exit status|signal/,
  ],
  [
    "stale summary",
    (value) => {
      value.summary.startedAt = "2026-07-30T09:59:00.000Z";
    },
    /predates/,
  ],
  [
    "wrong tree",
    (value) => {
      value.summary.tree = "tree-stale";
    },
    /summary tree/,
  ],
]) {
  const value = structuredClone(input);
  mutate(value);
  assert.match(
    validateAffectedOracle(value).problems.join("; "),
    expected,
    label,
  );
}

for (const id of PRODUCTION_ORACLE_GATES) {
  const value = structuredClone(input);
  value.summary.gates = value.summary.gates.filter((gate) => gate.id !== id);
  assert.match(
    validateAffectedOracle(value).problems.join("; "),
    new RegExp(`missing gates:.*${id}`),
    `missing production gate ${id}`,
  );
}
for (const id of PRODUCTION_ORACLE_GATES.filter(
  (candidate) => candidate !== "docs-warmup",
)) {
  const value = structuredClone(input);
  const gate = value.summary.gates.find((entry) => entry.id === id);
  gate.required = false;
  gate.status = "skipped";
  assert.match(
    validateAffectedOracle(value).problems.join("; "),
    /must be marked required|invalid required status/,
    `required-bit/status mutation ${id}`,
  );
}

const failedSummary = structuredClone(summary);
failedSummary.gates.find((gate) => gate.id === "unit").status = "fail";
const failure = {
  mode: "ship",
  runId: failedSummary.runId,
  tree,
  completedAt: "2026-07-30T10:00:02.000Z",
  failures: [{ id: "unit", status: "fail", required: true }],
};
const failedInput = {
  ...input,
  processResult: { status: 1, signal: null },
  summary: failedSummary,
  failure,
};
assert.equal(validateAffectedOracle(failedInput).outcome, "fail");
for (const [label, mutate, expected] of [
  [
    "stale failure run",
    (value) => {
      value.failure.runId = "run-stale";
    },
    /runId/,
  ],
  [
    "stale failure time",
    (value) => {
      value.failure.completedAt = "2026-07-30T09:00:00.000Z";
    },
    /predates/,
  ],
  [
    "continued failure missing",
    (value) => {
      value.failure = null;
    },
    /no parseable last-failure/,
  ],
]) {
  const value = structuredClone(failedInput);
  mutate(value);
  assert.match(
    validateAffectedOracle(value).problems.join("; "),
    expected,
    label,
  );
}

assert.throws(
  () => oracleEnvironment({ GATES_SKIP: "continue anyway" }),
  /forbidden/,
);
assert.equal(oracleEnvironment({ SAFE: "1" }).SAFE, "1");

console.log(
  "✓ affected oracle: fresh exact-tree summaries and matching failures required; skip/continued/signal/stale mutations fail closed",
);

#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  atomicWriteJson,
  cohortKey,
  summarizeMeasurements,
  validateMeasurement,
} from "./lib/measurement-report.mjs";

function specimen(overrides = {}) {
  return {
    schema: "vegastack.measurement/v1",
    generation: "gate-generation-a",
    runId: "run-a",
    kind: "local-gate",
    mode: "ship",
    segment: "contracts",
    status: "pass",
    startedAt: "2026-07-28T00:00:00.000Z",
    completedAt: "2026-07-28T00:00:01.000Z",
    durationMs: 1000,
    measurementClass: "measured",
    scope: { routeCount: 108, checkCount: 864 },
    environment: {
      profile: "darwin-arm64-node24-local",
      runnerType: "local",
      platform: "darwin",
      arch: "arm64",
      node: "v24.18.0",
    },
    cache: { state: "unknown" },
    retryCount: 0,
    ...overrides,
  };
}

assert.deepEqual(validateMeasurement(specimen()), []);

for (const [name, mutation, expected] of [
  ["unknown schema", { schema: "measurement/v0" }, /schema/],
  ["invented class", { measurementClass: "observed-ish" }, /measurementClass/],
  ["negative duration", { durationMs: -1 }, /durationMs/],
  ["missing generation", { generation: "" }, /generation/],
  ["missing environment", { environment: null }, /environment/],
  ["negative retry", { retryCount: -1 }, /retryCount/],
  ["invented status", { status: "probably-pass" }, /status/],
]) {
  assert.match(
    validateMeasurement(specimen(mutation)).join("; "),
    expected,
    name,
  );
}

const samples = [
  specimen({ runId: "a", durationMs: 1000 }),
  specimen({ runId: "b", durationMs: 2000 }),
  specimen({ runId: "c", durationMs: 3000 }),
];
const [summary] = summarizeMeasurements(samples);
assert.equal(summary.sampleSize, 3);
assert.equal(summary.p50Ms, 2000);
assert.equal(summary.p95Ms, 3000);

const mixedGeneration = specimen({ generation: "gate-generation-b" });
const mixedRouteCount = specimen({
  scope: { routeCount: 23, checkCount: 184 },
});
assert.notEqual(cohortKey(specimen()), cohortKey(mixedGeneration));
assert.notEqual(cohortKey(specimen()), cohortKey(mixedRouteCount));
assert.equal(
  summarizeMeasurements([specimen(), mixedGeneration, mixedRouteCount]).length,
  3,
  "generation or route-count differences must form separate cohorts",
);

const scratch = mkdtempSync(join(tmpdir(), "measurement-report-"));
try {
  const immutable = join(scratch, "run", "total.json");
  atomicWriteJson(immutable, specimen(), { immutable: true });
  atomicWriteJson(immutable, specimen(), { immutable: true });
  assert.match(readFileSync(immutable, "utf8"), /vegastack\.measurement\/v1/);
  assert.throws(
    () =>
      atomicWriteJson(immutable, specimen({ durationMs: 9999 }), {
        immutable: true,
      }),
    /conflicting immutable measurement key/,
  );
} finally {
  rmSync(scratch, { recursive: true });
}

console.log(
  "✓ measurement report: schema mutations rejected; p50/p95 retain generation + route/check cohort boundaries",
);

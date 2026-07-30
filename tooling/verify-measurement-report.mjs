#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  atomicWriteJson,
  cohortKey,
  gateGeneration,
  generationInputPaths,
  localEnvironment,
  summarizeMeasurements,
  validateMeasurement,
} from "./lib/measurement-report.mjs";
import { ROOT } from "./lib/change-set.mjs";

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
assert.notEqual(
  localEnvironment({ osRelease: "kernel-a" }).profile,
  localEnvironment({ osRelease: "kernel-b" }).profile,
  "an OS/kernel upgrade must create a new gate/affected/report cohort",
);

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

const generation = gateGeneration();
for (const authority of [
  "tooling/lib/import-closure.mjs",
  "tooling/lib/vitest-selection.mjs",
  "tooling/lib/vrt-selection.mjs",
  "tooling/lib/affected-oracle.mjs",
  "tooling/lib/consume-plan.mjs",
  "tooling/impact-plan.mjs",
  "packages/ui/smoke-impact.generated.json",
]) {
  assert.ok(generationInputPaths().includes(authority), `${authority} missing`);
  assert.notEqual(
    gateGeneration({
      contentOverride: new Map([[authority, `mutation:${authority}`]]),
    }),
    generation,
    `${authority} must change the gate generation`,
  );
}

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
  const target = join(scratch, "target.json");
  writeFileSync(target, `${JSON.stringify(specimen(), null, 2)}\n`);
  const symlink = join(scratch, "symlink.json");
  symlinkSync(target, symlink);
  assert.throws(
    () => atomicWriteJson(symlink, specimen(), { immutable: true }),
    /not a regular file/,
    "an immutable key must never follow a same-byte symlink",
  );
  const directory = join(scratch, "directory.json");
  mkdirSync(directory);
  assert.throws(
    () => atomicWriteJson(directory, specimen(), { immutable: true }),
    /not a regular file/,
    "an immutable key must never accept a directory",
  );
} finally {
  rmSync(scratch, { recursive: true });
}

mkdirSync(join(ROOT, ".gates", "diagnostics"), { recursive: true });
const parentFixture = mkdtempSync(
  join(ROOT, ".gates", "diagnostics", "measurement-parent-"),
);
const outsideParent = mkdtempSync(join(tmpdir(), "measurement-parent-target-"));
try {
  symlinkSync(outsideParent, join(parentFixture, "redirect"));
  assert.throws(
    () =>
      atomicWriteJson(join(parentFixture, "redirect", "run.json"), specimen(), {
        immutable: true,
      }),
    /parent is not a regular directory/,
    "a measurement write must not traverse a symlinked .gates parent",
  );
} finally {
  rmSync(parentFixture, { recursive: true, force: true });
  rmSync(outsideParent, { recursive: true, force: true });
}

console.log(
  "✓ measurement report: schema mutations rejected; p50/p95 retain generation + route/check cohort boundaries",
);

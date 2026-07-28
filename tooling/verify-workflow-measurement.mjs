#!/usr/bin/env node

import assert from "node:assert/strict";

import { dependencySetupMeasurement } from "./lib/workflow-measurement.mjs";

const measured = dependencySetupMeasurement({
  startedSeconds: 100,
  setupCompletedSeconds: 112,
  installCompletedSeconds: 135,
  cohort: "control-actions-pnpm-cache",
  installOutcome: "success",
  runnerId: "mini-a",
  storeBytes: 1234,
});
assert.equal(measured.setupDurationMs, 12_000);
assert.equal(measured.installDurationMs, 23_000);
assert.equal(measured.totalDurationMs, 35_000);
assert.equal(measured.measurementClass, "measured");

for (const [name, mutation, expected] of [
  ["unknown cohort", { cohort: "fast-path" }, /cohort/],
  ["backwards setup", { setupCompletedSeconds: 99 }, /monotonic/],
  ["backwards install", { installCompletedSeconds: 111 }, /monotonic/],
  ["invented outcome", { installOutcome: "mostly-good" }, /outcome/],
  ["negative store", { storeBytes: -1 }, /storeBytes/],
]) {
  assert.throws(
    () =>
      dependencySetupMeasurement({
        startedSeconds: 100,
        setupCompletedSeconds: 112,
        installCompletedSeconds: 135,
        cohort: "control-actions-pnpm-cache",
        installOutcome: "success",
        runnerId: "mini-a",
        storeBytes: 1234,
        ...mutation,
      }),
    expected,
    name,
  );
}

console.log(
  "✓ workflow measurement: control/canary setup+install timing schema and 5 mutations fail closed",
);

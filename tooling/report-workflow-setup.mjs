#!/usr/bin/env node

import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { atomicWriteJson } from "./lib/measurement-report.mjs";
import { dependencySetupMeasurement } from "./lib/workflow-measurement.mjs";

function seconds(path) {
  const value = Number.parseInt(readFileSync(path, "utf8").trim(), 10);
  if (!Number.isInteger(value)) throw new Error(`invalid timestamp in ${path}`);
  return value;
}

for (const name of [
  "RUNNER_TEMP",
  "GITHUB_STEP_SUMMARY",
  "DEPENDENCY_CACHE_COHORT",
  "DEPENDENCY_INSTALL_OUTCOME",
  "DEPENDENCY_RUNNER_ID",
]) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const start = join(process.env.RUNNER_TEMP, "dependency-setup-start-seconds");
const setup = join(process.env.RUNNER_TEMP, "dependency-setup-end-seconds");
const install = join(process.env.RUNNER_TEMP, "dependency-install-end-seconds");
const storeBytes = process.env.PNPM_STORE_BYTES
  ? Number.parseInt(process.env.PNPM_STORE_BYTES, 10)
  : null;
const report = dependencySetupMeasurement({
  startedSeconds: seconds(start),
  setupCompletedSeconds: seconds(setup),
  installCompletedSeconds: seconds(install),
  cohort: process.env.DEPENDENCY_CACHE_COHORT,
  installOutcome: process.env.DEPENDENCY_INSTALL_OUTCOME,
  runnerId: process.env.DEPENDENCY_RUNNER_ID,
  storeBytes,
});

atomicWriteJson(
  join(process.env.RUNNER_TEMP, "dependency-setup-measurement.json"),
  report,
);
appendFileSync(
  process.env.GITHUB_STEP_SUMMARY,
  `## Dependency setup measurement\n\n` +
    `- Cohort: \`${report.cohort}\`\n` +
    `- Runner: \`${report.runnerId}\`\n` +
    `- Setup/cache: ${report.setupDurationMs} ms (measured, one-second resolution)\n` +
    `- Frozen install: ${report.installDurationMs} ms (measured, one-second resolution; ${report.installOutcome})\n` +
    `- pnpm store: ${report.storeBytes.value ?? "unknown"} bytes (${report.storeBytes.measurementClass})\n` +
    `- Exact step/queue timing: API-reported after run completion\n\n` +
    `\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`,
);
console.log(JSON.stringify(report));

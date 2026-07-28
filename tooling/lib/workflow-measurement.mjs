export const DEPENDENCY_SETUP_COHORTS = new Set([
  "control-actions-pnpm-cache",
  "canary-runner-local-store",
]);

export function dependencySetupMeasurement({
  startedSeconds,
  setupCompletedSeconds,
  installCompletedSeconds,
  cohort,
  installOutcome,
  runnerId,
  storeBytes = null,
}) {
  for (const [name, value] of Object.entries({
    startedSeconds,
    setupCompletedSeconds,
    installCompletedSeconds,
  })) {
    if (!Number.isInteger(value) || value < 0)
      throw new Error(`${name} must be a nonnegative integer`);
  }
  if (
    setupCompletedSeconds < startedSeconds ||
    installCompletedSeconds < setupCompletedSeconds
  )
    throw new Error("setup/install timestamps must be monotonic");
  if (!DEPENDENCY_SETUP_COHORTS.has(cohort))
    throw new Error(`unknown dependency setup cohort: ${cohort}`);
  if (!["success", "failure", "cancelled", "skipped"].includes(installOutcome))
    throw new Error(`unknown install outcome: ${installOutcome}`);
  if (typeof runnerId !== "string" || runnerId.length === 0)
    throw new Error("runnerId must be nonempty");
  if (
    storeBytes !== null &&
    (!Number.isSafeInteger(storeBytes) || storeBytes < 0)
  )
    throw new Error("storeBytes must be null or a nonnegative safe integer");

  return {
    schema: "vegastack.workflow-measurement/v1",
    kind: "dependency-setup",
    measurementClass: "measured",
    cohort,
    runnerId,
    installOutcome,
    setupDurationMs: (setupCompletedSeconds - startedSeconds) * 1000,
    installDurationMs: (installCompletedSeconds - setupCompletedSeconds) * 1000,
    totalDurationMs: (installCompletedSeconds - startedSeconds) * 1000,
    storeBytes: {
      measurementClass: storeBytes === null ? "unknown" : "measured",
      value: storeBytes,
    },
    apiStepTiming: {
      measurementClass: "api-reported",
      value: "read from the GitHub Actions run after completion",
    },
  };
}

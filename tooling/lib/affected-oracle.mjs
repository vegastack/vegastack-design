function timestamp(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameFailedGateUniverse(summary, failure) {
  const summaryIds = new Set(
    summary.gates
      .filter((gate) => gate.required !== false && gate.status === "fail")
      .map((gate) => gate.id),
  );
  const failureIds = new Set((failure.failures ?? []).map((gate) => gate.id));
  return (
    summaryIds.size === failureIds.size &&
    [...summaryIds].every((id) => failureIds.has(id))
  );
}

export const PRODUCTION_ORACLE_GATES = [
  "typecheck",
  "lint",
  "docs-warmup",
  "unit",
  "smoke",
  "all-browsers",
  "registry",
  "consume",
  "contracts",
];
export const CHANGE_ORACLE_GATES = [
  "typecheck",
  "lint",
  "unit",
  "smoke",
  "contracts",
];

/**
 * Validate an affected oracle from structured facts, never from its exit code alone.
 * A pass requires a fresh exact-tree summary with every required gate passing. A failure requires
 * that same summary plus the fresh, matching last-failure record from this invocation.
 */
export function validateAffectedOracle({
  mode,
  profile,
  tree,
  startedAt,
  processResult,
  summary,
  failure = null,
  expectedGateIds = profile === "production-full"
    ? PRODUCTION_ORACLE_GATES
    : CHANGE_ORACLE_GATES,
  optionalGateIds = profile === "production-full" ? [] : ["docs-warmup"],
  requiredGateIds = profile === "production-full"
    ? PRODUCTION_ORACLE_GATES.filter((id) => id !== "docs-warmup")
    : ["typecheck", "lint"],
}) {
  const problems = [];
  const startedMs = timestamp(startedAt);
  if (startedMs === null) problems.push("oracle start timestamp is malformed");
  if (!processResult || !Number.isInteger(processResult.status))
    problems.push("oracle has no ordinary integer exit status");
  if (processResult?.signal)
    problems.push(`oracle terminated by signal ${processResult.signal}`);
  if (!summary || typeof summary !== "object")
    problems.push("oracle wrote no parseable structured summary");
  else {
    if (summary.mode !== mode)
      problems.push(`oracle summary mode is ${summary.mode}, expected ${mode}`);
    if (summary.profile !== profile)
      problems.push(
        `oracle summary profile is ${summary.profile}, expected ${profile}`,
      );
    if (summary.tree !== tree)
      problems.push(`oracle summary tree is ${summary.tree}, expected ${tree}`);
    if (typeof summary.runId !== "string" || summary.runId.length === 0)
      problems.push("oracle summary runId is missing");
    const summaryStarted = timestamp(summary.startedAt);
    const summaryCompleted = timestamp(summary.completedAt);
    if (summaryStarted === null || summaryStarted < startedMs)
      problems.push("oracle summary predates this invocation");
    if (summaryCompleted === null || summaryCompleted < summaryStarted)
      problems.push("oracle summary completion timestamp is malformed");
    if (!Array.isArray(summary.gates) || summary.gates.length === 0)
      problems.push("oracle summary has no gate results");
    else {
      const ids = summary.gates.map((gate) => gate.id);
      if (new Set(ids).size !== ids.length)
        problems.push("oracle summary contains duplicate gate IDs");
      const allowed = new Set([...expectedGateIds, ...optionalGateIds]);
      const unknown = ids.filter((id) => !allowed.has(id));
      const missing = expectedGateIds.filter((id) => !ids.includes(id));
      if (unknown.length > 0)
        problems.push(
          `oracle summary contains unknown gates: ${unknown.join(", ")}`,
        );
      if (missing.length > 0)
        problems.push(`oracle summary is missing gates: ${missing.join(", ")}`);
      const requiredSet = new Set(requiredGateIds);
      for (const gate of summary.gates) {
        if (requiredSet.has(gate.id)) {
          if (gate.required !== true)
            problems.push(`${gate.id} must be marked required`);
          if (!new Set(["pass", "fail"]).has(gate.status))
            problems.push(
              `${gate.id} has invalid required status ${gate.status}`,
            );
        } else if (expectedGateIds.includes(gate.id) && gate.required !== false)
          problems.push(`${gate.id} must be marked non-required`);
      }
    }
  }

  if (problems.length > 0)
    return { valid: false, outcome: "unknown", problems };

  const requiredSet = new Set(requiredGateIds);
  const required = summary.gates.filter((gate) => requiredSet.has(gate.id));
  const nonpassing = required.filter((gate) => gate.status !== "pass");
  if (processResult.status === 0) {
    if (nonpassing.length > 0)
      problems.push(
        `exit 0 conflicts with nonpassing required gates: ${nonpassing.map((gate) => `${gate.id}:${gate.status}`).join(", ")}`,
      );
    return {
      valid: problems.length === 0,
      outcome: problems.length === 0 ? "pass" : "unknown",
      runId: summary.runId,
      problems,
    };
  }

  if (processResult.status !== 1)
    problems.push(`oracle exited ${processResult.status}; expected 0 or 1`);
  if (nonpassing.length === 0)
    problems.push("failed oracle summary has no nonpassing required gate");
  if (!failure || typeof failure !== "object")
    problems.push("failed oracle wrote no parseable last-failure record");
  else {
    if (failure.mode !== mode) problems.push("last-failure mode is stale");
    if (failure.runId !== summary.runId)
      problems.push("last-failure runId does not match the oracle summary");
    if (failure.tree !== tree)
      problems.push("last-failure tree does not match the oracle tree");
    const failedAt = timestamp(failure.completedAt);
    if (failedAt === null || failedAt < startedMs)
      problems.push("last-failure predates this invocation");
    if (!Array.isArray(failure.failures) || failure.failures.length === 0)
      problems.push("last-failure has no failed gate records");
    else if (!sameFailedGateUniverse(summary, failure))
      problems.push("last-failure gates disagree with the oracle summary");
  }
  return {
    valid: problems.length === 0,
    outcome: problems.length === 0 ? "fail" : "unknown",
    runId: summary.runId,
    failure,
    problems,
  };
}

export function oracleEnvironment(environment) {
  if (environment.GATES_SKIP)
    throw new Error(
      "GATES_SKIP is forbidden for affected oracles; a skipped gate cannot become checkpoint evidence",
    );
  const result = { ...environment };
  delete result.GATES_SKIP;
  return result;
}

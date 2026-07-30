import { createHash } from "node:crypto";

import {
  expectedContractLeaves,
  reconcileContractLeaves,
} from "./contract-selection.mjs";

const sorted = (values) => [...new Set(values)].sort();
const sameJson = (left, right) =>
  JSON.stringify(left) === JSON.stringify(right);

function commonProblems(
  report,
  { gate, runId, tree, generation, environmentProfile, runStartedAt },
) {
  const problems = [];
  const fail = (message) => problems.push(`${gate}: ${message}`);
  if (!report || typeof report !== "object")
    return [`${gate}: report is missing or malformed`];
  if (report.schema !== 1) fail("report schema is not 1");
  if (report.gate !== gate) fail(`report gate is ${report.gate ?? "missing"}`);
  if (report.runId !== runId)
    fail("report runId is stale or belongs to another gate run");
  if (report.generation !== generation) fail("report generation is stale");
  if (report.environmentProfile !== environmentProfile)
    fail("report environment profile is stale or foreign");
  if (
    report.treeBinding?.started !== tree ||
    report.treeBinding?.completed !== tree ||
    report.treeBinding?.unchanged !== true
  )
    fail("report is not bound to the exact unchanged gate tree");
  if (
    report.diagnosticOnly !== false ||
    report.selectedShadow !== false ||
    report.evidenceEligibility !== "gate-candidate" ||
    report.evidenceWritten !== true ||
    report.receiptWritten !== false
  )
    fail("diagnostic/shadow evidence cannot enter a receipt");
  if (report.state !== "executed/pass" || report.status !== "pass")
    fail("report does not record an executed/pass terminal state");
  const started = Date.parse(report.startedAt ?? "");
  const completed = Date.parse(report.completedAt ?? "");
  const gateStarted = Date.parse(runStartedAt);
  if (!Number.isFinite(completed) || completed < gateStarted)
    fail("report completion is missing or predates this gate invocation");
  if (
    report.startedAt !== undefined &&
    (!Number.isFinite(started) || started > completed)
  )
    fail("report start timestamp is malformed");
  return problems;
}

function diagnosticCommonProblems(
  report,
  { gate, runId, tree, generation, environmentProfile, runStartedAt },
) {
  const problems = [];
  const fail = (message) => problems.push(`${gate}: ${message}`);
  if (!report || typeof report !== "object")
    return [`${gate}: report is missing or malformed`];
  if (report.schema !== 1) fail("report schema is not 1");
  if (report.gate !== gate) fail(`report gate is ${report.gate ?? "missing"}`);
  if (report.runId !== runId)
    fail("report runId is stale or belongs to another selected run");
  if (report.generation !== generation) fail("report generation is stale");
  if (report.environmentProfile !== environmentProfile)
    fail("report environment profile is stale or foreign");
  if (
    report.treeBinding?.started !== tree ||
    report.treeBinding?.completed !== tree ||
    report.treeBinding?.unchanged !== true
  )
    fail("report is not bound to the exact unchanged selected-run tree");
  if (
    report.diagnosticOnly !== true ||
    report.selectedShadow !== true ||
    report.evidenceEligibility !== "diagnostic-only" ||
    report.evidenceWritten !== false ||
    report.receiptWritten !== false
  )
    fail("selected report crossed its diagnostic-only evidence boundary");
  if (
    !new Set(["executed/pass", "executed/fail"]).has(report.state) ||
    report.status !== (report.state === "executed/pass" ? "pass" : "fail")
  )
    fail("selected report has an invalid or contradictory terminal state");
  const completed = Date.parse(report.completedAt ?? "");
  if (!Number.isFinite(completed) || completed < Date.parse(runStartedAt))
    fail("report completion is missing or predates selected execution");
  return problems;
}

function vitestLeaf(entry) {
  if (
    typeof entry?.file !== "string" ||
    typeof entry?.engine !== "string" ||
    typeof entry?.testName !== "string"
  )
    return null;
  return `${entry.file}\0${entry.engine}\0${entry.testName}`;
}

export function validateVitestGateReport(report, context) {
  const problems = commonProblems(report, context);
  const fail = (message) => problems.push(`${context.gate}: ${message}`);
  if (!report || typeof report !== "object") return { problems };
  if (!Number.isInteger(report.executed) || report.executed <= 0)
    fail("executed count must be a positive integer");
  if (
    report.results?.passed !== report.executed ||
    report.results?.failed !== 0
  )
    fail("pass/fail counts do not prove every required test passed");
  if (
    (report.failures?.length ?? -1) !== 0 ||
    (report.unhandledErrors?.length ?? -1) !== 0
  )
    fail(
      "report contains failures, unhandled errors, or missing failure arrays",
    );
  if (!Array.isArray(report.executedLeaves)) {
    fail("executed leaf manifest is missing");
    return { problems };
  }
  const leaves = report.executedLeaves.map(vitestLeaf);
  if (leaves.some((leaf) => leaf === null))
    fail("executed leaf manifest is malformed");
  const validLeaves = leaves.filter(Boolean);
  if (new Set(validLeaves).size !== validLeaves.length)
    fail("executed leaf manifest contains duplicates");
  // Vitest can omit an environment-specific `test.skipIf` definition from `vitest list` while its
  // runtime reporter still retains that definition as skipped. The independently reconciled pre-run
  // list is the required universe. Reporter-only exclusions stay visible here, but cannot enter the
  // required manifest or selector digest; a pre-listed leaf that skips remains a hard failure below.
  const requiredEntries = report.executedLeaves.filter(
    ({ status }) => status !== "skipped",
  );
  const excludedEntries = report.executedLeaves.filter(
    ({ status }) => status === "skipped",
  );
  const requiredLeaves = requiredEntries.map(vitestLeaf).filter(Boolean);
  const excludedLeaves = excludedEntries.map(vitestLeaf).filter(Boolean);
  if (
    !Number.isInteger(report.results?.skipped) ||
    report.results.skipped !== excludedEntries.length
  )
    fail("reported skip counts disagree with the visible excluded leaves");
  if (requiredLeaves.length !== report.executed)
    fail("executed count disagrees with the leaf manifest");
  if (requiredEntries.some(({ status }) => status !== "passed"))
    fail("a required Vitest leaf was skipped, failed, or unknown");
  const selection = report.selection;
  const selectedLeaves = new Set(
    Array.isArray(selection?.leafManifest) ? selection.leafManifest : [],
  );
  if (excludedLeaves.some((leaf) => selectedLeaves.has(leaf)))
    fail("a pre-listed required Vitest leaf was skipped at runtime");
  const engines = sorted(requiredEntries.map(({ engine }) => engine));
  if (!sameJson(engines, [...context.expectedEngines].sort()))
    fail(`engine universe mismatch: ${engines.join(",") || "none"}`);
  const executedFiles = sorted(requiredEntries.map(({ file }) => file));
  const expectedFiles = [...context.expectedFiles].sort();
  const expectedEngineSet = new Set(context.expectedEngines);
  if (!sameJson(executedFiles, expectedFiles))
    fail("executed file universe disagrees with independent lane authority");
  if (
    report.executedLeaves.some(
      ({ file, engine }) =>
        !expectedFiles.includes(file) || !expectedEngineSet.has(engine),
    )
  )
    fail("reported excluded leaf is outside the independent lane universe");
  for (const file of expectedFiles)
    for (const engine of context.expectedEngines)
      if (
        !requiredEntries.some(
          (leaf) => leaf.file === file && leaf.engine === engine,
        )
      )
        fail(`${file} has no executed leaf for required engine ${engine}`);

  const manifest = [...requiredLeaves].sort();
  if (!selection || selection.status !== "pass")
    fail("listed/executed selection reconciliation is missing");
  else {
    if (!sameJson(selection.leafManifest, manifest))
      fail("selection leaf manifest disagrees with executed leaves");
    if (
      selection.listedLeaves !== manifest.length ||
      selection.executedLeaves !== manifest.length
    )
      fail("selection counts disagree with the exact leaf manifest");
    const manifestFiles = sorted(manifest.map((leaf) => leaf.split("\0")[0]));
    if (
      !sameJson(selection.plannedFiles, manifestFiles) ||
      !sameJson(selection.listedFiles, manifestFiles)
    )
      fail("planned/listed files disagree with executed leaves");
    const digest = createHash("sha256")
      .update(
        JSON.stringify({
          plannedFiles: manifestFiles,
          listedLeaves: manifest,
        }),
      )
      .digest("hex");
    if (selection.selectorDigest !== digest)
      fail(
        "selector digest does not reconstruct from the canonical leaf manifest",
      );
  }
  return {
    problems,
    report,
    engines,
    leafManifest: manifest,
    excludedLeafManifest: [...excludedLeaves].sort(),
  };
}

export function validateSelectedVitestDiagnosticReport(report, context) {
  const problems = diagnosticCommonProblems(report, context);
  const fail = (message) => problems.push(`${context.gate}: ${message}`);
  if (!report || typeof report !== "object")
    return { problems, outcome: "unknown" };
  const leaves = Array.isArray(report.executedLeaves)
    ? report.executedLeaves.map(vitestLeaf)
    : [];
  if (
    !Array.isArray(report.executedLeaves) ||
    leaves.some((leaf) => leaf === null)
  )
    fail("selected executed leaf manifest is missing or malformed");
  const validLeaves = leaves.filter(Boolean);
  if (validLeaves.length === 0 || validLeaves.length !== report.executed)
    fail("selected execution is zero or count disagrees with leaf manifest");
  if (new Set(validLeaves).size !== validLeaves.length)
    fail("selected executed leaf manifest contains duplicates");
  if (
    (report.executedLeaves ?? []).some(
      ({ status }) => !new Set(["passed", "failed"]).has(status),
    )
  )
    fail("selected execution contains a skipped or unknown leaf");
  const passed = (report.executedLeaves ?? []).filter(
    ({ status }) => status === "passed",
  ).length;
  const failed = (report.executedLeaves ?? []).filter(
    ({ status }) => status === "failed",
  ).length;
  if (
    report.results?.passed !== passed ||
    report.results?.failed !== failed ||
    report.results?.skipped !== 0 ||
    passed + failed !== report.executed ||
    (report.unhandledErrors?.length ?? -1) !== 0
  )
    fail("selected result counts do not reconstruct from exact leaves");
  if ((report.state === "executed/pass") !== (failed === 0))
    fail("selected terminal state disagrees with failed leaves");
  const expectedFiles = [...context.expectedFiles].sort();
  const actualFiles = sorted(
    (report.executedLeaves ?? []).map(({ file }) => file),
  );
  const actualEngines = sorted(
    (report.executedLeaves ?? []).map(({ engine }) => engine),
  );
  if (!sameJson(actualFiles, expectedFiles))
    fail("selected file universe disagrees with the impact plan");
  if (!sameJson(actualEngines, [...context.expectedEngines].sort()))
    fail("selected engine universe disagrees with the lane");
  for (const file of expectedFiles)
    for (const engine of context.expectedEngines)
      if (
        !(report.executedLeaves ?? []).some(
          (leaf) => leaf.file === file && leaf.engine === engine,
        )
      )
        fail(`${file} has no selected leaf for required engine ${engine}`);
  const manifest = [...validLeaves].sort();
  const selection = report.selection;
  const digest = createHash("sha256")
    .update(
      JSON.stringify({ plannedFiles: expectedFiles, listedLeaves: manifest }),
    )
    .digest("hex");
  if (
    selection?.status !== "pass" ||
    !sameJson(selection.plannedFiles, expectedFiles) ||
    !sameJson(selection.listedFiles, expectedFiles) ||
    !sameJson(selection.leafManifest, manifest) ||
    selection.listedLeaves !== manifest.length ||
    selection.executedLeaves !== manifest.length ||
    selection.selectorDigest !== digest
  )
    fail(
      "selected listed/executed manifest or selector digest is not canonical",
    );
  return {
    problems,
    outcome:
      problems.length > 0
        ? "unknown"
        : report.state === "executed/pass"
          ? "pass"
          : "fail",
    selectorDigest: problems.length > 0 ? null : digest,
  };
}

export function validateContractGateReport(report, context) {
  const problems = commonProblems(report, context);
  const fail = (message) => problems.push(`${context.gate}: ${message}`);
  if (!report || typeof report !== "object") return { problems };
  const expectedRoutes = sorted(context.expectedRoutes);
  if (!sameJson(report.scope?.routes, expectedRoutes))
    fail("scope routes disagree with the independently planned route universe");
  if (report.scope?.full !== context.requireFull)
    fail("scope full flag disagrees with the required receipt profile");
  const expectedLeaves = expectedContractLeaves({ routes: expectedRoutes });
  if (
    !Number.isInteger(report.expected) ||
    report.expected !== expectedLeaves.length ||
    report.executed !== expectedLeaves.length ||
    expectedLeaves.length === 0
  )
    fail(
      "contract count is zero, partial, or disagrees with the required universe",
    );
  if (
    report.results?.passed !== expectedLeaves.length ||
    report.results?.failed !== 0 ||
    report.results?.flaky !== 0 ||
    report.results?.skipped !== 0 ||
    (report.failures?.length ?? -1) !== 0
  )
    fail(
      "contract results contain a failure, retry/flaky pass, skip, or missing facts",
    );
  if (!sameJson(report.leafEvidence?.expected, expectedLeaves))
    fail(
      "embedded expected contract leaves disagree with independent reconstruction",
    );
  for (const [phase, evidence, requirePassed] of [
    ["listed", report.leafEvidence?.listed, false],
    ["executed", report.leafEvidence?.executed, true],
  ]) {
    if (!evidence || !Array.isArray(evidence.leaves)) {
      fail(`${phase} contract leaf evidence is missing`);
      continue;
    }
    try {
      const reconstructed = reconcileContractLeaves(
        expectedLeaves,
        evidence.leaves,
        `receipt ${phase}`,
        { requirePassed },
      );
      if (
        evidence.expected !== reconstructed.expected ||
        evidence.executed !== reconstructed.executed ||
        evidence.digest !== reconstructed.digest ||
        !sameJson(evidence.leaves, reconstructed.leaves)
      )
        fail(
          `${phase} contract leaf evidence does not reconstruct canonically`,
        );
    } catch (error) {
      fail(`${phase} contract leaf evidence rejected: ${error.message}`);
    }
  }
  return { problems, report, expectedLeaves };
}

export function validateSelectedContractDiagnosticReport(report, context) {
  const problems = diagnosticCommonProblems(report, context);
  const fail = (message) => problems.push(`${context.gate}: ${message}`);
  if (!report || typeof report !== "object")
    return { problems, outcome: "unknown" };
  const expectedRoutes = sorted(context.expectedRoutes);
  if (
    !sameJson(report.scope?.routes, expectedRoutes) ||
    report.scope?.full !== false
  )
    fail("selected contract scope disagrees with the impact plan");
  if (report.scope?.project != null || report.scope?.title != null)
    fail(
      "affected contract execution must cover every project/assertion for its routes",
    );
  const expectedLeaves = expectedContractLeaves({ routes: expectedRoutes });
  if (
    expectedLeaves.length === 0 ||
    report.expected !== expectedLeaves.length ||
    report.executed !== expectedLeaves.length
  )
    fail(
      "selected contract count is zero, partial, or disagrees with authority",
    );
  const passed = report.results?.passed;
  const failed = report.results?.failed;
  if (
    !Number.isInteger(passed) ||
    !Number.isInteger(failed) ||
    passed + failed !== expectedLeaves.length ||
    report.results?.flaky !== 0 ||
    report.results?.skipped !== 0
  )
    fail(
      "selected contract result counts are partial, skipped, flaky, or malformed",
    );
  if ((report.state === "executed/pass") !== (failed === 0))
    fail("selected contract terminal state disagrees with failures");
  let selectorDigest = null;
  for (const [phase, evidence, requirePassed] of [
    ["listed", report.leafEvidence?.listed, false],
    ["executed", report.leafEvidence?.executed, false],
  ]) {
    if (!evidence || !Array.isArray(evidence.leaves)) {
      fail(`${phase} selected contract leaves are missing`);
      continue;
    }
    try {
      const reconstructed = reconcileContractLeaves(
        expectedLeaves,
        evidence.leaves,
        `selected ${phase}`,
        { requirePassed },
      );
      if (
        evidence.expected !== reconstructed.expected ||
        evidence.executed !== reconstructed.executed ||
        evidence.digest !== reconstructed.digest ||
        !sameJson(evidence.leaves, reconstructed.leaves)
      )
        fail(`${phase} selected contract leaves are not canonical`);
      if (phase === "executed") selectorDigest = reconstructed.digest;
    } catch (error) {
      fail(`${phase} selected contract leaves rejected: ${error.message}`);
    }
  }
  const executedOutcomes = report.leafEvidence?.executed?.leaves ?? [];
  const leafFailed = executedOutcomes.filter(
    ({ outcome }) => outcome === "failed",
  ).length;
  if (
    leafFailed !== failed ||
    executedOutcomes.some(
      ({ outcome }) => !new Set(["passed", "failed"]).has(outcome),
    )
  )
    fail("selected contract outcomes do not reconstruct from result counts");
  return {
    problems,
    outcome:
      problems.length > 0
        ? "unknown"
        : report.state === "executed/pass"
          ? "pass"
          : "fail",
    selectorDigest: problems.length > 0 ? null : selectorDigest,
  };
}

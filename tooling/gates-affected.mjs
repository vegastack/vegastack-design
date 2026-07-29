#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import {
  defaultBaseRef,
  mergeBase,
  resolveCommit,
  ROOT,
  workingTreeChangeInventory,
  workingTreeContentHash,
} from "./lib/change-set.mjs";
import {
  affectedCohortIdentity,
  affectedOracleEscapes,
  affectedScenarioAttainability,
  affectedScenarioProofProblems,
  affectedScenarioCandidates,
  planAffectedImpact,
  REQUIRED_AFFECTED_SCENARIOS,
  turboShadowSnapshot,
  validateTurboScriptInventory,
} from "./lib/gate-impact.mjs";
import {
  oracleEnvironment,
  validateAffectedOracle,
} from "./lib/affected-oracle.mjs";
import { atomicWriteJson } from "./lib/measurement-report.mjs";
import { validateDiagnosticReportPath } from "./lib/report-path.mjs";
import { reconcileGateTree } from "./lib/gate-tree.mjs";
import { BROWSER_ENGINES } from "./lib/gate-profile.mjs";
import {
  validateSelectedContractDiagnosticReport,
  validateSelectedVitestDiagnosticReport,
} from "./lib/gate-report-validation.mjs";
import {
  AFFECTED_DIAGNOSTICS_DIR,
  AFFECTED_SAMPLES_DIR,
  AFFECTED_SUMMARY_PATH,
  affectedRunDirectory,
  fingerprintAffectedProtectedDirectory,
  readAffectedProtectedFile,
  validateAffectedSummaryPath,
  writeImmutableAffectedSample,
} from "./lib/affected-paths.mjs";
import { validateAffectedConsumeReport } from "./lib/consume-isolation.mjs";

const GATES = join(ROOT, ".gates");
const RECEIPT = join(GATES, "receipt.json");
const EVIDENCE = join(GATES, "evidence");

const USAGE = `Usage: node tooling/gates-affected.mjs [options]

Compute the complete invalidated impact cone, retain task-specific Turbo hashes in shadow, then run
an unchanged oracle without writing a receipt. The default push oracle is an observation only;
checkpoint samples require the complete ship oracle. No affected result is reused in this stage.

  --base <ref>       diff against merge-base with this ref (default: origin/main or main)
  --plan-only        write/print the shadow plan without executing the current push oracle
  --oracle <mode>    push (default, observation only) or ship (full checkpoint oracle)
  --execute-selected execute exact diagnostic shadow commands before the unchanged full oracle
  --scenario <name>  label a controlled sample: ${REQUIRED_AFFECTED_SCENARIOS.join(" | ")}
  --report <path>    shadow report path (default: .gates/diagnostics/affected/summary.json)

Checkpoint execution fails before selected work or the full oracle while any required scenario is
unattainable under current machine authority. Resolve that authority/policy blocker with MK first.

Exit codes: 0 shadow plan/oracle passed · 1 oracle failed inside predicted cone · 2 invalid plan,
missing report, changed receipt/evidence, or a failure outside the predicted cone.`;

function fatal(message) {
  console.error(`gates:affected: ${message}`);
  process.exit(2);
}

function parse(argv) {
  const options = {
    base: defaultBaseRef(),
    planOnly: false,
    oracle: "push",
    scenario: "unclassified",
    report: AFFECTED_SUMMARY_PATH,
    executeSelected: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    const value = () => {
      const next = argv[++index];
      if (!next) fatal(`${flag} requires a nonempty value`);
      return next;
    };
    if (flag === "--base") options.base = value();
    else if (flag === "--plan-only") options.planOnly = true;
    else if (flag === "--oracle") options.oracle = value();
    else if (flag === "--execute-selected") options.executeSelected = true;
    else if (flag === "--scenario") options.scenario = value();
    else if (flag === "--report") options.report = resolve(ROOT, value());
    else if (flag === "--help" || flag === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else fatal(`unknown option ${flag}\n\n${USAGE}`);
  }
  if (
    options.scenario !== "unclassified" &&
    !REQUIRED_AFFECTED_SCENARIOS.includes(options.scenario)
  )
    fatal(`unknown --scenario ${options.scenario}`);
  if (!new Set(["push", "ship"]).has(options.oracle))
    fatal(`unknown --oracle ${options.oracle}`);
  if (
    options.oracle === "ship" &&
    options.executeSelected &&
    options.scenario === "unclassified"
  )
    fatal(
      "checkpoint sampling requires an explicit controlled --scenario before any full oracle runs",
    );
  try {
    options.report = validateDiagnosticReportPath(
      options.report,
      "affected shadow report",
    );
    options.report = validateAffectedSummaryPath(options.report);
  } catch (error) {
    fatal(error.message);
  }
  return options;
}

function bytes(path) {
  try {
    return readAffectedProtectedFile(path);
  } catch (error) {
    fatal(error.message);
  }
}

function directoryFingerprint(path) {
  try {
    return fingerprintAffectedProtectedDirectory(path);
  } catch (error) {
    fatal(error.message);
  }
}

function currentTurboSnapshot() {
  validateTurboScriptInventory();
  const run = spawnSync(
    "pnpm",
    ["exec", "turbo", "run", "build", "lint", "typecheck", "--dry=json"],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
  if (run.status !== 0)
    throw new Error(
      `Turbo dry-run failed: ${(run.stderr || run.stdout).trim()}`,
    );
  const parsed = JSON.parse(run.stdout);
  const taskIds = parsed.tasks.map((task) => task.taskId);
  return {
    installedVersion: parsed.turboVersion,
    currentBlanketGlobalDependencyCount: Object.keys(
      parsed.globalCacheInputs?.files ?? {},
    ).length,
    current: Object.fromEntries(
      parsed.tasks.map((task) => [
        task.taskId,
        {
          hash: task.hash,
          inputCount: Object.keys(task.inputs ?? {}).length,
          cacheStatus: task.cache?.status ?? "unknown",
        },
      ]),
    ),
    proposed: turboShadowSnapshot(taskIds),
  };
}

function selectedRunnerCommands(plan, sampleId) {
  const commands = {};
  for (const lane of ["unit", "smoke", "all-browsers"]) {
    const selected = plan.lanes[lane];
    if (selected.mode !== "selected" || !selected.files?.length) continue;
    commands[lane] = {
      evidenceEligibility: "diagnostic-only",
      command: process.execPath,
      args: [
        "tooling/vitest-run.mjs",
        "--lane",
        lane,
        "--selected-shadow",
        ...selected.files.flatMap((file) => ["--file", file]),
        "--report",
        relative(
          ROOT,
          join(affectedRunDirectory(sampleId), `vitest-${lane}.json`),
        ),
        "--run-id",
        sampleId,
      ],
    };
  }
  if (
    plan.lanes.contracts.mode === "selected" &&
    plan.lanes.contracts.routes?.length
  )
    commands.contracts = {
      evidenceEligibility: "diagnostic-only",
      command: process.execPath,
      args: [
        "tooling/contracts-run.mjs",
        "--routes",
        plan.lanes.contracts.routes.join(","),
        "--diagnostic",
        "--report",
        relative(ROOT, join(affectedRunDirectory(sampleId), "contracts.json")),
        "--run-id",
        sampleId,
      ],
    };
  if (plan.consumePlan.mode === "affected-shadow" && plan.consumePlan.runner)
    commands.consume = {
      evidenceEligibility: "diagnostic-only",
      command: plan.consumePlan.runner.command,
      args: [
        ...plan.consumePlan.runner.args,
        "--report",
        relative(ROOT, join(affectedRunDirectory(sampleId), "consume.json")),
        "--run-id",
        sampleId,
      ],
    };
  return commands;
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

// Count the whole planner process, including module loading and parsing, so the shadow savings
// ledger cannot hide scheduler startup outside a faster selector subphase.
const planningStarted = 0;
const options = parse(process.argv.slice(2));
const planningStartTree = workingTreeContentHash();
// Snapshot protected evidence before the first shadow-report write. A caller-controlled report path
// must never be able to redefine the "before" state it is later compared against.
const receiptBefore = bytes(RECEIPT);
const evidenceBefore = directoryFingerprint(EVIDENCE);
let cleanOracleEnvironment;
try {
  cleanOracleEnvironment = oracleEnvironment(process.env);
} catch (error) {
  fatal(error.message);
}
const baseSha = resolveCommit(options.base);
if (!baseSha) fatal(`base ref does not resolve to a commit: ${options.base}`);
const rangeStart = mergeBase(baseSha, "HEAD") ?? baseSha;
const inventory = workingTreeChangeInventory(rangeStart);
const registryRootCount = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8"),
).items.length;
const allChanged = inventory.allChanged;
const changed = inventory.changedFiles;
const metadataChanged = inventory.metadataChanged;
const binaryChanged = inventory.binaryChanged;
let plan;
let turbo;
let selectorDurationMs;
let turboDurationMs;
try {
  const selectorStarted = performance.now();
  plan = planAffectedImpact(changed, { metadataChanged, binaryChanged });
  selectorDurationMs =
    Math.round((performance.now() - selectorStarted) * 1000) / 1000;
  const turboStarted = performance.now();
  turbo = currentTurboSnapshot();
  turboDurationMs =
    Math.round((performance.now() - turboStarted) * 1000) / 1000;
} catch (error) {
  fatal(error.message);
}
const scenarioCandidates = affectedScenarioCandidates(changed, plan);
if (
  options.scenario !== "unclassified" &&
  !["unit-failure", "smoke-failure"].includes(options.scenario) &&
  !scenarioCandidates.includes(options.scenario)
)
  fatal(
    `--scenario ${options.scenario} is not supported by this diff/failure shape; candidates: ` +
      `${scenarioCandidates.join(", ") || "none"}`,
  );
let tree;
let cohort;
let cohortDurationMs;
let attainability;
let attainabilityDurationMs;
let planningDurationMs;
try {
  const cohortStarted = performance.now();
  cohort = affectedCohortIdentity({ turboVersion: turbo.installedVersion });
  cohortDurationMs =
    Math.round((performance.now() - cohortStarted) * 1000) / 1000;
  const attainabilityStarted = performance.now();
  attainability = affectedScenarioAttainability({ externalTreeEnvelope: true });
  attainabilityDurationMs =
    Math.round((performance.now() - attainabilityStarted) * 1000) / 1000;
  tree = reconcileGateTree(planningStartTree, workingTreeContentHash()).hash;
  planningDurationMs =
    Math.round((performance.now() - planningStarted) * 1000) / 1000;
} catch (error) {
  fatal(`working tree changed during affected planning: ${error.message}`);
}
if (options.oracle === "ship" && !attainability.foundation.attainable)
  fatal(
    `checkpoint execution is blocked before reports, selected work, or the full oracle: ` +
      `${attainability.foundation.blocker}. Resolve the authority/policy checkpoint with MK first`,
  );
const inventoryDigest = createHash("sha256")
  .update(
    JSON.stringify({
      changed,
      entries: inventory.entries,
      metadataChanged: [...metadataChanged].sort(),
      binaryChanged: [...binaryChanged].sort(),
    }),
  )
  .digest("hex");
const sampleId = `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}`;
const report = {
  schema: 1,
  generation: "affected-shadow-v1",
  sampleId,
  scenario: options.scenario,
  scenarioCandidates,
  recordedAt: new Date().toISOString(),
  tree,
  cohort,
  base: { ref: options.base, sha: rangeStart },
  classification: {
    allChanged: allChanged.length,
    substantive: changed.length,
    entries: inventory.entries,
    metadataChanged: [...metadataChanged].sort(),
    binaryChanged: [...binaryChanged].sort(),
    inventoryDigest,
  },
  plan,
  selectedRunnerCommands: selectedRunnerCommands(plan, sampleId),
  selectedExecution: options.executeSelected
    ? { state: "not-reached", results: {} }
    : {
        state: "safely-skipped",
        reason: "--execute-selected was not requested",
        results: {},
      },
  turbo,
  measurements: {
    class: "measured",
    planningDurationMs,
    selectorDurationMs,
    turboDryRunDurationMs: turboDurationMs,
    cohortDurationMs,
    attainabilityDurationMs,
    changedPaths: changed.length,
    importGraphSources: plan.oracles.importGraph.sourceCount,
    importGraphEdges: plan.oracles.importGraph.edgeCount,
    widenedPaths: plan.unknownPaths.length,
  },
  rollout: {
    enabled: false,
    requiredZeroEscapeSamples: 30,
    checkpoint:
      "MK approval required before affected reuse or task-specific Turbo inputs",
    turboActivationEligible: turbo.proposed.activationEligible,
    turboActivationBlocker: turbo.proposed.activationBlocker,
    scenarioAttainability: attainability,
  },
  checkpointEligible: false,
  oracle: options.planOnly
    ? { status: "not-run", reason: "--plan-only" }
    : { status: "running" },
};
atomicWriteJson(options.report, report);
console.log(
  `gates:affected: SHADOW ONLY — ${changed.length} substantive path(s), ` +
    `${plan.unknownPaths.length} widened unknown/metadata path(s)`,
);
console.log(
  `gates:affected: unit=${plan.lanes.unit.mode} smoke=${plan.lanes.smoke.mode} ` +
    `all-browsers=${plan.lanes["all-browsers"].mode} contracts=${plan.lanes.contracts.mode} ` +
    `vrt=${plan.lanes.vrt.mode} ` +
    `consume=${plan.lanes.consume.mode}`,
);
console.log(
  `gates:affected: total planning ${planningDurationMs}ms (impact ${selectorDurationMs}ms, ` +
    `Turbo ${turboDurationMs}ms, cohort ${cohortDurationMs}ms, checkpoint analysis ${attainabilityDurationMs}ms); ` +
    `${Object.keys(report.selectedRunnerCommands).length} exact diagnostic command(s) available`,
);
for (const reason of plan.reasons.slice(0, 12))
  console.log(`gates:affected: reason — ${reason}`);
if (plan.reasons.length > 12)
  console.log(
    `gates:affected: reasons — ${plan.reasons.length - 12} more retained in ${relative(ROOT, options.report)}`,
  );
if (!attainability.foundation.attainable)
  console.log(
    `gates:affected: checkpoint BLOCKED — ${attainability.foundation.blocker}`,
  );
if (plan.consumePlan.runner)
  console.log(
    `gates:affected: consume shadow command: ${[plan.consumePlan.runner.command, ...plan.consumePlan.runner.args].join(" ")}`,
  );
console.log(
  `gates:affected: Turbo partition activation ${turbo.proposed.activationEligible ? "eligible" : "BLOCKED"} — ` +
    turbo.proposed.activationBlocker,
);
console.log(
  "gates:affected: no reuse/evidence/receipt write; current gates remain the oracle; production-full unchanged",
);
if (options.planOnly) process.exit(0);

function selectedReportPath(command) {
  const index = command.args.indexOf("--report");
  return index >= 0 ? resolve(ROOT, command.args[index + 1]) : null;
}

let selectedExecution = report.selectedExecution;
if (options.executeSelected) {
  const commands = report.selectedRunnerCommands;
  const entries = Object.entries(commands);
  const selectedResults = {};
  for (const [lane, command] of entries) {
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    const run = spawnSync(command.command, command.args, {
      cwd: ROOT,
      stdio: "inherit",
      env: cleanOracleEnvironment,
    });
    const path = selectedReportPath(command);
    const structured = path ? readJson(path) : null;
    const problems = [];
    let validatedSelectorDigest = null;
    if (!Number.isInteger(run.status) || ![0, 1].includes(run.status))
      problems.push(`process exit ${run.status ?? "unknown"} is not 0/1`);
    if (run.signal) problems.push(`process terminated by ${run.signal}`);
    if (!structured)
      problems.push("structured selected report missing/corrupt");
    else if (lane === "consume") {
      problems.push(
        ...validateAffectedConsumeReport(structured, {
          expectedRootCount: registryRootCount,
        }),
      );
      if (structured.mode !== "affected")
        problems.push("selected consume report is not affected mode");
      if (structured.runId !== sampleId)
        problems.push(
          "selected consume report runId does not match the sample",
        );
      if (
        structured.treeBinding?.started !== tree ||
        structured.treeBinding?.completed !== tree ||
        structured.treeBinding?.unchanged !== true
      )
        problems.push(
          "selected consume report is not bound to the unchanged sample tree",
        );
      if (
        structured.generation !== cohort.gateGeneration ||
        structured.environmentProfile !== cohort.environmentProfile
      )
        problems.push(
          "selected consume report generation/environment is stale",
        );
      if (
        JSON.stringify(structured.selectedRoots) !==
          JSON.stringify(plan.consumePlan.roots) ||
        JSON.stringify(structured.selectedLayouts) !==
          JSON.stringify(plan.consumePlan.layouts)
      )
        problems.push("selected consume roots/layouts disagree with the plan");
      if (
        structured.diagnosticOnly !== true ||
        structured.fullOracleExecuted !== false ||
        structured.receiptWritten !== false ||
        structured.reuseEnabled !== false ||
        structured.evidenceReusable !== false
      )
        problems.push(
          "selected consume report crossed its diagnostic boundary",
        );
      if (problems.length === 0)
        validatedSelectorDigest = createHash("sha256")
          .update(
            JSON.stringify({
              roots: structured.selectedRoots,
              layouts: structured.selectedLayouts,
              real: structured.isolatedReal,
              simulated: structured.isolatedSimulated,
            }),
          )
          .digest("hex");
    } else {
      const context = {
        gate: lane,
        runId: sampleId,
        tree,
        generation: cohort.gateGeneration,
        environmentProfile: cohort.environmentProfile,
        runStartedAt: startedAt,
      };
      const validated =
        lane === "contracts"
          ? validateSelectedContractDiagnosticReport(structured, {
              ...context,
              expectedRoutes: plan.lanes.contracts.routes,
            })
          : validateSelectedVitestDiagnosticReport(structured, {
              ...context,
              expectedFiles: plan.lanes[lane].files,
              expectedEngines: lane === "unit" ? ["chromium"] : BROWSER_ENGINES,
            });
      problems.push(...validated.problems);
      validatedSelectorDigest = validated.selectorDigest;
    }
    const structuredOutcome =
      lane === "consume"
        ? structured?.status
        : structured?.state === "executed/pass"
          ? "pass"
          : structured?.state === "executed/fail"
            ? "fail"
            : "unknown";
    if (
      (structuredOutcome === "pass" && run.status !== 0) ||
      (structuredOutcome === "fail" && run.status !== 1)
    )
      problems.push(
        `process exit ${run.status ?? "unknown"} disagrees with structured ${structuredOutcome}`,
      );
    selectedResults[lane] = {
      state:
        problems.length === 0
          ? lane === "consume"
            ? structured.status === "pass"
              ? "executed/pass"
              : "executed/fail"
            : structured.state
          : "unknown",
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      exitCode: run.status,
      signal: run.signal,
      report: path ? relative(ROOT, path) : null,
      executed:
        lane === "consume"
          ? (structured?.isolatedReal?.length ?? 0) +
            (structured?.isolatedSimulated?.length ?? 0)
          : (structured?.executed ?? null),
      expected:
        lane === "consume"
          ? (structured?.selectedRoots?.length ?? 0) *
            (structured?.selectedLayouts?.length ?? 0) *
            2
          : (structured?.expected ??
            structured?.selection?.listedLeaves ??
            null),
      selectorDigest: validatedSelectorDigest,
      problems,
    };
  }
  selectedExecution = {
    state:
      entries.length === 0
        ? "safely-skipped"
        : Object.values(selectedResults).some(
              ({ state }) => state === "unknown",
            )
          ? "unknown"
          : Object.values(selectedResults).some(
                ({ state }) => state === "executed/fail",
              )
            ? "executed/fail"
            : "executed/pass",
    reason:
      entries.length === 0
        ? "planner selected no exact executable lane"
        : undefined,
    results: selectedResults,
  };
  report.selectedExecution = selectedExecution;
  atomicWriteJson(options.report, report);
}

const oracleStartedAt = new Date().toISOString();
const oracleStartedMs = Date.now();
const oracle = spawnSync(
  process.execPath,
  [
    join(ROOT, "tooling/gates.mjs"),
    options.oracle,
    "--base",
    options.base,
    "--no-receipt",
  ],
  { cwd: ROOT, stdio: "inherit", env: cleanOracleEnvironment },
);
const receiptAfter = bytes(RECEIPT);
if (
  !(receiptBefore === null
    ? receiptAfter === null
    : receiptAfter?.equals(receiptBefore) === true)
)
  fatal("shadow affected run changed .gates/receipt.json");
if (directoryFingerprint(EVIDENCE) !== evidenceBefore)
  fatal("shadow affected run changed .gates/evidence");
const { hash: completedTree } = workingTreeContentHash();
if (completedTree !== tree)
  fatal("working-tree content changed during the oracle run");
const completedCohort = affectedCohortIdentity({
  turboVersion: turbo.installedVersion,
});
if (completedCohort.digest !== cohort.digest)
  fatal(
    `affected cohort changed during execution (${cohort.digest} -> ${completedCohort.digest})`,
  );

const oracleProfile = options.oracle === "ship" ? "production-full" : "change";
const validation = validateAffectedOracle({
  mode: options.oracle,
  profile: oracleProfile,
  tree,
  startedAt: oracleStartedAt,
  processResult: { status: oracle.status, signal: oracle.signal },
  summary: readJson(join(GATES, `${options.oracle}.json`)),
  failure: readJson(join(GATES, "last-failure.json")),
  requiredGateIds:
    options.oracle === "ship"
      ? undefined
      : [
          "typecheck",
          "lint",
          ...(plan.lanes.unit.mode !== "none" ? ["unit"] : []),
          ...(plan.lanes.smoke.mode !== "none" ? ["smoke"] : []),
          ...(plan.lanes.contracts.mode !== "none" ? ["contracts"] : []),
        ],
});
const finalScenarioCandidates = affectedScenarioCandidates(
  changed,
  plan,
  validation.valid && validation.outcome === "fail" ? validation.failure : null,
);
const scenarioValid =
  options.scenario === "unclassified" ||
  finalScenarioCandidates.includes(options.scenario);
const analysis =
  validation.valid && scenarioValid
    ? {
        valid: true,
        failureRunId:
          validation.outcome === "fail" ? validation.runId : undefined,
        escapes:
          validation.outcome === "fail"
            ? affectedOracleEscapes(plan, validation.failure)
            : [],
      }
    : {
        valid: false,
        escapes: [
          ...validation.problems,
          ...(scenarioValid
            ? []
            : [
                `scenario ${options.scenario} is not proven by the current validated oracle`,
              ]),
        ],
      };
if (analysis.valid && options.executeSelected) {
  if (selectedExecution.state === "unknown") {
    analysis.valid = false;
    analysis.escapes.push("selected shadow execution is unknown");
  } else {
    const oracleFailures = new Set(
      validation.outcome === "fail"
        ? validation.failure.failures.map(({ id }) => id)
        : [],
    );
    for (const [lane, selected] of Object.entries(selectedExecution.results)) {
      const selectedFailed = selected.state === "executed/fail";
      const oracleFailed = oracleFailures.has(lane);
      if (selectedFailed !== oracleFailed)
        analysis.escapes.push(
          `${lane}: selected=${selected.state}, full-oracle=${oracleFailed ? "fail" : "pass"}`,
        );
    }
  }
}
const scenarioProofProblems = affectedScenarioProofProblems({
  ...report,
  scenarioCandidates: finalScenarioCandidates,
  selectedExecution,
  oracle: {
    status: validation.outcome,
    failedGateIds:
      validation.valid && validation.outcome === "fail"
        ? validation.failure.failures.map(({ id }) => id).sort()
        : [],
  },
});
if (scenarioProofProblems.length > 0) {
  analysis.valid = false;
  analysis.escapes.push(...scenarioProofProblems);
}
const completed = {
  ...report,
  scenarioCandidates: finalScenarioCandidates,
  checkpointEligible:
    options.oracle === "ship" &&
    options.executeSelected &&
    validation.valid &&
    scenarioValid &&
    selectedExecution.state !== "unknown" &&
    analysis.escapes.length === 0,
  selectedExecution,
  completedAt: new Date().toISOString(),
  oracle: {
    status: validation.outcome,
    profile: oracleProfile,
    startedAt: oracleStartedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - oracleStartedMs,
    exitCode: oracle.status,
    signal: oracle.signal,
    structuredSummaryVerified: validation.valid,
    structuredRunId: validation.runId ?? null,
    failedGateIds:
      validation.valid && validation.outcome === "fail"
        ? validation.failure.failures.map(({ id }) => id).sort()
        : [],
    command: `node tooling/gates.mjs ${options.oracle} --no-receipt`,
    receiptUnchanged: true,
    evidenceUnchanged: true,
    treeUnchanged: true,
    ...analysis,
  },
};
atomicWriteJson(options.report, completed);
const retainedPath = join(
  options.oracle === "ship"
    ? AFFECTED_SAMPLES_DIR
    : join(AFFECTED_DIAGNOSTICS_DIR, "push-observations"),
  `${sampleId}.json`,
);
try {
  writeImmutableAffectedSample(retainedPath, completed);
} catch (error) {
  fatal(`cannot retain immutable affected sample: ${error.message}`);
}
if (!analysis.valid || analysis.escapes.length > 0) {
  console.error(
    `gates:affected: SHADOW ESCAPE/UNKNOWN — ${analysis.escapes.join("; ") || "untrusted oracle report"}`,
  );
  process.exit(2);
}
console.log(
  `gates:affected: oracle ${validation.outcome === "pass" ? "PASS" : "FAIL inside predicted cone"}; ` +
    `${options.oracle === "ship" ? "checkpoint sample retained" : "push observation retained (not a checkpoint sample)"}; ` +
    "reuse remains disabled",
);
process.exit(validation.outcome === "pass" ? 0 : 1);

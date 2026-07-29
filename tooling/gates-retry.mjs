#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { ROOT, workingTreeContentHash } from "./lib/change-set.mjs";
import { RECEIPT_PATH } from "./lib/gate-receipt.mjs";
import {
  atomicWriteJson,
  gateGeneration,
  localEnvironment,
} from "./lib/measurement-report.mjs";
import {
  buildRetryPlan,
  fingerprintRetryEvidence,
  retryInvocation,
  validateRetryDiagnosticReport,
} from "./lib/retry-plan.mjs";

const GATES = join(ROOT, ".gates");
const DEFAULT_FAILURE = join(GATES, "last-failure.json");
const EVIDENCE = join(GATES, "evidence");

const USAGE = `Usage: node tooling/gates-retry.mjs [options]

Rerun only the exact structured selectors in .gates/last-failure.json. This command is diagnostic:
it never writes receipt/evidence, never removes the original failure, and never converts a pass into
release evidence.

  --failure <path>  use a specific structured failure report
  --dry-run         validate and print exact commands without executing them

Exit codes: 0 diagnostic selectors passed · 1 one still fails · 2 no trustworthy verdict.`;

function fatal(message) {
  console.error(`gates:retry: ${message}`);
  process.exit(2);
}

function parse(argv) {
  const options = { failure: DEFAULT_FAILURE, dryRun: false };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (flag === "--failure") {
      const value = argv[++index];
      if (!value) fatal("--failure requires a nonempty path");
      options.failure = resolve(ROOT, value);
    } else if (flag === "--dry-run") options.dryRun = true;
    else if (flag === "--help" || flag === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else fatal(`unknown option ${flag}\n\n${USAGE}`);
  }
  return options;
}

function bytes(path) {
  if (!existsSync(path)) return null;
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink())
    fatal(
      `protected file must be a regular non-symlink: ${relative(ROOT, path)}`,
    );
  return readFileSync(path);
}

function evidenceSnapshot() {
  try {
    return fingerprintRetryEvidence(EVIDENCE);
  } catch (error) {
    fatal(error.message);
  }
}

const options = parse(process.argv.slice(2));
const failureBefore = bytes(options.failure);
if (!failureBefore) fatal(`failure report is missing: ${options.failure}`);
let failure;
try {
  failure = JSON.parse(failureBefore.toString("utf8"));
} catch (error) {
  fatal(`failure report is corrupt: ${error.message}`);
}
const { hash: startingTree } = workingTreeContentHash();
const generation = gateGeneration();
const environmentProfile = localEnvironment().profile;
let plan;
try {
  plan = buildRetryPlan(failure, { treeHash: startingTree });
} catch (error) {
  fatal(error.message);
}
const receiptBefore = bytes(RECEIPT_PATH);
const evidenceBefore = evidenceSnapshot();
const retryId = `${new Date().toISOString().replaceAll(":", "-")}-retry-${randomUUID()}`;
const retainedPlan = {
  ...plan,
  retryId,
  recordedAt: new Date().toISOString(),
};
atomicWriteJson(join(GATES, "retry-plan.json"), retainedPlan);

const commands = plan.targets.map((target, index) => {
  const report = join(
    GATES,
    "diagnostics",
    "retry-runs",
    retryId,
    `${index}.json`,
  );
  const invocation = retryInvocation(target, { report, retryId });
  return {
    target,
    report,
    command: invocation.command,
    args: invocation.args,
  };
});
console.log(
  `gates:retry: ${commands.length} exact diagnostic selector(s) from ${plan.sourceRunId}`,
);
if (options.dryRun) {
  console.log(JSON.stringify(commands, null, 2));
  process.exit(0);
}

const outcomes = commands.map((entry) => {
  console.log(
    `gates:retry: ${entry.target.kind === "vitest" ? `${entry.target.file} · ${entry.target.engine} · ${entry.target.testName}` : `${entry.target.route} · ${entry.target.project} · ${entry.target.title}`}`,
  );
  const startedAt = new Date();
  const result = spawnSync(entry.command, entry.args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  let report = null;
  try {
    report = JSON.parse(readFileSync(entry.report, "utf8"));
  } catch {
    // Missing/corrupt output is not a passing diagnostic.
  }
  const validation = validateRetryDiagnosticReport(report, entry.target, {
    retryId,
    tree: startingTree,
    generation,
    environmentProfile,
  });
  const exitMatches =
    (validation.outcome === "pass" && result.status === 0) ||
    (validation.outcome === "fail" && result.status === 1);
  const valid = validation.valid && exitMatches && !result.signal;
  return {
    target: entry.target,
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    status: valid ? validation.outcome : "unknown",
    exitCode: result.status,
    report: relative(ROOT, entry.report),
    validDiagnosticReport: valid,
    problems: [
      ...validation.problems,
      ...(!exitMatches
        ? [
            `process exit ${result.status ?? "unknown"} disagrees with structured outcome ${validation.outcome}`,
          ]
        : []),
      ...(result.signal ? [`process terminated by ${result.signal}`] : []),
    ],
  };
});

const unchanged = (before, path) => {
  const after = bytes(path);
  return before === null ? after === null : after?.equals(before) === true;
};
if (!unchanged(receiptBefore, RECEIPT_PATH))
  fatal("diagnostic retry changed .gates/receipt.json; refusing the result");
if (!unchanged(failureBefore, options.failure))
  fatal(
    "diagnostic retry erased or changed the original failure; refusing the result",
  );
if (evidenceSnapshot() !== evidenceBefore)
  fatal("diagnostic retry changed .gates/evidence; refusing the result");
const { hash: completedTree } = workingTreeContentHash();
if (completedTree !== startingTree)
  fatal(
    "working-tree content changed during diagnostic retry; selectors are stale",
  );

const status = outcomes.some((outcome) => outcome.status === "unknown")
  ? "unknown"
  : outcomes.every((outcome) => outcome.status === "pass")
    ? "pass"
    : "fail";
atomicWriteJson(join(GATES, "retry-report.json"), {
  schema: 1,
  diagnosticOnly: true,
  retryId,
  sourceRunId: plan.sourceRunId,
  tree: startingTree,
  generation,
  environmentProfile,
  completedAt: new Date().toISOString(),
  status,
  evidenceWritten: false,
  originalFailureRetained: true,
  outcomes,
});
console.log(
  `gates:retry: diagnostic ${status.toUpperCase()} — original failure retained; receipt/evidence unchanged`,
);
process.exit(status === "pass" ? 0 : status === "fail" ? 1 : 2);

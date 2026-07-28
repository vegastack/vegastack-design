#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  readlinkSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import {
  changedFilesInWorkingTree,
  defaultBaseRef,
  dropProvenanceOnly,
  git,
  mergeBase,
  resolveCommit,
  ROOT,
  workingTreeContentHash,
} from "./lib/change-set.mjs";
import {
  affectedOracleEscapes,
  affectedScenarioCandidates,
  planAffectedImpact,
  REQUIRED_AFFECTED_SCENARIOS,
  turboShadowSnapshot,
  validateTurboScriptInventory,
} from "./lib/gate-impact.mjs";
import { atomicWriteJson } from "./lib/measurement-report.mjs";

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
  --scenario <name>  label a controlled sample: ${REQUIRED_AFFECTED_SCENARIOS.join(" | ")}
  --report <path>    shadow report path (default: .gates/affected-shadow.json)

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
    report: join(GATES, "affected-shadow.json"),
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
  return options;
}

function bytes(path) {
  return existsSync(path) ? readFileSync(path) : null;
}

function directoryFingerprint(path) {
  if (!existsSync(path)) return "missing";
  const hash = createHash("sha256");
  const walk = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const entry = join(directory, name);
      const stat = lstatSync(entry);
      hash.update(
        `${relative(path, entry)}\0${stat.mode.toString(8)}\0${stat.isSymbolicLink() ? "symlink" : stat.isDirectory() ? "directory" : "file"}\0`,
      );
      if (stat.isDirectory()) walk(entry);
      else
        hash.update(
          stat.isSymbolicLink() ? readlinkSync(entry) : readFileSync(entry),
        );
    }
  };
  walk(path);
  return hash.digest("hex");
}

function metadataChanges(rangeStart, files) {
  const changed = new Set();
  const raw = git(["diff", "--raw", "--no-renames", rangeStart, "--"]);
  for (const line of raw.split("\n")) {
    const match = /^:(\d{6}) (\d{6}) [a-f0-9]+ [a-f0-9]+ [A-Z]\t(.+)$/.exec(
      line,
    );
    if (match && match[1] !== match[2]) changed.add(match[3]);
  }
  for (const path of files) {
    const absolute = join(ROOT, path);
    if (!existsSync(absolute)) changed.add(path);
    else {
      const stat = lstatSync(absolute);
      if (!stat.isFile()) changed.add(path);
    }
  }
  return changed;
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

function analyzeOracleFailure(plan) {
  const path = join(GATES, "last-failure.json");
  if (!existsSync(path))
    return {
      valid: false,
      escapes: ["oracle failed without last-failure.json"],
    };
  let failure;
  try {
    failure = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return {
      valid: false,
      escapes: [`last-failure.json is corrupt: ${error.message}`],
    };
  }
  return {
    valid: true,
    failureRunId: failure.runId,
    escapes: affectedOracleEscapes(plan, failure),
  };
}

const options = parse(process.argv.slice(2));
const baseSha = resolveCommit(options.base);
if (!baseSha) fatal(`base ref does not resolve to a commit: ${options.base}`);
const rangeStart = mergeBase(baseSha, "HEAD") ?? baseSha;
const allChanged = changedFilesInWorkingTree(rangeStart);
const changed = dropProvenanceOnly(allChanged, { before: rangeStart });
const metadataChanged = metadataChanges(rangeStart, changed);
let priorFailure = null;
try {
  priorFailure = JSON.parse(
    readFileSync(join(GATES, "last-failure.json"), "utf8"),
  );
} catch {
  // No retained failure is an ordinary affected-planning state.
}
let plan;
let turbo;
try {
  plan = planAffectedImpact(changed, { metadataChanged });
  turbo = currentTurboSnapshot();
} catch (error) {
  fatal(error.message);
}
const scenarioCandidates = affectedScenarioCandidates(
  changed,
  plan,
  priorFailure,
);
if (
  options.scenario !== "unclassified" &&
  !scenarioCandidates.includes(options.scenario)
)
  fatal(
    `--scenario ${options.scenario} is not supported by this diff/failure shape; candidates: ` +
      `${scenarioCandidates.join(", ") || "none"}`,
  );
const { hash: tree } = workingTreeContentHash();
const sampleId = `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}`;
const report = {
  schema: 1,
  generation: "affected-shadow-v1",
  sampleId,
  scenario: options.scenario,
  scenarioCandidates,
  recordedAt: new Date().toISOString(),
  tree,
  base: { ref: options.base, sha: rangeStart },
  classification: {
    allChanged: allChanged.length,
    substantive: changed.length,
    metadataChanged: [...metadataChanged].sort(),
  },
  plan,
  turbo,
  rollout: {
    enabled: false,
    requiredZeroEscapeSamples: 30,
    checkpoint:
      "MK approval required before affected reuse or task-specific Turbo inputs",
    turboActivationEligible: turbo.proposed.activationEligible,
    turboActivationBlocker: turbo.proposed.activationBlocker,
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
    `consume=${plan.lanes.consume.mode}`,
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

const receiptBefore = bytes(RECEIPT);
const evidenceBefore = directoryFingerprint(EVIDENCE);
const oracleStartedAt = new Date().toISOString();
const oracle = spawnSync(
  process.execPath,
  [
    join(ROOT, "tooling/gates.mjs"),
    options.oracle,
    "--base",
    options.base,
    "--no-receipt",
  ],
  { cwd: ROOT, stdio: "inherit", env: process.env },
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

const analysis =
  oracle.status === 0
    ? { valid: true, escapes: [] }
    : analyzeOracleFailure(plan);
const completed = {
  ...report,
  checkpointEligible: options.oracle === "ship",
  completedAt: new Date().toISOString(),
  oracle: {
    status: oracle.status === 0 ? "pass" : "fail",
    profile: options.oracle === "ship" ? "production-full" : "change",
    startedAt: oracleStartedAt,
    completedAt: new Date().toISOString(),
    exitCode: oracle.status,
    command: `node tooling/gates.mjs ${options.oracle} --no-receipt`,
    receiptUnchanged: true,
    evidenceUnchanged: true,
    treeUnchanged: true,
    ...analysis,
  },
};
atomicWriteJson(options.report, completed);
atomicWriteJson(
  join(
    GATES,
    options.oracle === "ship"
      ? "affected-shadow"
      : "affected-shadow-push-observations",
    `${sampleId}.json`,
  ),
  completed,
);
if (!analysis.valid || analysis.escapes.length > 0) {
  console.error(
    `gates:affected: SHADOW ESCAPE/UNKNOWN — ${analysis.escapes.join("; ") || "untrusted oracle report"}`,
  );
  process.exit(2);
}
console.log(
  `gates:affected: oracle ${oracle.status === 0 ? "PASS" : "FAIL inside predicted cone"}; ` +
    `${options.oracle === "ship" ? "checkpoint sample retained" : "push observation retained (not a checkpoint sample)"}; ` +
    "reuse remains disabled",
);
process.exit(oracle.status === 0 ? 0 : 1);

#!/usr/bin/env node

import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

import { ROOT } from "./lib/change-set.mjs";
import { BROWSER_ENGINES } from "./lib/gate-profile.mjs";
import {
  atomicWriteJson,
  gateGeneration,
  localEnvironment,
} from "./lib/measurement-report.mjs";
import { workingTreeContentHash } from "./lib/change-set.mjs";
import { validateDiagnosticReportPath } from "./lib/report-path.mjs";
import {
  parseSelectedFiles,
  reconcileVitestSelection,
  vitestEvidenceBoundary,
} from "./lib/vitest-selection.mjs";
import { reconcileVitestRuntimeExclusions } from "./lib/vitest-runtime-exclusions.mjs";

const UI = join(ROOT, "packages/ui");
const GATES = join(ROOT, ".gates");
const CONFIGS = {
  unit: "vitest.config.ts",
  smoke: "vitest.smoke.config.ts",
  "all-browsers": "vitest.all-browsers.config.ts",
};

const USAGE = `Usage: node tooling/vitest-run.mjs --lane <unit|smoke|all-browsers> [options]

  --file <repo-path>     exact packages/ui test file; repeat only with --selected-shadow
  --files-json <path>    nonempty JSON array of exact test paths; --selected-shadow only
  --engine <name>        exact chromium/firefox/webkit engine (diagnostic retry requires it)
  --test-name <name>     exact full Vitest test name (diagnostic retry requires it)
  --report <path>        structured report path
  --run-id <id>          originating gate run ID
  --diagnostic           mark the result diagnostic-only; it can never become receipt evidence
  --observation          run the complete lane diagnostically; no exact retry selectors allowed
  --selected-shadow      execute an exact affected set diagnostically; never writes evidence
  --dry-run              validate and print the exact invocation without running a browser

Zero executed tests is always an error. There is intentionally no pass-with-no-tests option.`;

function fatal(message) {
  console.error(`vitest-run: ${message}`);
  process.exit(2);
}

function parse(argv) {
  const options = {
    lane: null,
    files: [],
    filesJson: null,
    engine: null,
    testName: null,
    report: null,
    runId: null,
    diagnostic: false,
    observation: false,
    selectedShadow: false,
    dryRun: false,
    reportExplicit: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    const value = () => {
      const next = argv[++index];
      if (!next) fatal(`${flag} requires a nonempty value`);
      return next;
    };
    if (flag === "--lane") options.lane = value();
    else if (flag === "--file") options.files.push(value());
    else if (flag === "--files-json")
      options.filesJson = resolve(ROOT, value());
    else if (flag === "--engine") options.engine = value();
    else if (flag === "--test-name") options.testName = value();
    else if (flag === "--report") {
      options.report = resolve(ROOT, value());
      options.reportExplicit = true;
    } else if (flag === "--run-id") options.runId = value();
    else if (flag === "--diagnostic") options.diagnostic = true;
    else if (flag === "--observation") options.observation = true;
    else if (flag === "--selected-shadow") options.selectedShadow = true;
    else if (flag === "--dry-run") options.dryRun = true;
    else if (flag === "--help" || flag === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else fatal(`unknown option ${flag}\n\n${USAGE}`);
  }
  return options;
}

function exactFile(file) {
  if (!file.startsWith("packages/ui/") || !/\.test\.[cm]?[jt]sx?$/.test(file))
    fatal(`--file must be an exact packages/ui test path: ${file}`);
  const absolute = resolve(ROOT, file);
  const escaped = relative(ROOT, absolute);
  if (
    escaped === ".." ||
    escaped.startsWith(`..${sep}`) ||
    !existsSync(absolute)
  )
    fatal(`retry test file is missing or was renamed: ${file}`);
  return relative(UI, absolute).split("\\").join("/");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const options = parse(process.argv.slice(2));
if (!CONFIGS[options.lane]) fatal(`unknown or missing --lane: ${options.lane}`);
if (options.filesJson) {
  if (!options.selectedShadow)
    fatal("--files-json is allowed only with --selected-shadow");
  if (!existsSync(options.filesJson))
    fatal(`--files-json is missing: ${relative(ROOT, options.filesJson)}`);
  options.files.push(
    ...parseSelectedFiles(readFileSync(options.filesJson, "utf8")),
  );
}
if (new Set(options.files).size !== options.files.length)
  fatal("selected files contain a duplicate path");
if (options.files.length > 1 && !options.selectedShadow)
  fatal("multiple --file selectors require --selected-shadow");
if (options.selectedShadow && options.files.length === 0)
  fatal("--selected-shadow requires a nonempty exact file set");
if (options.engine && !BROWSER_ENGINES.includes(options.engine))
  fatal(`unknown --engine ${options.engine}`);
if (options.lane === "unit" && options.engine && options.engine !== "chromium")
  fatal("the unit lane has only the chromium engine");
if (
  options.diagnostic &&
  (options.files.length !== 1 || !options.engine || !options.testName)
)
  fatal(
    "--diagnostic requires exact nonempty --file, --engine, and --test-name selectors",
  );
if (
  options.observation &&
  (options.diagnostic ||
    options.selectedShadow ||
    options.files.length > 0 ||
    options.engine ||
    options.testName)
)
  fatal(
    "--observation is a complete diagnostic lane and cannot be combined with exact/selected selectors",
  );
if (options.observation && !options.runId)
  fatal("--observation requires a nonempty --run-id");

const canonicalReport = join(GATES, `vitest-${options.lane}.json`);
const diagnosticDefault = join(
  GATES,
  "diagnostics",
  `vitest-${options.lane}-${options.selectedShadow ? "selected-shadow" : "diagnostic"}.json`,
);
const report =
  options.report ??
  (options.diagnostic || options.selectedShadow || options.observation
    ? diagnosticDefault
    : options.files.length > 0
      ? join(GATES, "diagnostics", `vitest-${options.lane}-exact-gate.json`)
      : canonicalReport);
if (
  options.files.length > 0 ||
  options.diagnostic ||
  options.observation ||
  options.selectedShadow ||
  (options.reportExplicit && resolve(report) !== resolve(canonicalReport))
) {
  try {
    validateDiagnosticReportPath(report, "exact Vitest report");
  } catch (error) {
    fatal(error.message);
  }
}
const selectedFiles = options.files.map((file) => ({
  repoPath: file,
  uiPath: exactFile(file),
}));
const args = [
  "exec",
  "vitest",
  "run",
  "--config",
  CONFIGS[options.lane],
  "--reporter=default",
  `--reporter=${join(ROOT, "tooling/vitest-structured-reporter.mjs")}`,
];
args.push(...selectedFiles.map(({ uiPath }) => uiPath));
if (options.engine) args.push("--browser.name", options.engine);
if (options.testName)
  args.push("--testNamePattern", `^${escapeRegExp(options.testName)}$`);

const listArgs = [
  "exec",
  "vitest",
  "list",
  "--config",
  CONFIGS[options.lane],
  ...selectedFiles.map(({ uiPath }) => uiPath),
  ...(options.engine ? ["--browser.name", options.engine] : []),
  ...(options.testName
    ? ["--testNamePattern", `^${escapeRegExp(options.testName)}$`]
    : []),
  "--json",
];

if (options.dryRun) {
  console.log(
    JSON.stringify(
      {
        evidenceEligibility:
          options.diagnostic || options.selectedShadow || options.observation
            ? "diagnostic-only"
            : "gate",
        list: { command: "pnpm", args: listArgs },
        run: { command: "pnpm", args },
        report,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const startTree = workingTreeContentHash().hash;
const generation = gateGeneration();
const environmentProfile = localEnvironment().profile;
let listed = null;
{
  const listing = spawnSync("pnpm", listArgs, {
    cwd: UI,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (listing.status !== 0)
    fatal(`Vitest list failed: ${(listing.stderr || listing.stdout).trim()}`);
  try {
    listed = JSON.parse(listing.stdout);
  } catch (error) {
    fatal(`Vitest list JSON is corrupt: ${error.message}`);
  }
  if (!Array.isArray(listed) || listed.length === 0)
    fatal("exact selector listed zero tests/files");
}
rmSync(report, { force: true });
atomicWriteJson(report, {
  schema: 1,
  gate: options.lane,
  runId: options.runId,
  state: "unknown",
  status: "running",
  evidenceWritten: false,
  receiptWritten: false,
  treeBinding: { started: startTree, completed: null, unchanged: null },
  generation,
  environmentProfile,
  startedAt: new Date().toISOString(),
});
const result = spawnSync("pnpm", args, {
  cwd: UI,
  stdio: "inherit",
  env: {
    ...process.env,
    VSK_VITEST_REPORT: report,
    VSK_VITEST_LANE: options.lane,
    VSK_GATE_RUN_ID: options.runId ?? "",
    VSK_RETRY_DIAGNOSTIC: options.diagnostic || options.observation ? "1" : "0",
    VSK_SELECTED_SHADOW: options.selectedShadow ? "1" : "0",
    // Every exact-file run is reconciled below, including the ordinary gates:component candidate.
    // Retaining leaves is an execution fact; evidence eligibility remains a separate boundary.
    VSK_RETAIN_EXECUTED_LEAVES: "1",
    VSK_TREE_START: startTree,
    VSK_GATE_GENERATION: generation,
    VSK_ENV_PROFILE: environmentProfile,
  },
});
if (!existsSync(report))
  fatal("Vitest wrote no structured report; no diagnostic verdict exists");
let structured;
try {
  structured = JSON.parse(readFileSync(report, "utf8"));
} catch (error) {
  fatal(`Vitest structured report is corrupt: ${error.message}`);
}
const completedTree = workingTreeContentHash().hash;
if (completedTree !== startTree) {
  atomicWriteJson(report, {
    ...structured,
    state: "unknown",
    status: "fail",
    evidenceWritten: false,
    treeBinding: {
      started: startTree,
      completed: completedTree,
      unchanged: false,
    },
    error: "working-tree content changed during selected Vitest execution",
  });
  fatal("working-tree content changed during selected Vitest execution");
}
structured = {
  ...structured,
  treeBinding: {
    started: startTree,
    completed: completedTree,
    unchanged: true,
  },
  generation,
  environmentProfile,
};
atomicWriteJson(report, structured);
if (!Number.isInteger(structured.executed) || structured.executed <= 0)
  fatal(
    "exact selector executed zero tests; refusing an empty diagnostic pass",
  );
{
  try {
    const selection = reconcileVitestSelection({
      plannedFiles:
        selectedFiles.length > 0
          ? selectedFiles.map(({ repoPath }) => repoPath)
          : [
              ...new Set(
                listed.map((entry) =>
                  relative(ROOT, entry.file).split("\\").join("/"),
                ),
              ),
            ].sort(),
      listed,
      executed: structured.executedLeaves,
      engine: options.engine,
    });
    const runtimeExclusions = reconcileVitestRuntimeExclusions({
      gate: options.lane,
      executedLeaves: structured.executedLeaves,
      selectedLeaves: selection.leafManifest,
    });
    structured = {
      ...structured,
      ...vitestEvidenceBoundary({
        diagnostic: options.diagnostic || options.observation,
        selectedShadow: options.selectedShadow,
      }),
      selection,
      runtimeExclusions,
    };
    atomicWriteJson(report, structured);
  } catch (error) {
    atomicWriteJson(report, {
      ...structured,
      state: "unknown",
      status: "fail",
      ...vitestEvidenceBoundary({
        diagnostic: options.diagnostic || options.observation,
        selectedShadow: options.selectedShadow,
      }),
      selection: { status: "unknown", error: error.message },
      runtimeExclusions: { status: "unknown", error: error.message },
    });
    fatal(error.message);
  }
}
if (result.status !== 0 || structured.status !== "pass") process.exit(1);
process.exit(0);

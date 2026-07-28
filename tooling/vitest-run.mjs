#!/usr/bin/env node

import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

import { ROOT } from "./lib/change-set.mjs";
import { BROWSER_ENGINES } from "./lib/gate-profile.mjs";

const UI = join(ROOT, "packages/ui");
const GATES = join(ROOT, ".gates");
const CONFIGS = {
  unit: "vitest.config.ts",
  smoke: "vitest.smoke.config.ts",
  "all-browsers": "vitest.all-browsers.config.ts",
};

const USAGE = `Usage: node tooling/vitest-run.mjs --lane <unit|smoke|all-browsers> [options]

  --file <repo-path>     exact packages/ui test file (diagnostic retry requires it)
  --engine <name>        exact chromium/firefox/webkit engine (diagnostic retry requires it)
  --test-name <name>     exact full Vitest test name (diagnostic retry requires it)
  --report <path>        structured report path
  --run-id <id>          originating gate run ID
  --diagnostic           mark the result diagnostic-only; it can never become receipt evidence
  --dry-run              validate and print the exact invocation without running a browser

Zero executed tests is always an error. There is intentionally no pass-with-no-tests option.`;

function fatal(message) {
  console.error(`vitest-run: ${message}`);
  process.exit(2);
}

function parse(argv) {
  const options = {
    lane: null,
    file: null,
    engine: null,
    testName: null,
    report: null,
    runId: null,
    diagnostic: false,
    dryRun: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    const value = () => {
      const next = argv[++index];
      if (!next) fatal(`${flag} requires a nonempty value`);
      return next;
    };
    if (flag === "--lane") options.lane = value();
    else if (flag === "--file") options.file = value();
    else if (flag === "--engine") options.engine = value();
    else if (flag === "--test-name") options.testName = value();
    else if (flag === "--report") options.report = resolve(ROOT, value());
    else if (flag === "--run-id") options.runId = value();
    else if (flag === "--diagnostic") options.diagnostic = true;
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
if (options.engine && !BROWSER_ENGINES.includes(options.engine))
  fatal(`unknown --engine ${options.engine}`);
if (options.lane === "unit" && options.engine && options.engine !== "chromium")
  fatal("the unit lane has only the chromium engine");
if (
  options.diagnostic &&
  (!options.file || !options.engine || !options.testName)
)
  fatal(
    "--diagnostic requires exact nonempty --file, --engine, and --test-name selectors",
  );

const report = options.report ?? join(GATES, `vitest-${options.lane}.json`);
const args = [
  "exec",
  "vitest",
  "run",
  "--config",
  CONFIGS[options.lane],
  "--reporter=default",
  `--reporter=${join(ROOT, "tooling/vitest-structured-reporter.mjs")}`,
];
if (options.file) args.push(exactFile(options.file));
if (options.engine) args.push("--browser.name", options.engine);
if (options.testName)
  args.push("--testNamePattern", `^${escapeRegExp(options.testName)}$`);

if (options.dryRun) {
  console.log(JSON.stringify({ command: "pnpm", args, report }, null, 2));
  process.exit(0);
}
rmSync(report, { force: true });
const result = spawnSync("pnpm", args, {
  cwd: UI,
  stdio: "inherit",
  env: {
    ...process.env,
    VSK_VITEST_REPORT: report,
    VSK_VITEST_LANE: options.lane,
    VSK_GATE_RUN_ID: options.runId ?? "",
    VSK_RETRY_DIAGNOSTIC: options.diagnostic ? "1" : "0",
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
if (!Number.isInteger(structured.executed) || structured.executed <= 0)
  fatal(
    "exact selector executed zero tests; refusing an empty diagnostic pass",
  );
if (result.status !== 0 || structured.status !== "pass") process.exit(1);
process.exit(0);

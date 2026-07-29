#!/usr/bin/env node
// The behaviour-contract lane: 320px reflow, RTL containment, forced-colors focus visibility, and
// effective 24px pointer targets, over the component routes a diff can actually have moved.
//
// WHY THIS WRAPPER EXISTS AT ALL
//   Two measured costs, both invisible from inside Playwright:
//
//   1. THE BUILD WAS THE FLOOR. `playwright.config.ts` ships a `webServer` that runs
//      `pnpm build && serve out` on every invocation, with `reuseExistingServer: false`. Measured:
//      a ONE-ROUTE run cost 1m54s, of which ~1m40 was that rebuild and ~12s was the eight tests.
//      So scoping alone could never get below ~2 minutes. This tool owns the server instead and
//      builds through `turbo run build --filter=@vegastack/docs`, which is a MEASURED 2.9s
//      `>>> FULL TURBO` cache hit when nothing relevant changed (`turbo.json` already declares
//      `out/**` as a build output, so the content hash already exists). A one-route run drops to
//      ~15s. The freshness guarantee is not weakened: it moves from "no server was reused" to
//      "turbo's content hash over declared inputs", which is strictly stronger — it survives a
//      stale `out/` that a naive reuse check would happily serve.
//
//   2. THE FULL SWEEP WAS 13m36s at 96 routes. That historical macOS ARM64 measurement was
//      768/768 passing, 5 workers, 10 cores
//      (`real 815.43` / `user 3789.34` — CPU-bound, as apps/docs/playwright.config.ts records).
//      That is a `/ship` cost, not a pre-push cost. Scoping is what makes pre-push viable.
//
// WHAT IT REFUSES TO DO
//   Report a pass it did not earn. Three separate guards: the grep is cross-checked against
//   `--list` before anything runs, a selected scope that executes zero tests is a failure, and an
//   empty scope is reported as SKIPPED rather than green.
//
// SCOPE AUTHORITY
//   tooling/lib/route-scope.mjs, with CONTRACT_SCOPE. Anything unrecognised forces a full sweep.

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createRouteScopeModel,
  escapeRegExp,
  selectRoutes,
} from "./lib/route-scope.mjs";
import {
  CONTRACT_ASSERTIONS,
  CONTRACT_PROJECTS,
  FULL_CONTRACT_TESTS,
} from "./lib/gate-profile.mjs";
import {
  atomicWriteJson,
  gateGeneration,
  localEnvironment,
} from "./lib/measurement-report.mjs";
import {
  workingTreeChangeInventory,
  workingTreeContentHash,
} from "./lib/change-set.mjs";
import {
  contractLeavesFromPlaywright,
  expectedContractLeaves,
  reconcileContractLeaves,
} from "./lib/contract-selection.mjs";
import { validateDiagnosticReportPath } from "./lib/report-path.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = join(ROOT, "apps/docs");
const GATES_DIR = join(ROOT, ".gates");
const DEFAULT_REPORT = join(GATES_DIR, "contracts.json");

// The two test titles `contracts.spec.ts` generates per route. They anchor the grep: without a
// literal suffix, `/docs/components/button` would also select `/docs/components/button-group`.
const TITLE_SUFFIXES = CONTRACT_ASSERTIONS.map(({ title }) => title);
// Every Playwright project in apps/docs/playwright.config.ts. Used only to predict the expected
// test count; a mismatch against `--list` fails rather than silently adjusting.
const PROJECT_COUNT = CONTRACT_PROJECTS.length;
const FULL_TEST_COUNT = FULL_CONTRACT_TESTS;

const USAGE = `Usage: node tooling/contracts-run.mjs [options]

  --scope          check only the routes the diff can have moved (default)
  --all            check every machine-authority component route (${FULL_TEST_COUNT} tests currently)
  --routes a,b     check exactly these routes
  --project <name> check exactly one Playwright project (diagnostic use)
  --title <title>  check exactly one complete contract title (diagnostic use)
  --diagnostic     mark an exact selected route run diagnostic-only; never receipt evidence
  --observation    run --all diagnostically; never receipt evidence or an exact retry
  --base <ref>     diff against this ref (default: origin/main, falling back to main)
  --report <path>  JSON report (diagnostics default to .gates/contracts-diagnostic.json)
  --run-id <id>    bind the structured report to an originating gate/sample run
  --dry-run        print the computed scope and exit without building or testing
  --port <n>       serve on this port instead of an OS-assigned free one

Exit codes: 0 pass or SKIPPED · 1 a contract failed · 2 the run could not produce a verdict.`;

// ── options ──────────────────────────────────────────────────────────────────────────────────────

function fatal(message) {
  console.error(`contracts-run: ${message}`);
  process.exit(2);
}

function parseOptions(argv) {
  const options = {
    all: false,
    routes: null,
    base: null,
    report: DEFAULT_REPORT,
    reportExplicit: false,
    dryRun: false,
    port: null,
    project: null,
    title: null,
    diagnostic: false,
    observation: false,
    runId: null,
  };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    const value = () => {
      const next = argv[++index];
      if (next === undefined) fatal(`${flag} requires a value`);
      return next;
    };
    if (flag === "--all") options.all = true;
    else if (flag === "--scope") options.all = false;
    else if (flag === "--routes")
      options.routes = value()
        .split(",")
        .map((route) => route.trim())
        .filter(Boolean);
    else if (flag === "--base") options.base = value();
    else if (flag === "--report") {
      options.report = resolve(ROOT, value());
      options.reportExplicit = true;
    } else if (flag === "--project") options.project = value();
    else if (flag === "--title") options.title = value();
    else if (flag === "--diagnostic") options.diagnostic = true;
    else if (flag === "--observation") options.observation = true;
    else if (flag === "--run-id") options.runId = value();
    else if (flag === "--dry-run") options.dryRun = true;
    else if (flag === "--port") options.port = Number(value());
    else if (flag === "--help" || flag === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else fatal(`unknown option ${flag}\n\n${USAGE}`);
  }
  if (
    options.port !== null &&
    (!Number.isInteger(options.port) || options.port < 1024)
  )
    fatal("--port must be an integer >= 1024");
  if (options.diagnostic && (!options.routes || options.routes.length === 0))
    fatal("--diagnostic requires a nonempty exact --routes selector");
  if (
    options.observation &&
    (!options.all ||
      options.diagnostic ||
      options.routes ||
      options.project ||
      options.title)
  )
    fatal(
      "--observation requires --all and forbids exact diagnostic selectors",
    );
  if (options.observation && !options.runId)
    fatal("--observation requires a nonempty --run-id");
  if (options.diagnostic && !options.reportExplicit)
    options.report = join(
      GATES_DIR,
      "diagnostics",
      "contracts-diagnostic.json",
    );
  else if (options.observation && !options.reportExplicit)
    options.report = join(
      GATES_DIR,
      "diagnostics",
      "contracts-observation.json",
    );
  else if (options.routes && !options.reportExplicit)
    options.report = join(
      GATES_DIR,
      "diagnostics",
      "contracts-exact-gate.json",
    );
  else if (options.dryRun && !options.reportExplicit)
    options.report = join(GATES_DIR, "diagnostics", "contracts-dry-run.json");
  if (
    options.dryRun ||
    options.diagnostic ||
    options.observation ||
    options.routes ||
    (options.reportExplicit &&
      resolve(options.report) !== resolve(DEFAULT_REPORT))
  ) {
    try {
      validateDiagnosticReportPath(
        options.report,
        "contract diagnostic report",
      );
    } catch (error) {
      fatal(error.message);
    }
  }
  return options;
}

// ── shell ────────────────────────────────────────────────────────────────────────────────────────

function git(args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0)
    fatal(`git ${args.join(" ")} failed:\n${result.stderr?.trim()}`);
  return result.stdout.trim();
}

function gitQuiet(args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

/** An OS-assigned free port. A fixed port collides with a parallel run or an orphaned server. */
function reservePort() {
  return new Promise((resolveWith, rejectWith) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", rejectWith);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolveWith(port));
    });
  });
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// ── scope ────────────────────────────────────────────────────────────────────────────────────────

const options = parseOptions(process.argv.slice(2));
const startTree = workingTreeContentHash().hash;
const routeModel = createRouteScopeModel();
routeModel.assertCurrent();
const COMPONENT_ROUTES = routeModel.componentRoutes;
const generation = gateGeneration();
const environmentProfile = localEnvironment().profile;

const baseRef =
  options.base ??
  (gitQuiet(["rev-parse", "--verify", "--quiet", "origin/main"])
    ? "origin/main"
    : "main");
if (!gitQuiet(["rev-parse", "--verify", "--quiet", `${baseRef}^{commit}`]))
  fatal(`base ref ${baseRef} does not resolve to a commit`);
const mergeBase = git(["merge-base", baseRef, "HEAD"]);

// Diff the merge-base against the WORKING TREE, not against HEAD. The question is "what do my
// current edits do to the contract surface", and at pre-push time some of them may be unstaged.
const changeInventory = workingTreeChangeInventory(mergeBase);
const changedFiles = changeInventory.changedFiles;

const selection = (() => {
  try {
    if (
      !options.routes &&
      !options.all &&
      (changeInventory.metadataChanged.size > 0 ||
        changeInventory.binaryChanged.size > 0)
    )
      return {
        routes: null,
        reason: "file metadata/binary change widens every contract route",
      };
    return selectRoutes(changedFiles, options, routeModel.contractScope);
  } catch (error) {
    return fatal(error.message);
  }
})();

const mode = options.routes ? "routes" : options.all ? "all" : "scope";
const selectedRoutes =
  selection.routes === null
    ? [...COMPONENT_ROUTES]
    : [...selection.routes].sort();
const isFullSweep = selection.routes === null;
routeModel.assertCurrent();
if (workingTreeContentHash().hash !== startTree)
  fatal(
    "working-tree content changed during contract authority/selector planning",
  );
if (options.project && !CONTRACT_PROJECTS.includes(options.project))
  fatal(`unknown --project ${options.project}`);
if (options.title) {
  if (selectedRoutes.length !== 1)
    fatal("--title requires exactly one route through --routes");
  const allowed = TITLE_SUFFIXES.map(
    (suffix) => `${selectedRoutes[0]} ${suffix}`,
  );
  if (!allowed.includes(options.title))
    fatal(
      `--title is stale or not an exact contract assertion for ${selectedRoutes[0]}`,
    );
}

console.log(
  `contracts-run: base ${baseRef} (${mergeBase.slice(0, 8)}) → working tree`,
);
console.log(
  `contracts-run: ${changedFiles.length} changed file(s); scope: ${selection.reason}`,
);
console.log(
  isFullSweep
    ? `contracts-run: FULL sweep — ${selectedRoutes.length} routes`
    : `contracts-run: ${selectedRoutes.length} route(s): ${selectedRoutes.join(", ") || "(none)"}`,
);

/** Write the report, then leave with `code`. Every exit after scoping goes through here. */
function finish(code, payload) {
  const diagnosticOnly = Boolean(
    options.diagnostic ||
    options.observation ||
    options.project ||
    options.title ||
    options.dryRun,
  );
  mkdirSync(GATES_DIR, { recursive: true });
  const completedTree = workingTreeContentHash().hash;
  const treeChanged = completedTree !== startTree;
  atomicWriteJson(options.report, {
    schema: 1,
    gate: "contracts",
    runId: options.runId,
    lane: "contract",
    diagnosticOnly,
    selectedShadow: options.diagnostic,
    evidenceWritten: !diagnosticOnly && payload.state === "executed/pass",
    receiptWritten: false,
    evidenceEligibility: diagnosticOnly ? "diagnostic-only" : "gate-candidate",
    completedAt: new Date().toISOString(),
    generation,
    environmentProfile,
    treeBinding: {
      started: startTree,
      completed: completedTree,
      unchanged: !treeChanged,
    },
    base: { ref: baseRef, sha: mergeBase },
    scope: {
      mode,
      reason: selection.reason,
      full: isFullSweep,
      routes: selectedRoutes,
      project: options.project,
      title: options.title,
      changedFiles: changedFiles.length,
    },
    ...payload,
    ...(treeChanged
      ? {
          state: "unknown",
          status: "fail",
          evidenceWritten: false,
          error: "working-tree content changed during contract execution",
        }
      : {}),
  });
  process.exit(treeChanged ? 2 : code);
}

// An empty scope means no contract-relevant file changed. That is SKIPPED, not green — the
// distinction is what receipt verification cross-checks against the release classifier.
if (!isFullSweep && selectedRoutes.length === 0) {
  console.log(
    "contracts-run: no contract surface changed — nothing executed.\n" +
      "               Report this as SKIPPED. It is not evidence that the contracts pass.",
  );
  finish(0, {
    state: "safely-skipped",
    skipReason: selection.reason,
    status: "skipped",
    expected: 0,
    executed: 0,
    results: { passed: 0, failed: 0, flaky: 0, skipped: 0 },
    failures: [],
    durationMs: 0,
  });
}

const grep = options.title
  ? `${escapeRegExp(options.title)}$`
  : isFullSweep
    ? null
    : `(${selectedRoutes.map(escapeRegExp).join("|")}) (${TITLE_SUFFIXES.map(escapeRegExp).join("|")})`;
const selectedProjectCount = options.project ? 1 : PROJECT_COUNT;
const selectedTitleCount = options.title ? 1 : TITLE_SUFFIXES.length;
const expected =
  (isFullSweep ? COMPONENT_ROUTES.length : selectedRoutes.length) *
  selectedTitleCount *
  selectedProjectCount;
const expectedLeaves = expectedContractLeaves({
  routes: selectedRoutes,
  project: options.project,
  title: options.title,
});
if (expectedLeaves.length !== expected)
  fatal(
    "independently reconstructed contract leaf universe disagrees with count",
  );

if (options.dryRun) {
  console.log(`contracts-run: grep ${grep ?? "(none — full suite)"}`);
  console.log(`contracts-run: expected ${expected} test(s)`);
  finish(0, {
    state: "not-reached",
    status: "dry-run",
    expected,
    executed: 0,
    results: { passed: 0, failed: 0, flaky: 0, skipped: 0 },
    failures: [],
    durationMs: 0,
  });
}

// ── build, serve, run ────────────────────────────────────────────────────────────────────────────

/**
 * `SITE_VISIBILITY` is part of turbo's global cache key and it changes what the export contains, so
 * it is pinned rather than inherited. `public` is what production serves and what the workflows set
 * for this lane; an inherited `private` would silently check a different site.
 */
const BUILD_ENV = { ...process.env, SITE_VISIBILITY: "public" };

function playwrightVersion() {
  try {
    return JSON.parse(
      readFileSync(
        join(DOCS, "node_modules/@playwright/test/package.json"),
        "utf8",
      ),
    ).version;
  } catch {
    return null;
  }
}

async function waitForServer(port, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, {
        signal: AbortSignal.timeout(3_000),
      });
      if (response.ok || response.status === 404) return true;
    } catch {
      // Not listening yet.
    }
    await sleep(250);
  }
  return false;
}

const startedAt = Date.now();

console.log("contracts-run: building the docs export (turbo-cached)…");
const build = spawnSync(
  "pnpm",
  ["exec", "turbo", "run", "build", "--filter=@vegastack/docs"],
  { cwd: ROOT, stdio: "inherit", env: BUILD_ENV },
);
if (build.status !== 0) fatal("the docs build failed — no verdict is possible");
if (!existsSync(join(DOCS, "out/index.html")))
  fatal("the docs build produced no apps/docs/out/index.html");

const port = options.port ?? (await reservePort());
console.log(`contracts-run: serving apps/docs/out on 127.0.0.1:${port}`);
/**
 * `detached: true` puts the server in its own PROCESS GROUP, which is what makes it reapable.
 *
 * This was wrong first: with `detached: false` the reaper killed the `pnpm` wrapper, and `pnpm exec
 * serve` had already spawned `serve` as a CHILD — so the wrapper died and the real server survived.
 * Three orphaned `serve out` processes were found still listening after a session of runs. That is
 * the exact hazard the deleted workflows warned about ("orphaning `serve` on the port"), reproduced
 * locally.
 */
const server = spawn("pnpm", ["exec", "serve", "out", "-l", String(port)], {
  cwd: DOCS,
  stdio: "ignore",
  env: BUILD_ENV,
  detached: true,
});
let serverClosed = false;
server.on("exit", () => {
  serverClosed = true;
});

function reapServer() {
  // Negative pid = the whole group, so the `serve` child goes with its `pnpm` parent.
  if (!serverClosed && server.pid) {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {
      // Already gone, or the group was never created.
    }
  }
  // Belt and braces, because a leaked port is what bricks the NEXT run: sweep anything still
  // LISTENING on it. `lsof` is present on macOS and Linux; if it is absent this is simply a no-op.
  //
  // `-sTCP:LISTEN` is mandatory, not tidiness. `lsof -ti tcp:<port>` matches a socket with that port
  // on EITHER end, so it also returns this very process — which has just been polling the server
  // through `waitForServer`'s `fetch`. Without the filter the sweep SIGKILLed the runner itself:
  // exit 137 after a clean `768 passed`, with the report already written as "pass" so the failure
  // looked like it came from nowhere. The deleted workflows used the same unfiltered command; it
  // never bit there only because their shell held no connection to the port at reap time.
  // The explicit self-pid guard is a second line of defence for the same mistake.
  try {
    const listening = spawnSync(
      "lsof",
      ["-ti", `tcp:${port}`, "-sTCP:LISTEN"],
      { encoding: "utf8" },
    );
    for (const pid of (listening.stdout ?? "").split("\n").filter(Boolean)) {
      const target = Number(pid);
      if (!Number.isInteger(target) || target === process.pid) continue;
      try {
        process.kill(target, "SIGKILL");
      } catch {
        // Not ours any more, or already exited.
      }
    }
  } catch {
    // lsof unavailable — the group kill above is the primary mechanism.
  }
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    reapServer();
    process.exit(2);
  });
process.on("exit", reapServer);

if (!(await waitForServer(port))) {
  reapServer();
  fatal(`the static server never answered on 127.0.0.1:${port}`);
}

/**
 * `PW_EXTERNAL_SERVER` tells playwright.config.ts that this process owns the server, so it must not
 * start its own. Without it Playwright would rebuild and rebind, which is exactly the cost this
 * tool exists to remove.
 */
const TEST_ENV = {
  ...BUILD_ENV,
  PW_EXTERNAL_SERVER: "1",
  VRT_PORT: String(port),
  PLAYWRIGHT_JSON_OUTPUT_NAME: "contracts-report.json",
};

const jsonReport = join(DOCS, "contracts-report.json");
rmSync(jsonReport, { force: true });

// The grep is cross-checked BEFORE the run. An anchoring mistake (`button` matching `button-group`,
// or a renamed title matching nothing) would otherwise surface as a wrong-but-green result.
const listArgs = [
  "exec",
  "playwright",
  "test",
  "contracts.spec.ts",
  "--list",
  "--reporter=json",
];
if (grep) listArgs.push("--grep", grep);
if (options.project) listArgs.push("--project", options.project);
// `PLAYWRIGHT_JSON_OUTPUT_NAME` is deliberately ABSENT from this call's environment. With it set the
// json reporter targets that file, and under `--list` Playwright then writes its list format to
// stdout and no file at all — so parsing stdout as JSON fails on the literal text "Listing tests:".
// Measured while building this tool; it is the reason the guard is a separate env rather than a
// reuse of TEST_ENV.
const { PLAYWRIGHT_JSON_OUTPUT_NAME: _unusedForList, ...LIST_ENV } = TEST_ENV;
const listed = spawnSync("pnpm", listArgs, {
  cwd: DOCS,
  encoding: "utf8",
  env: LIST_ENV,
  maxBuffer: 64 * 1024 * 1024,
});
if (listed.status !== 0) {
  reapServer();
  fatal(`\`playwright test --list\` failed:\n${listed.stderr?.trim()}`);
}
const listedReport = (() => {
  try {
    return JSON.parse(listed.stdout);
  } catch (error) {
    reapServer();
    return fatal(`could not parse \`--list\` output: ${error.message}`);
  }
})();
const listedLeaves = contractLeavesFromPlaywright(listedReport);
let listedExecution;
try {
  listedExecution = reconcileContractLeaves(
    expectedLeaves,
    listedLeaves,
    "playwright --list",
  );
} catch (error) {
  reapServer();
  fatal(
    `${error.message}. Expected ${selectedRoutes.length} route(s) × ` +
      `${selectedTitleCount} assertion(s) × ${selectedProjectCount} project(s). ` +
      "A same-count replacement is a defect, not a condition to adjust to.",
  );
}
console.log(
  `contracts-run: grep verified — ${listedExecution.executed} exact test leaf/leaves selected`,
);

const testArgs = [
  "exec",
  "playwright",
  "test",
  "contracts.spec.ts",
  "--reporter=list,json",
  "--retries=0",
];
if (grep) testArgs.push("--grep", grep);
if (options.project) testArgs.push("--project", options.project);
const run = spawnSync("pnpm", testArgs, {
  cwd: DOCS,
  stdio: "inherit",
  env: TEST_ENV,
});
reapServer();

const durationMs = Date.now() - startedAt;

if (!existsSync(jsonReport))
  fatal(
    "Playwright wrote no JSON report — the run produced no reviewable evidence",
  );

const report = JSON.parse(readFileSync(jsonReport, "utf8"));
const executedLeaves = contractLeavesFromPlaywright(report);
let executedExecution;
try {
  executedExecution = reconcileContractLeaves(
    expectedLeaves,
    executedLeaves,
    "playwright run",
    { requirePassed: false },
  );
} catch (error) {
  console.error(`contracts-run: ${error.message}`);
  finish(2, {
    state: "unknown",
    status: "no-evidence",
    expected,
    executed: executedLeaves.length,
    leafEvidence: { expected: expectedLeaves, listed: listedExecution },
    results: { passed: 0, failed: 0, flaky: 0, skipped: 0 },
    failures: [],
    durationMs,
    playwright: playwrightVersion(),
  });
}
const stats = report.stats ?? {};
const executed =
  (stats.expected ?? 0) + (stats.unexpected ?? 0) + (stats.flaky ?? 0);

const failures = [];
(function walk(suites) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? [])
      for (const test of spec.tests ?? [])
        for (const result of test.results ?? []) {
          if (result.status === "passed" || result.status === "skipped")
            continue;
          failures.push({
            title: spec.title,
            file: suite.file ?? spec.file ?? null,
            project: test.projectName ?? null,
            status: result.status,
            error: (result.errors ?? [])
              .map((error) => error.message ?? "")
              .join("\n")
              .slice(0, 4_000),
          });
        }
    walk(suite.suites);
  }
})(report.suites);

const results = {
  passed: stats.expected ?? 0,
  failed: stats.unexpected ?? 0,
  flaky: stats.flaky ?? 0,
  skipped: stats.skipped ?? 0,
};

console.log(
  `contracts-run: ${executed} executed · ${results.passed} passed · ${results.failed} failed · ` +
    `${results.flaky} flaky · ${(durationMs / 1000).toFixed(1)}s`,
);

// A suite that executed nothing is not passing evidence. This local wrapper is the browser-lane
// authority; CI verifies its receipt and does not execute Playwright itself.
if (
  executed === 0 ||
  executed !== expected ||
  results.skipped > 0 ||
  results.flaky > 0
) {
  console.error(
    `contracts-run: required execution mismatch (${executed}/${expected}, skipped=${results.skipped}) — not valid passing evidence.`,
  );
  finish(2, {
    state: "unknown",
    status: "no-evidence",
    expected,
    executed,
    results,
    failures,
    durationMs,
    playwright: playwrightVersion(),
    leafEvidence: {
      expected: expectedLeaves,
      listed: listedExecution,
      executed: executedExecution,
    },
  });
}

if (run.status !== 0 || results.failed > 0) {
  console.error(
    `contracts-run: FAILED — ${failures.length} failing result(s). Read .gates/contracts.json,\n` +
      "               then load the `gates` skill to classify each one at its root.",
  );
  finish(1, {
    state: "executed/fail",
    status: "fail",
    expected,
    executed,
    results,
    failures,
    durationMs,
    playwright: playwrightVersion(),
    leafEvidence: {
      expected: expectedLeaves,
      listed: listedExecution,
      executed: executedExecution,
    },
  });
}

finish(0, {
  state: "executed/pass",
  status: "pass",
  expected,
  executed,
  results,
  failures,
  durationMs,
  playwright: playwrightVersion(),
  leafEvidence: {
    expected: expectedLeaves,
    listed: listedExecution,
    executed: executedExecution,
  },
});

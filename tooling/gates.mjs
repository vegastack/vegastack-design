#!/usr/bin/env node
// The gate ladder. One entry point per tier, so a hook, a skill, and a human all run the same thing.
//
//   pnpm gates:commit              staged-file static gates. ~3-5s. Never a browser.
//   pnpm gates:push                the pre-push ladder, then write the receipt.
//   pnpm gates:component <name>    the inner loop while building one component.
//   pnpm gates:ship                the full local sweep /ship requires.
//
// MEASURED BUDGETS — macOS ARM64, 10 cores, warm turbo cache. Re-measure rather than trusting these.
//   commit                          ~4s      design-lint 1.7s · secret-scan 0.7s · the rest <0.2s
//   component <name>                ~44s     design-lint 1.7s · that unit file 2.8s · its closure 40s
//   push, nothing contract-relevant ~33s     typecheck 17s · lint 16s · all browser lanes SKIPPED
//   push, one component touched     ~1m45s    + unit 16s · smoke 17s · a 3-route closure 40s
//   push, a GLOBAL surface touched  ~9-11min  + the full 108-route sweep (864 checks)
//   ship                            ~17-18min + all-browsers 1m39 · consume 3m42 · full contracts
//
//   A COLD docs export adds ~1m40 to any lane that needs `apps/docs/out`. Note `turbo.json` lists
//   `tooling/**` in `globalDependencies`, so editing anything in this directory invalidates that
//   build — which is why the component loop measured 2m44 while this file was being edited and 44s
//   when it was not.
//
// TWO ORDERING RULES, BOTH LEARNED THE HARD WAY
//   1. A TIER BARRIER. The cheap tier runs to completion, but the browser tier does not start behind
//      a failing one. A single type error otherwise bought a full 10-minute contract sweep whose
//      result could not matter.
//   2. THE DOCS CACHE WARM-UP RUNS AFTER THE TURBO GATES, never alongside them. `pnpm typecheck` and
//      `turbo run lint` are themselves turbo runs, and two turbo processes building the same task
//      contend — observed as a failed warm-up on a run whose contract lane then rebuilt and passed
//      anyway. Browser timing also proved unstable under a concurrent export, so every browser lane
//      now starts only after this warm-up has finished.
//      A failed warm-up is never a gate failure: `contracts-run.mjs` re-runs the same command and is
//      the freshness authority.
//
// REPORTS, NOT JUST EXIT CODES
//   Every segment writes an immutable `.gates/runs/<run-id>/<segment>.json`; the mode's latest
//   summary remains `.gates/<mode>.json`, and a failure writes `.gates/last-failure.json`. Reports
//   carry implementation generation, environment/cache classification, total/warm-up/lane duration,
//   scope, and explicit unknown resource facts. Read them with the `gates` skill.

import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { arch, platform } from "node:os";
import { join } from "node:path";

import {
  changedFilesInWorkingTree,
  defaultBaseRef,
  dropProvenanceOnly,
  mergeBase,
  resolveCommit,
  ROOT,
  workingTreeContentHash,
} from "./lib/change-set.mjs";
import {
  ALL_GATES,
  contractSha256,
  installedToolchain,
  pinnedToolchain,
  readReceipt,
  RECEIPT_REPO_PATH,
  SCHEMA,
  writeReceiptFile,
} from "./lib/gate-receipt.mjs";
import {
  BROWSER_ENGINES,
  buildEvidenceManifest,
  CHANGE_PROFILE,
  PRODUCTION_PROFILE,
} from "./lib/gate-profile.mjs";
import {
  chooseMonotonicReceipt,
  exactTreeReusePlan,
} from "./lib/gate-reuse.mjs";
import {
  atomicWriteJson,
  gateGeneration,
  localEnvironment,
  MEASUREMENT_SCHEMA,
  newRunId,
  writeRunMeasurement,
} from "./lib/measurement-report.mjs";
import {
  CONTRACT_SCOPE,
  COMPONENT_ROUTES,
  dependentsByRoute,
  routeByName,
  selectRoutes,
} from "./lib/route-scope.mjs";
import { smokeImpact } from "./lib/smoke-scope.mjs";

const GATES_DIR = join(ROOT, ".gates");
const LAST_FAILURE = join(GATES_DIR, "last-failure.json");

const USAGE = `Usage: node tooling/gates.mjs <commit|push|component|ship> [options]

  commit                  static gates over STAGED files only
  push                    the pre-push ladder, then write ${RECEIPT_REPO_PATH}
                          (exact-tree reuse is shadow-only; all planned lanes still execute)
  component <name>        design-lint + that component's unit test + its contract-route closure
  ship                    the full local sweep

  --base <ref>            diff against this ref (default: origin/main, falling back to main)
  --no-receipt            run the ladder but do not write a receipt
  --verbose               stream every gate's output instead of only failures

Exit codes: 0 all required gates passed · 1 a gate failed · 2 the ladder could not run.`;

// ── plumbing ─────────────────────────────────────────────────────────────────────────────────────

// Colour only when a TTY is attached. A hook's output is routinely captured to a file or read by
// an agent, and escape bytes in that log are noise someone then has to strip before reading it.
const tty = process.stdout.isTTY === true;
const style = (code) => (tty ? `\u001b[${code}m` : "");
const BOLD = style(1);
const DIM = style(2);
const RED = style(31);
const GREEN = style(32);
const YELLOW = style(33);
const RESET = style(0);

function fatal(message) {
  console.error(`${RED}gates: ${message}${RESET}`);
  process.exit(2);
}

const mode = process.argv[2];
if (!mode || mode === "--help" || mode === "-h") {
  console.log(USAGE);
  process.exit(mode ? 0 : 2);
}
if (!["commit", "push", "component", "ship"].includes(mode))
  fatal(`unknown mode ${mode}\n\n${USAGE}`);

const options = { base: null, receipt: true, verbose: false, component: null };
for (let index = 3; index < process.argv.length; index++) {
  const flag = process.argv[index];
  if (flag === "--base") options.base = process.argv[++index];
  else if (flag === "--no-receipt") options.receipt = false;
  else if (flag === "--verbose") options.verbose = true;
  else if (!flag.startsWith("-") && options.component === null)
    options.component = flag;
  else fatal(`unknown option ${flag}\n\n${USAGE}`);
}
if (mode === "component" && !options.component)
  fatal(
    "`gates component` needs a component name, e.g. `pnpm gates:component button`",
  );

mkdirSync(GATES_DIR, { recursive: true });

const results = [];
const runStartedAt = new Date();
const runStartedMs = Date.now();
const runId = newRunId(mode);
const generation = gateGeneration();
const environment = localEnvironment();
const coldWarm = process.env.GATES_COLD_WARM?.trim() || "unknown";
const cacheState = process.env.GATES_CACHE_STATE?.trim() || "unknown";

function scopeFor(id, result, startedAt) {
  if (id === "contracts") {
    if (result.status === "skipped")
      return { routeCount: 0, checkCount: 0, reportState: "not-executed" };
    try {
      const report = JSON.parse(
        readFileSync(join(GATES_DIR, "contracts.json"), "utf8"),
      );
      if (Date.parse(report.completedAt) < startedAt.getTime())
        throw new Error("contracts report predates this segment");
      return {
        routeCount: report.scope?.routes?.length ?? null,
        checkCount: report.executed ?? report.expected ?? null,
        reportState: "current",
      };
    } catch {
      return {
        routeCount:
          contractSelection.routes === null
            ? COMPONENT_ROUTES.length
            : contractSelection.routes.size,
        checkCount: null,
        reportState: "missing-or-stale",
      };
    }
  }
  if (id === "smoke")
    return {
      testFileCount: smokeSelection.full ? null : smokeSelection.tests.length,
      engineCount: BROWSER_ENGINES.length,
    };
  if (id === "all-browsers") return { engineCount: BROWSER_ENGINES.length };
  if (id === "docs-warmup") return { routeCount: COMPONENT_ROUTES.length };
  return {};
}

function retainMeasurement(result, startedAt, completedAt) {
  const measurement = {
    schema: MEASUREMENT_SCHEMA,
    generation,
    runId,
    kind: "local-gate",
    mode,
    segment: result.id,
    status: result.status,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: result.durationMs,
    measurementClass: "measured",
    scope: scopeFor(result.id, result, startedAt),
    environment,
    cache: { state: cacheState },
    coldWarm,
    retryCount: 0,
    resources: {
      summedCpuMs: { measurementClass: "unknown", value: null },
      peakRssBytes: { measurementClass: "unknown", value: null },
    },
    required: result.required,
    ...(result.command ? { command: result.command } : {}),
    ...(result.reason ? { reason: result.reason } : {}),
  };
  writeRunMeasurement(measurement);
  return measurement;
}

/**
 * Run one gate. Output is captured and printed only on failure unless --verbose, because a green
 * ladder should be four lines rather than four thousand.
 */
function gate(
  id,
  label,
  command,
  args,
  { cwd = ROOT, env = process.env, required = true } = {},
) {
  process.stdout.write(`${DIM}▸${RESET} ${label}… `);
  const startedAt = new Date();
  const startedMs = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    stdio: options.verbose ? "inherit" : "pipe",
  });
  const completedAt = new Date();
  const durationMs = Date.now() - startedMs;
  const seconds = `${(durationMs / 1000).toFixed(1)}s`;
  const ok = result.status === 0;
  console.log(
    ok
      ? `${GREEN}pass${RESET} ${DIM}${seconds}${RESET}`
      : `${RED}FAIL${RESET} ${DIM}${seconds}${RESET}`,
  );
  const output = options.verbose
    ? null
    : `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (!ok && output) console.error(`\n${output}\n`);
  const gateResult = {
    id,
    label,
    status: ok ? "pass" : "fail",
    durationMs,
    required,
    command: [command, ...args].join(" "),
    output: ok
      ? null
      : (output ?? "(streamed — rerun without --verbose to capture)"),
  };
  gateResult.measurement = retainMeasurement(
    gateResult,
    startedAt,
    completedAt,
  );
  results.push(gateResult);
  return ok;
}

function skip(id, label, reason) {
  console.log(
    `${DIM}▸${RESET} ${label}… ${YELLOW}skipped${RESET} ${DIM}${reason}${RESET}`,
  );
  const now = new Date();
  const gateResult = {
    id,
    label,
    status: "skipped",
    durationMs: 0,
    required: false,
    reason,
  };
  gateResult.measurement = retainMeasurement(gateResult, now, now);
  results.push(gateResult);
}

const node = (script, ...args) => ["node", [join(ROOT, script), ...args]];

// ── change set ───────────────────────────────────────────────────────────────────────────────────

const baseRef = options.base ?? defaultBaseRef();
const baseSha = resolveCommit(baseRef);
if (!baseSha) fatal(`base ref does not resolve to a commit: ${baseRef}`);
const rangeStart = mergeBase(baseSha, "HEAD") ?? baseSha;

const allChanged = changedFilesInWorkingTree(rangeStart);
const changed = dropProvenanceOnly(allChanged, { before: rangeStart });
const contractSelection = selectRoutes(changed, {}, CONTRACT_SCOPE);
const contractsRelevant =
  contractSelection.routes === null || contractSelection.routes.size > 0;

const smokeSelection = smokeImpact(changed);
const smokeRelevant =
  contractSelection.routes === null || smokeSelection.required;
const unitRelevant = changed.some((file) =>
  /^(packages\/(ui|design|design-tokens)|apps\/docs\/components)\//.test(file),
);
const reusePlan = (() => {
  if (mode !== "push") return null;
  const plannedGates = [
    ...(unitRelevant ? ["unit"] : []),
    ...(smokeRelevant ? ["smoke"] : []),
    ...(contractsRelevant ? ["contracts"] : []),
  ];
  const { hash: treeHash } = workingTreeContentHash();
  const plan = exactTreeReusePlan(
    readReceipt(),
    {
      treeHash,
      pinned: pinnedToolchain(),
      contractSha: contractSha256(),
    },
    { plannedGates },
  );
  const retained = {
    ...plan,
    runId,
    tree: treeHash,
    recordedAt: new Date().toISOString(),
  };
  atomicWriteJson(join(GATES_DIR, "reuse-plan.json"), retained);
  return retained;
})();

// ── the docs build, overlapped only with plain-node work and measured separately ─────────────────
//
// TIMING IS LOAD-BEARING HERE, and it was wrong once. This must NOT overlap `pnpm typecheck` or
// `turbo run lint`: those are themselves turbo runs, and two turbo processes building the same task
// contend — observed as `gates: the parallel docs build failed` on a run whose contract lane then
// rebuilt and passed anyway. So it starts AFTER the turbo-based gates and must finish before every
// browser lane. Chromium canvas timing and WebKit/Firefox interaction timing have each produced
// isolated failures under concurrent cold-export CPU/memory pressure.
//
// A failure here is not a gate failure. `contracts-run.mjs` re-runs the same turbo command and is the
// freshness authority; this is purely a cache warm-up, so it stays quiet unless --verbose.

let docsBuild = null;
function startDocsBuild() {
  const startedAt = new Date();
  docsBuild = spawn(
    "pnpm",
    ["exec", "turbo", "run", "build", "--filter=@vegastack/docs"],
    {
      cwd: ROOT,
      env: { ...process.env, SITE_VISIBILITY: "public" },
      stdio: "ignore",
    },
  );
  docsBuild.startedAt = startedAt;
  docsBuild.startedMs = Date.now();
  docsBuild.promise = new Promise((done) =>
    docsBuild.on("exit", (code) => done(code)),
  );
  console.log(
    `${DIM}▸${RESET} warming the docs export ${DIM}(turbo — instant on a cache hit)${RESET}`,
  );
}

async function awaitDocsBuild() {
  if (!docsBuild) return true;
  const code = await docsBuild.promise;
  const completedAt = new Date();
  const warmup = {
    id: "docs-warmup",
    label: "docs export cache warm-up",
    status: code === 0 ? "pass" : "fail",
    durationMs: Date.now() - docsBuild.startedMs,
    required: false,
    command:
      "SITE_VISIBILITY=public pnpm exec turbo run build --filter=@vegastack/docs",
    reason:
      code === 0
        ? "diagnostic warm-up completed"
        : "diagnostic warm-up failed; contracts-run remains freshness authority",
  };
  warmup.measurement = retainMeasurement(
    warmup,
    docsBuild.startedAt,
    completedAt,
  );
  results.push(warmup);
  if (code !== 0 && options.verbose)
    console.log(
      `${DIM}gates: the cache warm-up did not complete; contracts-run will build it itself.${RESET}`,
    );
  return code === 0;
}

// ── modes ────────────────────────────────────────────────────────────────────────────────────────

function stagedFiles() {
  const result = spawnSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );
  return (result.stdout ?? "").split("\n").filter(Boolean);
}

/**
 * Staged files prettier can actually be handed.
 *
 * SYMLINKS ARE EXCLUDED, and this is not a nicety: prettier ERRORS on an explicitly specified
 * symlink ("Explicitly specified pattern … is a symbolic link"), and every new skill in this
 * repository adds exactly two of them (`.claude/skills/<name>` and `.agents/skills/<name>`, both
 * required by tooling/skill-lint.mjs). Without this filter the format gate would block every commit
 * that adds a skill — found by adding the `gates` skill itself. The symlink TARGETS are ordinary
 * staged files and are formatted on their own paths.
 */
function formattableStagedFiles(staged) {
  return staged.filter((file) => {
    try {
      return !lstatSync(join(ROOT, file)).isSymbolicLink();
    } catch {
      return false; // Staged but gone from disk — nothing to format.
    }
  });
}

async function runCommit() {
  const staged = stagedFiles();
  if (staged.length === 0) {
    console.log("gates: nothing staged.");
    return true;
  }
  console.log(
    `${BOLD}gates: pre-commit${RESET} ${DIM}${staged.length} staged file(s)${RESET}\n`,
  );

  const touches = (pattern) => staged.some((file) => pattern.test(file));

  // Always: the two cheapest gates that catch the most, over the whole tree rather than the staged
  // subset. design-lint is 1.4s for all 108 components and secret-scan is 0.6s for 2521 files, so
  // narrowing them would add code and save nothing.
  gate(
    "design-lint",
    "design-lint (registry)",
    ...node("tooling/design-lint.mjs", "packages/ui/registry"),
  );
  gate("secret-scan", "secret-scan", ...node("tooling/secret-scan.mjs"));

  if (touches(/^skills\//)) {
    gate("skill-lint", "skill-lint", ...node("tooling/skill-lint.mjs"));
    gate(
      "skill-mirror",
      "public skill mirror",
      ...node("tooling/sync-package-skills.mjs", "--check"),
    );
  }
  if (touches(/^packages\/ui\/component-contracts\.json$/)) {
    gate(
      "contracts-json",
      "component contracts",
      ...node("tooling/verify-component-contracts.mjs"),
    );
    gate("derived", "contract-derived surfaces", "pnpm", [
      "design:derived:check",
    ]);
  }
  if (touches(/^packages\/ui\/registry\//))
    gate(
      "registry-headers",
      "registry provenance headers",
      ...node("tooling/verify-headers.mjs"),
    );
  if (touches(/^CHANGELOG\.md$/)) {
    gate(
      "changelog",
      "changelog vocabulary",
      ...node("tooling/changelog-lint.mjs"),
    );
    gate(
      "changelog-sync",
      "changelog docs mirror",
      ...node("tooling/sync-changelog.mjs", "--check"),
    );
  }
  if (touches(/^\.github\/workflows\//))
    gate(
      "workflow-security",
      "workflow security",
      ...node("tooling/verify-workflow-security.mjs"),
    );

  // Formatting last: it is the least interesting failure, so it should not be the first thing read.
  const formattable = formattableStagedFiles(staged);
  if (formattable.length > 0)
    gate("format", "prettier (staged)", "pnpm", [
      "exec",
      "prettier",
      "--check",
      "--ignore-unknown",
      ...formattable,
    ]);
  else skip("format", "prettier (staged)", "nothing formattable staged");
  return true;
}

async function runPush() {
  console.log(
    `${BOLD}gates: pre-push${RESET} ${DIM}${baseRef} (${rangeStart.slice(0, 8)}) → working tree · ` +
      `${allChanged.length} changed, ${changed.length} substantive${RESET}\n`,
  );
  if (reusePlan)
    console.log(
      `${DIM}gates: exact-tree reuse shadow: ${reusePlan.decision}; ` +
        `${reusePlan.wouldReuse.length > 0 ? `would reuse ${reusePlan.wouldReuse.join(", ")}, ` : ""}` +
        `executing ${reusePlan.execute.join(", ") || "no browser lane"}. ${reusePlan.checkpoint}${RESET}\n`,
    );

  gate("typecheck", "typecheck (workspace)", "pnpm", ["typecheck"]);
  gate("lint", "lint (workspace)", "pnpm", ["exec", "turbo", "run", "lint"]);

  // TIER BARRIER. The cheap tier runs to completion so its failures are reported together, but the
  // browser tier does NOT start behind a failing one. Measured while building this: a single type
  // error otherwise cost a full 10-minute contract sweep whose result could not matter, because the
  // tree does not compile. The browser lanes are recorded as not-run rather than skipped-as-fine, so
  // the receipt cannot claim coverage the run never had.
  const cheapFailures = results.filter((result) => result.status === "fail");
  if (cheapFailures.length > 0) {
    // The parallel docs build is deliberately NOT killed. Killing the `pnpm` wrapper can orphan
    // turbo/next children anyway, and unlike the capture server a build holds no port — the worst
    // case is that it finishes and populates the cache, which is useful next run. Just stop waiting.
    for (const [id, label] of [
      ["unit", "browser unit suite + axe"],
      ["smoke", "cross-engine smoke (WebKit + Firefox)"],
      ["contracts", "behaviour contracts"],
    ])
      skip(
        id,
        label,
        `not run — ${cheapFailures.map((result) => result.id).join(" + ")} failed first`,
      );
    console.log(
      `\n${YELLOW}gates: stopped before the browser lanes. Fix ${cheapFailures
        .map((result) => result.id)
        .join(" and ")} first — a ${
        contractSelection.routes === null
          ? `full ${COMPONENT_ROUTES.length}-route`
          : "scoped"
      } contract sweep behind a failing ${cheapFailures[0].id} cannot tell you anything.${RESET}`,
    );
    return true;
  }

  // Safe to warm now: the turbo-based gates are done, and the lanes below invoke package scripts
  // directly, so nothing contends for the same turbo task.
  if (contractsRelevant) startDocsBuild();
  if (contractsRelevant) await awaitDocsBuild();

  if (unitRelevant)
    gate("unit", "browser unit suite + axe", "pnpm", [
      "--filter",
      "@vegastack/ui",
      "test",
    ]);
  else
    skip(
      "unit",
      "browser unit suite + axe",
      "no component or package source changed",
    );

  if (smokeRelevant)
    gate("smoke", "cross-engine smoke (WebKit + Firefox)", "pnpm", [
      "--filter",
      "@vegastack/ui",
      "test:smoke",
    ]);
  else
    skip(
      "smoke",
      "cross-engine smoke (WebKit + Firefox)",
      "no smoke-selected component changed",
    );

  if (contractsRelevant) {
    gate(
      "contracts",
      `behaviour contracts (${
        contractSelection.routes === null
          ? `all ${COMPONENT_ROUTES.length} routes`
          : `${contractSelection.routes.size} route(s)`
      })`,
      ...node("tooling/contracts-run.mjs", "--base", baseRef),
    );
  } else
    skip(
      "contracts",
      "behaviour contracts",
      `${contractSelection.reason} — no route in scope`,
    );

  return true;
}

async function runComponent() {
  const name = options.component;
  const source = join(ROOT, `packages/ui/registry/ui/${name}.tsx`);
  const hookSource = join(ROOT, `packages/ui/registry/ui/${name}.ts`);
  if (!existsSync(source) && !existsSync(hookSource))
    fatal(`no registry source at packages/ui/registry/ui/${name}.{tsx,ts}`);
  console.log(`${BOLD}gates: component ${name}${RESET}\n`);

  // Safe to warm immediately: nothing in this lane is a turbo run — design-lint is a plain node
  // script and the unit test goes straight to vitest.
  startDocsBuild();
  gate(
    "design-lint",
    "design-lint (registry)",
    ...node("tooling/design-lint.mjs", "packages/ui/registry"),
  );
  await awaitDocsBuild();

  const testFile = `registry/ui/${name}.test.tsx`;
  if (existsSync(join(ROOT, "packages/ui", testFile)))
    gate("unit", `unit suite — ${name}`, "pnpm", [
      "--filter",
      "@vegastack/ui",
      "exec",
      "vitest",
      "run",
      testFile,
    ]);
  else skip("unit", `unit suite — ${name}`, "no test file yet");

  // EXPLICIT ROUTES, not the diff scope. This is the inner loop for ONE component, so it must check
  // that component and everything composing it — nothing else, and nothing less. Deriving the routes
  // from the working-tree diff instead (as this did first) meant that on a tree carrying any global
  // surface change the "contracts — <name> and its dependents" gate silently became a full sweep:
  // the label promised an inner loop and the behaviour delivered a 9-minute one. The diff-scoped sweep
  // is `gates push`'s job; this stays bounded and honest.
  const route = routeByName.get(name);
  if (!route)
    fatal(
      `${name} has no docs route in packages/ui/component-contracts.json, so its contract lane cannot be scoped`,
    );
  const closure = [...(dependentsByRoute.get(route) ?? [route])].filter(
    (candidate) => CONTRACT_SCOPE.selectableRoutes.has(candidate),
  );
  gate(
    "contracts",
    `behaviour contracts — ${name} + ${closure.length - 1} dependent(s)`,
    ...node("tooling/contracts-run.mjs", "--routes", closure.join(",")),
  );
  return true;
}

async function runShip() {
  console.log(`${BOLD}gates: ship — the full local sweep${RESET}\n`);

  gate("typecheck", "typecheck (workspace)", "pnpm", ["typecheck"]);
  gate("lint", "lint (the full gate chain)", "pnpm", ["lint"]);

  // Same tier barrier as `push`, and it matters more here: the sweep below is ~20 minutes, and none
  // of it can mean anything on a tree that does not compile or does not lint.
  if (results.some((result) => result.status === "fail")) {
    console.log(
      `\n${YELLOW}gates: stopped before the sweep. The ~20-minute browser and consume lanes cannot ` +
        `produce a usable verdict behind a failing cheap gate.${RESET}`,
    );
    return true;
  }

  // Warm only now — see startDocsBuild: overlapping a turbo-based gate makes two turbo runs contend.
  startDocsBuild();
  await awaitDocsBuild();

  gate("unit", "browser unit suite + axe", "pnpm", [
    "--filter",
    "@vegastack/ui",
    "test",
  ]);
  gate("smoke", "cross-engine smoke (WebKit + Firefox)", "pnpm", [
    "--filter",
    "@vegastack/ui",
    "test:smoke",
  ]);
  // The barrier above keeps every browser lane out of cold-export pressure.
  gate(
    "all-browsers",
    "three-engine suite (complete)",
    "pnpm",
    ["--filter", "@vegastack/ui", "test:all-browsers"],
    { env: { ...process.env, HOME: process.env.HOME } },
  );
  gate("registry", "registry build (must be idempotent)", "pnpm", [
    "registry:build",
  ]);
  gate("consume", "shadcn consume round-trip", "pnpm", [
    "registry:verify-consume",
  ]);
  gate(
    "contracts",
    `behaviour contracts (ALL ${COMPONENT_ROUTES.length} routes)`,
    ...node("tooling/contracts-run.mjs", "--all"),
  );
  return true;
}

// ── receipt ──────────────────────────────────────────────────────────────────────────────────────

/**
 * `GATES_SKIP=<reason>` records a deliberate skip instead of silently bypassing with `--no-verify`.
 * The receipt guard fails on any recorded skip until MK acknowledges it, so this is a loud door, not
 * a back door.
 */
const declaredSkip = process.env.GATES_SKIP?.trim() || null;

function writeReceipt() {
  const { hash, files } = workingTreeContentHash();
  const profile = mode === "ship" ? PRODUCTION_PROFILE : CHANGE_PROFILE;
  const gates = {};
  for (const result of results) {
    if (!ALL_GATES.includes(result.id)) continue;
    gates[result.id] = {
      status: result.status,
      durationMs: result.durationMs,
      ...(result.reason ? { reason: result.reason } : {}),
    };
    if (result.id === "unit") gates[result.id].engines = ["chromium"];
    if (result.id === "smoke" || result.id === "all-browsers")
      gates[result.id].engines = [...BROWSER_ENGINES];
  }

  // The contracts gate's own report carries the facts the guard needs to reject a green-but-empty
  // run. Read it rather than re-deriving, so the receipt and the report cannot disagree.
  const contractsReport = (() => {
    try {
      return JSON.parse(
        readFileSync(join(GATES_DIR, "contracts.json"), "utf8"),
      );
    } catch {
      return null;
    }
  })();
  if (gates.contracts && contractsReport) {
    gates.contracts.executed = contractsReport.executed ?? 0;
    gates.contracts.expected = contractsReport.expected ?? 0;
    gates.contracts.full = contractsReport.scope?.full ?? false;
    gates.contracts.scopeRoutes = contractsReport.scope?.routes?.length ?? 0;
    gates.contracts.routes = contractsReport.scope?.routes ?? [];
    if (contractsReport.status === "skipped")
      gates.contracts.status = "skipped";
  }
  if (gates.contracts?.status === "pass" && !contractsReport)
    fatal(
      "contracts passed but .gates/contracts.json is missing or unreadable; refusing to write unverifiable receipt evidence",
    );

  const evidence = buildEvidenceManifest({
    profile,
    required: {
      contracts: contractsRelevant,
      unit: unitRelevant,
      smoke: smokeRelevant,
    },
    contractRoutes:
      profile === PRODUCTION_PROFILE
        ? COMPONENT_ROUTES
        : (contractsReport?.scope?.routes ?? []),
    tree: hash,
    toolchain: installedToolchain(),
    contractSha256: contractSha256(),
    passedGates: Object.entries(gates)
      .filter(([, entry]) => entry.status === "pass")
      .map(([name]) => name),
  });

  const candidate = {
    schema: SCHEMA,
    profile,
    tree: hash,
    treeFiles: files,
    head: resolveCommit("HEAD"),
    writtenAt: new Date().toISOString(),
    mode,
    base: { ref: baseRef, sha: rangeStart },
    host: { platform: platform(), arch: arch(), node: process.version },
    toolchain: installedToolchain(),
    contractSha256: contractSha256(),
    evidence,
    classified: {
      contracts: contractsRelevant,
      unit: unitRelevant,
      smoke: smokeRelevant,
      contractsReason: contractSelection.reason,
    },
    gates,
    skips: declaredSkip
      ? results
          .filter(
            (result) =>
              result.status === "fail" && ALL_GATES.includes(result.id),
          )
          .map((result) => ({ gate: result.id, reason: declaredSkip }))
      : [],
  };
  if (mode === "push") {
    const selected = chooseMonotonicReceipt({
      existing: readReceipt(),
      candidate,
      context: {
        treeHash: hash,
        pinned: pinnedToolchain(),
        contractSha: contractSha256(),
      },
    });
    receiptDisposition = selected.disposition;
    writeReceiptFile(selected.receipt);
    return selected.receipt;
  }
  receiptDisposition = "wrote-production-full";
  writeReceiptFile(candidate);
  return candidate;
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────────

const RUNNERS = {
  commit: runCommit,
  push: runPush,
  component: runComponent,
  ship: runShip,
};
let receiptDisposition = null;
await RUNNERS[mode]();

const failed = results.filter(
  (result) => result.status === "fail" && result.required !== false,
);
const completedAt = new Date();
const totalDurationMs = Date.now() - runStartedMs;
const totalMeasurement = {
  schema: MEASUREMENT_SCHEMA,
  generation,
  runId,
  kind: "local-run",
  mode,
  segment: "total",
  status: failed.length === 0 ? "pass" : "fail",
  startedAt: runStartedAt.toISOString(),
  completedAt: completedAt.toISOString(),
  durationMs: totalDurationMs,
  measurementClass: "measured",
  scope: {
    changedFiles: allChanged.length,
    substantiveFiles: changed.length,
    routeCount:
      results.find((result) => result.id === "contracts")?.measurement?.scope
        ?.routeCount ?? null,
    checkCount:
      results.find((result) => result.id === "contracts")?.measurement?.scope
        ?.checkCount ?? null,
  },
  environment,
  cache: { state: cacheState },
  coldWarm,
  ...(reusePlan ? { exactTreeReuse: reusePlan } : {}),
  retryCount: 0,
  resources: {
    summedCpuMs: { measurementClass: "unknown", value: null },
    peakRssBytes: { measurementClass: "unknown", value: null },
  },
};
writeRunMeasurement(totalMeasurement);
const summary = {
  schema: MEASUREMENT_SCHEMA,
  generation,
  runId,
  mode,
  startedAt: runStartedAt.toISOString(),
  completedAt: completedAt.toISOString(),
  totalDurationMs,
  measurementClass: "measured",
  environment,
  cache: { state: cacheState },
  coldWarm,
  base: { ref: baseRef, sha: rangeStart },
  changed: { total: allChanged.length, substantive: changed.length },
  classified: {
    contracts: contractsRelevant,
    unit: unitRelevant,
    smoke: smokeRelevant,
  },
  gates: results,
};
atomicWriteJson(join(GATES_DIR, `${mode}.json`), summary);

console.log("");
if (failed.length === 0) {
  rmSync(LAST_FAILURE, { force: true });
  const receipt =
    mode === "push" || mode === "ship"
      ? options.receipt
        ? writeReceipt()
        : null
      : null;
  console.log(
    `${GREEN}gates: ${results.filter((r) => r.status === "pass" && r.required !== false).length} passed${RESET}` +
      `${results.some((r) => r.status === "skipped") ? `, ${results.filter((r) => r.status === "skipped").length} skipped` : ""}` +
      `${results.some((r) => r.required === false && r.id === "docs-warmup") ? ", 1 docs-warmup diagnostic" : ""}`,
  );
  if (receipt) {
    console.log(
      `${DIM}gates: receipt ${receiptDisposition ?? "written"} for tree ${receipt.tree}${RESET}`,
    );
    // THE ORDERING TRAP, now enforced rather than documented.
    //
    // The hook runs AFTER the commit, so a receipt it writes here is not in that commit. The
    // discipline is: run the gates on the dirty tree, then commit the code AND the receipt together —
    // which works because `.gates/` is excluded from the tree hash, so adding the receipt to the
    // commit cannot change the hash it attests to.
    //
    // Commit first and the receipt in HEAD describes the PREVIOUS tree. CI rejects it correctly, but
    // eight minutes later and in someone else's terminal. This was walked into during development
    // (commit 13a89dd carried a receipt for tree 227f… on a tree that hashed to c4b5…), so the
    // invariant is checked here where it is cheap to fix.
    const committed = (() => {
      try {
        return JSON.parse(
          spawnSync("git", ["show", `HEAD:${RECEIPT_REPO_PATH}`], {
            cwd: ROOT,
            encoding: "utf8",
          }).stdout,
        );
      } catch {
        return null;
      }
    })();
    if (committed?.tree !== receipt.tree) {
      console.error(
        `\n${RED}gates: the receipt in HEAD does not describe this tree.${RESET}\n` +
          `${DIM}  in HEAD : ${committed?.tree ?? "(no receipt committed)"}\n` +
          `  this tree: ${receipt.tree}${RESET}\n` +
          `${YELLOW}gates: every workflow's receipt-guard would reject this push. The gates ran and ` +
          `passed — only the record is missing from the commit. Fix it with:${RESET}\n\n` +
          `    git add ${RECEIPT_REPO_PATH} && git commit --amend --no-edit && git push\n\n` +
          `${DIM}gates: next time, run \`pnpm gates:push\` BEFORE committing and include ` +
          `${RECEIPT_REPO_PATH} in the commit — \`.gates/\` is excluded from the tree hash, so doing ` +
          `that cannot invalidate the receipt it writes.${RESET}`,
      );
      process.exit(1);
    }
    console.log(
      `${DIM}gates: the receipt in HEAD covers this tree — CI will accept it.${RESET}`,
    );
  }
  process.exit(0);
}

const { hash: failedTree } = workingTreeContentHash();
atomicWriteJson(LAST_FAILURE, {
  mode,
  runId,
  tree: failedTree,
  completedAt: new Date().toISOString(),
  base: { ref: baseRef, sha: rangeStart },
  failures: failed,
  reports: [
    ...results.map((result) =>
      join(".gates", "runs", runId, `${result.id}.json`),
    ),
    ...(existsSync(join(GATES_DIR, "contracts.json"))
      ? [join(".gates", "contracts.json")]
      : []),
  ],
});
// A failed exact-tree push is newer evidence than an earlier success. Preserve the production
// manifest for diagnosis, but annotate its failed lanes so neither reuse nor CI can treat it as a
// pass. This happens even without GATES_SKIP; a later retry must not erase the original failure.
const failedPushReceipt =
  mode === "push" && options.receipt ? writeReceipt() : null;
console.error(
  `${RED}gates: ${failed.length} gate(s) failed — ${failed.map((r) => r.id).join(", ")}${RESET}\n` +
    `${DIM}gates: details in .gates/last-failure.json. Load the \`gates\` skill to classify each ` +
    `failure at its root rather than reading raw output.${RESET}`,
);

// The loud door. `--no-verify` bypasses the hook and leaves NO trace; `GATES_SKIP=<reason>` lets the
// same push happen while writing the failure into the receipt, where `receipt-guard` rejects it until
// MK acknowledges. Exiting 0 here is the point: the local gate yields, CI does not.
if (declaredSkip && (mode === "push" || mode === "ship")) {
  const receipt =
    mode === "push"
      ? failedPushReceipt
      : options.receipt
        ? writeReceipt()
        : null;
  console.error(
    `${YELLOW}gates: GATES_SKIP is set — "${declaredSkip}"${RESET}\n` +
      `${YELLOW}gates: the push is allowed and the failure is RECORDED` +
      `${receipt ? ` in ${RECEIPT_REPO_PATH} (${receipt.skips.length} skip(s))` : ""}.${RESET}\n` +
      `${YELLOW}gates: CI will reject this receipt. That is not a bug — it is what makes skipping ` +
      `visible instead of silent.${RESET}`,
  );
  process.exit(0);
}
process.exit(1);

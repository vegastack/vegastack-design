#!/usr/bin/env node
// Keep turbo.json honest about which tooling scripts are BUILD inputs.
//
// WHY THIS EXISTS
//   `turbo.json` used to declare `globalDependencies: ["tooling/**"]`, so editing ANY script in
//   tooling/ — the gate ladder, a verifier, an audit harness — invalidated every cached task,
//   including the ~1m40 docs export that the contract lane needs (audit 2026-09-07, TG-07/TD-7).
//   The list is now the exact set of scripts a build actually executes. A list that is narrowed by
//   hand rots in both directions: a build-time script left off it means a stale export served to
//   the contract lane as fresh (fail-open), and a glob that quietly widens back to `tooling/**` means
//   the cost came back (waste). Both are asserted here, in `pnpm lint`.
//
// WHAT COUNTS AS A BUILD-TIME SCRIPT
//   Anything reachable from a turbo `build` task or from the two root scripts whose OUTPUT is a
//   committed build input (`registry:build` writes public/r and the docs copy-in; `design:derived`
//   writes the generated route and catalog files): every `tooling/*.mjs` those scripts invoke,
//   directly or through a `pnpm <script>` hop inside the same package, plus the transitive closure
//   of their relative imports inside tooling/.
//
// WHAT ELSE IS ASSERTED
//   With `tooling/**` gone from the global hash, a task that RUNS a tooling script must list
//   `$TURBO_ROOT$/tooling/**` (or `tooling/**` for a root task) in its own inputs, or an edit to
//   design-lint.mjs would leave `@vegastack/ui#lint` a cache hit. Every such task is checked.
//
// USAGE
//   node tooling/verify-turbo-inputs.mjs              # verify the committed turbo.json
//   node tooling/verify-turbo-inputs.mjs --self-test  # prove the checks reject the known mutations

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { readJson, relativeToRoot, ROOT } from "./lib/fs.mjs";

const TOOLING_REF = /(?:\.\.\/)*tooling\/[\w./-]+\.mjs/g;
const RELATIVE_IMPORT = /(?:from\s+|import\()\s*["'](\.{1,2}\/[^"']+)["']/g;
/** Root scripts whose output is a committed build input. */
const ROOT_BUILD_SCRIPTS = ["registry:build", "design:derived"];
/** Package scripts that ARE the turbo build task (pnpm runs the pre/post hooks around `build`). */
const PACKAGE_BUILD_SCRIPTS = ["prebuild", "build", "postbuild"];

/** Every workspace package directory, from pnpm-workspace.yaml's globs (single-level `<dir>/*`). */
function workspacePackages() {
  const workspace = readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf8");
  const globs = [...workspace.matchAll(/^\s*-\s*"([^"]+)"/gm)].map((m) => m[1]);
  const dirs = [];
  for (const glob of globs) {
    const [parent, star] = glob.split("/");
    assert.equal(
      star,
      "*",
      `unsupported workspace glob ${glob} — extend verify-turbo-inputs`,
    );
    const parentDir = join(ROOT, parent);
    if (!existsSync(parentDir)) continue;
    for (const entry of readdirSync(parentDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifest = join(parentDir, entry.name, "package.json");
      if (existsSync(manifest)) dirs.push(join(parentDir, entry.name));
    }
  }
  return dirs;
}

/**
 * The tooling scripts a package script executes: direct `node …/tooling/x.mjs` references, the same
 * through any `pnpm <script>` hop inside the package, and the tooling imports of any package-local
 * script file it runs (`node scripts/x.mjs`, `tsx scripts/x.ts`).
 */
function toolingScriptsOf(packageDir, scripts, name, seen = new Set()) {
  const script = scripts[name];
  if (!script || seen.has(name)) return [];
  seen.add(name);
  const out = [];
  for (const ref of script.match(TOOLING_REF) ?? [])
    out.push(relativeToRoot(resolve(packageDir, ref)));
  for (const hop of script.matchAll(/\bpnpm\s+(?:run\s+)?([\w:.-]+)/g))
    out.push(...toolingScriptsOf(packageDir, scripts, hop[1], seen));
  for (const local of script.matchAll(
    /\b(?:node|tsx)\s+((?:scripts|src|bin)\/[\w./-]+)/g,
  )) {
    const file = join(packageDir, local[1]);
    if (!existsSync(file)) continue;
    for (const ref of readFileSync(file, "utf8").match(TOOLING_REF) ?? [])
      out.push(relativeToRoot(resolve(dirname(file), ref)));
  }
  return out;
}

/** Transitive closure over relative imports that stay inside tooling/. */
function importClosure(entries) {
  const closed = new Set();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop();
    if (closed.has(file)) continue;
    const absolute = join(ROOT, file);
    if (!existsSync(absolute))
      throw new Error(`build-time script does not exist: ${file}`);
    closed.add(file);
    const source = readFileSync(absolute, "utf8");
    for (const match of source.matchAll(RELATIVE_IMPORT)) {
      const target = relativeToRoot(resolve(dirname(absolute), match[1]));
      if (target.startsWith("tooling/")) queue.push(target);
    }
  }
  return [...closed].sort();
}

/** Every build-time tooling script, closed over imports. */
export function buildTimeScripts() {
  const rootManifest = readJson(join(ROOT, "package.json"));
  const entries = new Set();
  for (const name of ROOT_BUILD_SCRIPTS)
    for (const file of toolingScriptsOf(ROOT, rootManifest.scripts, name))
      entries.add(file);
  for (const dir of workspacePackages()) {
    const manifest = readJson(join(dir, "package.json"));
    for (const name of PACKAGE_BUILD_SCRIPTS)
      for (const file of toolingScriptsOf(dir, manifest.scripts ?? {}, name))
        entries.add(file);
  }
  return importClosure([...entries]);
}

/** task id → whether the script it runs executes anything under tooling/. */
function tasksRunningTooling() {
  const tasks = new Map();
  const rootManifest = readJson(join(ROOT, "package.json"));
  for (const [name, script] of Object.entries(rootManifest.scripts))
    if (TOOLING_REF.test(script) || /\bpnpm\s+[\w:.-]+/.test(script)) {
      TOOLING_REF.lastIndex = 0;
      const runs = toolingScriptsOf(ROOT, rootManifest.scripts, name);
      if (runs.length > 0) tasks.set(`//#${name}`, true);
    }
  TOOLING_REF.lastIndex = 0;
  for (const dir of workspacePackages()) {
    const manifest = readJson(join(dir, "package.json"));
    for (const name of Object.keys(manifest.scripts ?? {})) {
      if (PACKAGE_BUILD_SCRIPTS.includes(name)) continue;
      const runs = toolingScriptsOf(dir, manifest.scripts, name);
      if (runs.length > 0) tasks.set(`${manifest.name}#${name}`, true);
    }
  }
  return tasks;
}

/** The effective inputs for `pkg#task`: the package-specific entry, else the base task. */
function effectiveTask(config, pkg, task) {
  return config.tasks?.[`${pkg}#${task}`] ?? config.tasks?.[task] ?? null;
}

export function check(config, { expected = buildTimeScripts() } = {}) {
  const problems = [];
  const declared = [...(config.globalDependencies ?? [])];

  for (const glob of declared) {
    if (/[*?[]/.test(glob))
      problems.push(
        `globalDependencies contains the glob "${glob}" — every entry must name one build-time script ` +
          `exactly, or an edit to any tooling script invalidates every cached task again`,
      );
    else if (!expected.includes(glob))
      problems.push(
        `globalDependencies lists "${glob}", which no build task executes — it invalidates the docs ` +
          `export for nothing`,
      );
  }
  for (const file of expected)
    if (!declared.includes(file))
      problems.push(
        `globalDependencies is missing "${file}", which a build executes — editing it would leave a ` +
          `stale cached build, served to the contract lane as fresh`,
      );

  for (const [taskId] of tasksRunningTooling()) {
    if (taskId.startsWith("//#")) {
      // A root task not declared in turbo.json is not a turbo task at all; only declared ones are
      // cached and therefore only those need the inputs.
      const task = config.tasks?.[taskId];
      if (!task || task.cache === false) continue;
      const inputs = task.inputs ?? [];
      const covered =
        inputs.includes("tooling/**") ||
        inputs.includes("$TURBO_ROOT$/tooling/**") ||
        (inputs.includes("$TURBO_DEFAULT$") &&
          !inputs.some((input) => /^!.*tooling/.test(input)));
      if (!covered)
        problems.push(
          `${taskId} runs tooling scripts but its inputs do not cover tooling/** — a tooling edit ` +
            `would not invalidate its cache`,
        );
      continue;
    }
    const [pkg, name] = taskId.split("#");
    const task = effectiveTask(config, pkg, name);
    if (!task || task.cache === false) continue;
    if (!(task.inputs ?? []).includes("$TURBO_ROOT$/tooling/**"))
      problems.push(
        `${taskId} runs tooling scripts but its effective inputs lack "$TURBO_ROOT$/tooling/**" — ` +
          `with tooling/** no longer global, a tooling edit would leave it a cache hit`,
      );
  }
  return problems;
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === new URL(import.meta.url).pathname;

if (isMain) {
  const config = readJson(join(ROOT, "turbo.json"));
  const expected = buildTimeScripts();

  if (process.argv.includes("--self-test")) {
    // Each mutation must be rejected FOR ITS OWN REASON, and the real config must pass first.
    const clean = check(config, { expected });
    assert.deepEqual(
      clean,
      [],
      `the committed turbo.json must pass before mutations mean anything: ${clean.join(" | ")}`,
    );
    const mutate = (fn) => {
      const copy = structuredClone(config);
      fn(copy);
      return check(copy, { expected });
    };
    const expectProblem = (problems, pattern, label) => {
      assert.ok(
        problems.some((problem) => pattern.test(problem)),
        `${label} must be rejected (/${pattern.source}/), got: ${problems.join(" | ") || "(no problems)"}`,
      );
    };
    expectProblem(
      mutate((c) => (c.globalDependencies = ["tooling/**"])),
      /contains the glob "tooling\/\*\*"/,
      "the old catch-all glob",
    );
    expectProblem(
      mutate((c) => c.globalDependencies.push("tooling/audit/**")),
      /contains the glob "tooling\/audit\/\*\*"/,
      "the audit harness as a build input",
    );
    expectProblem(
      mutate((c) => c.globalDependencies.push("tooling/gates.mjs")),
      /lists "tooling\/gates\.mjs", which no build task executes/,
      "a non-build script listed as a build input",
    );
    expectProblem(
      mutate(
        (c) =>
          (c.globalDependencies = c.globalDependencies.filter(
            (f) => f !== expected[0],
          )),
      ),
      new RegExp(
        `is missing "${expected[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
      ),
      "a build-time script dropped from the list",
    );
    expectProblem(
      mutate((c) => (c.tasks.lint.inputs = ["$TURBO_DEFAULT$"])),
      /@vegastack\/ui#lint runs tooling scripts but its effective inputs lack/,
      "a package lint task that forgot tooling/**",
    );
    expectProblem(
      mutate((c) => (c.tasks["//#design:verify"].inputs = ["skills/**"])),
      /\/\/#design:verify runs tooling scripts but its inputs do not cover tooling/,
      "a root task that forgot tooling/**",
    );
    console.log(
      "✓ turbo-inputs self-test: the catch-all glob, an audit-harness glob, a non-build script, a " +
        "dropped build-time script, and a lint task without tooling/** are all rejected",
    );
    process.exit(0);
  }

  const problems = check(config, { expected });
  if (problems.length > 0) {
    console.error(
      `✗ turbo-inputs: ${problems.length} problem(s) in turbo.json`,
    );
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      `\n  build-time scripts (derived): \n${expected.map((f) => `    "${f}",`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log(
    `✓ turbo-inputs: globalDependencies names exactly the ${expected.length} build-time tooling scripts, ` +
      `and every task that runs a tooling script hashes tooling/**`,
  );
}

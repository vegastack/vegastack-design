#!/usr/bin/env node
// `pnpm verify` — the ONE command. Identical on a laptop, on the Linux CI runner, and in the
// release chain (docs/plans/2026-09-08-verification-rebuild.md § 3).
//
// It is a script rather than a shell one-liner for exactly one reason: the cleanup step must run
// whether the run passed or failed, and the run's exit code must survive it. A `&&` chain cannot
// express a `finally`, and `a && b ; c ; exit $?` in a package.json string is the kind of thing that
// silently starts reporting the cleanup's exit code instead of the suite's.
//
// STEP ORDER IS DELIBERATE — cheapest disproof first:
//   typecheck      the whole workspace compiles at all
//   lint           the static gate chain (which itself ends in `turbo run lint`)
//   design:verify  the product invariants: tokens, contracts, RSC safety, theme parity, …
//   test (ui)      the browser suite: unit + axe + the geometry contracts from WP1
//
// The browser suite runs THROUGH TURBO, not `pnpm --filter @vegastack/ui test`. Turbo's `test` task
// dependsOn `^build`, and the suite imports `@vegastack/design`, whose dist is gitignored. Run bare
// in a clean checkout, vite cannot resolve that import and the run HANGS on pre-transform errors
// rather than failing — reproduced on vsk-node-05 during WP0.

import { spawnSync } from "node:child_process";

const STEPS = [
  { name: "typecheck", argv: ["pnpm", "typecheck"] },
  { name: "lint", argv: ["pnpm", "lint"] },
  { name: "design:verify", argv: ["pnpm", "design:verify"] },
  {
    name: "test (@vegastack/ui)",
    argv: ["pnpm", "exec", "turbo", "run", "test", "--filter=@vegastack/ui"],
  },
];

function run([command, ...args]) {
  return (
    spawnSync(command, args, { stdio: "inherit", shell: false }).status ?? 1
  );
}

const started = Date.now();
let status = 0;
let failed = null;

for (const step of STEPS) {
  console.log(`\n[1mverify: ${step.name}[0m`);
  status = run(step.argv);
  if (status !== 0) {
    failed = step.name;
    break;
  }
}

// The `finally`. Unconditional, and its own failure must not mask the run's result: a cleanup that
// could turn a red run green (or a green run red) would be worse than no cleanup at all.
const cleanup = run([
  "node",
  "tooling/workspace-clean.mjs",
  "--after-run",
  "--quiet",
]);
if (cleanup !== 0)
  console.error(
    "verify: workspace-clean --after-run failed; the verification result below is unaffected",
  );

const seconds = ((Date.now() - started) / 1000).toFixed(1);
if (status === 0) console.log(`\n[32mverify: passed[0m in ${seconds}s`);
else console.error(`\n[31mverify: FAILED at ${failed}[0m after ${seconds}s`);

process.exit(status);

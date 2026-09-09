#!/usr/bin/env node
// `pnpm verify` (and `pnpm verify:release`) — the ONE command, in two modes. Identical on a laptop,
// on the Linux CI runner, and in the release chain (docs/plans/2026-09-08-verification-rebuild.md
// § 3.1 / § 3.4).
//
// It is a script rather than a shell one-liner for three reasons, and each of them has already bitten
// this repository:
//
//   1. The cleanup step must run whether the run passed or failed, and the run's exit code must
//      survive it. A `&&` chain cannot express a `finally`, and `a && b ; c ; exit $?` in a
//      package.json string is the kind of thing that silently starts reporting the cleanup's exit
//      code instead of the suite's.
//   2. `SITE_VISIBILITY=public cmd-a && cmd-b` sets the variable for cmd-a ONLY. The release chain
//      was written that way, so `verify:metadata` ran with SITE_VISIBILITY unset, defaulted to
//      `private`, and failed with `robots metadata missing noindex`. Env belongs to a step here, and
//      every step declares its own.
//   3. Ctrl-C must not leave a directory of Playwright artifacts behind. SIGINT/SIGTERM are handled
//      below: the running child is killed, the same cleanup runs, and the process exits 130.
//
// VERIFY — STEP ORDER IS DELIBERATE, cheapest disproof first:
//   typecheck      the whole workspace compiles at all
//   lint           the static gate chain (which itself ends in `turbo run lint`)
//   design:verify  the product invariants: tokens, contracts, RSC safety, theme parity, …
//   test           the browser suite (@vegastack/ui) AND the @vegastack/design node suite
//
// The suites run THROUGH TURBO, not `pnpm --filter … test`. Turbo's `test` task dependsOn `^build`,
// and the browser suite imports `@vegastack/design`, whose dist is gitignored. Run bare in a clean
// checkout, vite cannot resolve that import and the run HANGS on pre-transform errors rather than
// failing — reproduced on vsk-node-05 during WP0. `@vegastack/design`'s three node tests
// (`compare`, `check-updates`, `skills-install`) gate the CLI that consumers actually run; before
// this they were executed by no gate at all — not `pnpm lint`, not CI, not the release chain.
//
// RELEASE — the outward-step extras, run only by deploy.yml (and by hand before a deploy):
//   the docs export in BOTH visibility matrices, the link check, the docs-shell contracts over that
//   export (and their self-test), the registry build and its idempotency assertion, the real
//   `shadcn add` consume round-trip, and the three-engine suite.

import { spawn } from "node:child_process";
import { constants, tmpdir } from "node:os";
import { join } from "node:path";

// The before/after baseline for the registry idempotency check lives OUTSIDE the repository on
// purpose: a file written into the tree between the snapshot and the comparison would itself read
// as newly introduced drift, which is the bug this comparison exists to remove.
const REGISTRY_BASELINE = join(tmpdir(), "vegastack-registry-build-baseline");

const MODES = {
  verify: [
    { name: "typecheck", argv: ["pnpm", "typecheck"] },
    { name: "lint", argv: ["pnpm", "lint"] },
    { name: "design:verify", argv: ["pnpm", "design:verify"] },
    {
      name: "test (@vegastack/ui, @vegastack/design)",
      argv: [
        "pnpm",
        "exec",
        "turbo",
        "run",
        "test",
        "--filter=@vegastack/ui",
        "--filter=@vegastack/design",
      ],
    },
  ],
  // Both SITE_VISIBILITY matrices are built, because `verify:metadata` asserts a DIFFERENT contract
  // in each: under `private` every route must carry `noindex`, under `public` the discovery corpus
  // (sitemap, robots, canonical, OG) must be complete and `/internal/*` must still be excluded. One
  // export cannot prove both. Cost: one extra `next build` (~1 min) at release only. The production
  // site is public, so the private matrix is a regression guard on a configuration that is not
  // currently deployed — DROPPING IT is a defensible saving, and an MK decision, not an agent's.
  release: [
    // DISCARD THE DOCS BUILD CACHE FIRST. `apps/docs/next.config.mjs` enables
    // `experimental.turbopackFileSystemCacheForBuild`, so a `next build` can reuse a compiled
    // stylesheet from an earlier run. When that cache predates a change to
    // `apps/docs/app/global.css`, the export keeps the OLD css while the source shows the new —
    // and `verify:emitted-css`, which reads the built stylesheet, then reports the docs shell as
    // off-system with ten literal font weights. That is exactly what it is supposed to do; the
    // input was stale, not the shell. Measured 2026-09-09: the same tree failed with a carried
    // `.next` and passed in both visibility matrices once it was cleared.
    //
    // CI never sees this, because `actions/checkout` runs `git clean -ffdx` and both directories
    // are gitignored — which is the whole reason it costs a local run an hour of misdiagnosis
    // instead of being caught once. Clearing here makes the local command match the runner.
    {
      name: "discard the docs build cache",
      argv: [
        "node",
        "-e",
        "for (const p of ['apps/docs/.next', 'apps/docs/out']) require('node:fs').rmSync(p, { recursive: true, force: true });",
      ],
    },
    // Self-contained on purpose. Every later stage assumes the workspace dists exist
    // (`packages/design-tokens/dist`, `packages/design/dist`, `packages/ui/dist`): the docs build
    // and the consume round-trip both import `@vegastack/design`, and neither runs through turbo's
    // `^build`. In `deploy.yml` this was masked because `pnpm verify` runs first; run standalone on
    // a clean checkout it failed with 1,228 TS2307 errors. Building here makes the documented
    // standalone command true wherever it is run, and it is a turbo cache hit right after `verify`.
    {
      name: "workspace build (turbo, everything but docs)",
      argv: [
        "pnpm",
        "exec",
        "turbo",
        "run",
        "build",
        "--filter=!@vegastack/docs",
      ],
    },
    {
      name: "docs build (SITE_VISIBILITY=private)",
      argv: ["pnpm", "-F", "@vegastack/docs", "build"],
      env: { SITE_VISIBILITY: "private" },
    },
    {
      name: "docs verify:metadata (private)",
      argv: ["pnpm", "-F", "@vegastack/docs", "verify:metadata"],
      env: { SITE_VISIBILITY: "private" },
    },
    {
      name: "docs build (SITE_VISIBILITY=public)",
      argv: ["pnpm", "-F", "@vegastack/docs", "build"],
      env: { SITE_VISIBILITY: "public" },
    },
    {
      name: "docs verify:metadata (public)",
      argv: ["pnpm", "-F", "@vegastack/docs", "verify:metadata"],
      env: { SITE_VISIBILITY: "public" },
    },
    // Links last of the export checks: it reads the PUBLIC export left on disk by the step above.
    {
      name: "docs lint:links (public)",
      argv: ["pnpm", "-F", "@vegastack/docs", "lint:links"],
      env: { SITE_VISIBILITY: "public" },
    },
    // Reads the PUBLIC export the two steps above left on disk, in a real browser: the docs shell
    // must obey the design system it documents (DC-01/02/03/06/12). `--self-test` follows it
    // immediately because it needs the same built export and would otherwise have to rebuild — it
    // cannot live in `pnpm test:tooling`, which runs with no docs build at all.
    {
      name: "docs shell contracts (public)",
      argv: ["node", "tooling/verify-docs-shell.mjs"],
      env: { SITE_VISIBILITY: "public" },
    },
    {
      name: "docs shell contracts --self-test",
      argv: ["node", "tooling/verify-docs-shell.mjs", "--self-test"],
      env: { SITE_VISIBILITY: "public" },
    },
    // The idempotency assertion is a BEFORE/AFTER comparison, not "the tree must be empty". What it
    // has to prove is that `registry:build` changes nothing — not that the developer running it has
    // no scratch files. Conflating the two made an unrelated untracked directory report itself as
    // registry drift. See tooling/assert-clean-tree.mjs.
    {
      name: "registry:build baseline",
      argv: [
        "node",
        "tooling/assert-clean-tree.mjs",
        "--snapshot",
        REGISTRY_BASELINE,
        "the tree before registry:build",
      ],
    },
    { name: "registry:build", argv: ["pnpm", "registry:build"] },
    {
      name: "registry:build idempotency",
      argv: [
        "node",
        "tooling/assert-clean-tree.mjs",
        "--against",
        REGISTRY_BASELINE,
        "the tree after registry:build",
      ],
    },
    {
      name: "registry:verify-consume",
      argv: ["pnpm", "registry:verify-consume"],
    },
    {
      name: "test:all-browsers (@vegastack/ui)",
      argv: ["pnpm", "-F", "@vegastack/ui", "test:all-browsers"],
    },
  ],
};

const mode = process.argv[2] ?? "verify";
if (!Object.hasOwn(MODES, mode)) {
  console.error(
    `verify: unknown mode ${mode} — expected one of ${Object.keys(MODES).join(", ")}`,
  );
  process.exit(2);
}
const label = mode === "verify" ? "verify" : "verify:release";

// ------------------------------------------------------------------ child process + signals

/** The child of the step currently running, so a signal handler can kill it. */
let child = null;
/** The signal that interrupted the run, if any. Set once; a second Ctrl-C is a no-op here. */
let interrupted = null;

function run([command, ...args], env) {
  return new Promise((resolve) => {
    child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: env ? { ...process.env, ...env } : process.env,
    });
    child.on("error", (error) => {
      child = null;
      console.error(`${label}: cannot spawn ${command} — ${error.message}`);
      resolve(1);
    });
    child.on("close", (code, signal) => {
      child = null;
      // A child killed by a signal reports `code === null`; 128+n is the shell convention and keeps
      // "died on SIGSEGV" distinguishable from "exited 1".
      if (signal) resolve(128 + (constants.signals[signal] ?? 0));
      else resolve(code ?? 1);
    });
  });
}

// Ctrl-C in a terminal delivers SIGINT to the whole foreground process group, so the child usually
// dies on its own — but `kill -INT <pid>` (and a supervisor's SIGTERM) targets this process alone,
// and then nothing would stop the child. Kill it explicitly, and let the normal flow fall through to
// the cleanup below rather than exiting from inside the handler: an interrupted run must leave the
// tree as clean as a failed one.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (interrupted !== null) return;
    interrupted = signal;
    console.error(`\n${label}: ${signal} — stopping, then cleaning up`);
    if (child !== null) child.kill(signal);
  });
}

// ------------------------------------------------------------------ the run

const started = Date.now();
let status = 0;
let failed = null;

for (const step of MODES[mode]) {
  if (interrupted !== null) break;
  console.log(`\n[1m${label}: ${step.name}[0m`);
  status = await run(step.argv, step.env);
  if (status !== 0) {
    failed = step.name;
    break;
  }
}

// The `finally`. Unconditional — pass, fail, or interrupt — and its own failure must not mask the
// run's result: a cleanup that could turn a red run green (or a green run red) would be worse than
// no cleanup at all.
const cleanup = await run([
  "node",
  "tooling/workspace-clean.mjs",
  "--after-run",
  "--quiet",
]);
if (cleanup !== 0)
  console.error(
    `${label}: workspace-clean --after-run failed; the verification result below is unaffected`,
  );

const seconds = ((Date.now() - started) / 1000).toFixed(1);
if (interrupted !== null) {
  console.error(
    `\n[31m${label}: INTERRUPTED (${interrupted})[0m after ${seconds}s — workspace cleaned`,
  );
  process.exit(130);
}
if (status === 0) console.log(`\n[32m${label}: passed[0m in ${seconds}s`);
else console.error(`\n[31m${label}: FAILED at ${failed}[0m after ${seconds}s`);

process.exit(status);

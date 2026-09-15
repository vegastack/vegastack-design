#!/usr/bin/env node

// One orchestrator, with non-overlapping responsibilities:
//   static        repository-wide non-browser proof, once on a pull request
//   affected      static + deterministic affected Chromium tests
//   distribution public docs/registry artifact proof, no component regression suite
//
// The complete component suite lives behind the manual-only `pnpm test:full` command. Cleanup and
// signal handling remain centralized here so a failed or interrupted run cannot leave artifacts or
// accidentally report the cleanup's exit code.

import { spawn } from "node:child_process";
import { constants, tmpdir } from "node:os";
import { join } from "node:path";

const REGISTRY_BASELINE = join(tmpdir(), "vegastack-registry-build-baseline");
const forwarded = process.argv.slice(3);

const STATIC_STEPS = [
  { name: "typecheck", argv: ["pnpm", "typecheck"] },
  { name: "lint", argv: ["pnpm", "lint"] },
  { name: "design invariants", argv: ["pnpm", "design:verify"] },
  {
    name: "non-browser design package tests",
    argv: ["pnpm", "-F", "@vegastack/design", "test"],
  },
];

const DISTRIBUTION_STEPS = [
  {
    name: "discard docs build cache",
    argv: [
      "node",
      "-e",
      "for (const p of ['apps/docs/.next', 'apps/docs/out']) require('node:fs').rmSync(p, { recursive: true, force: true });",
    ],
  },
  {
    name: "workspace build (everything but docs)",
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
    name: "registry baseline",
    argv: [
      "node",
      "tooling/assert-clean-tree.mjs",
      "--snapshot",
      REGISTRY_BASELINE,
      "the tree before registry:build",
    ],
  },
  { name: "registry build", argv: ["pnpm", "registry:build"] },
  {
    name: "registry idempotency",
    argv: [
      "node",
      "tooling/assert-clean-tree.mjs",
      "--against",
      REGISTRY_BASELINE,
      "the tree after registry:build",
    ],
  },
  {
    name: "public docs build and export contracts",
    argv: ["pnpm", "-F", "@vegastack/docs", "build"],
    env: { SITE_VISIBILITY: "public" },
  },
  {
    name: "public export links",
    argv: ["pnpm", "-F", "@vegastack/docs", "lint:links"],
    env: { SITE_VISIBILITY: "public" },
  },
  {
    name: "public docs-shell contracts",
    argv: ["node", "tooling/verify-docs-shell.mjs"],
    env: { SITE_VISIBILITY: "public" },
  },
  {
    name: "docs-shell negative self-test",
    argv: ["node", "tooling/verify-docs-shell.mjs", "--self-test"],
    env: { SITE_VISIBILITY: "public" },
  },
  {
    name: "real registry consume",
    argv: ["pnpm", "registry:verify-consume"],
  },
];

const MODES = {
  static: STATIC_STEPS,
  affected: [
    ...STATIC_STEPS,
    {
      name: "affected Chromium tests",
      argv: [
        "node",
        "tooling/affected-tests.mjs",
        ...forwarded,
        "--run",
        "--assume-built",
        "--verify-registry",
      ],
    },
  ],
  distribution: DISTRIBUTION_STEPS,
};

const mode = process.argv[2] ?? "affected";
if (!Object.hasOwn(MODES, mode)) {
  console.error(
    `verify: unknown mode ${mode}; expected ${Object.keys(MODES).join(" | ")}`,
  );
  process.exit(2);
}
const label = `verify:${mode}`;

let child = null;
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
      console.error(`${label}: cannot spawn ${command}: ${error.message}`);
      resolve(2);
    });
    child.on("close", (code, signal) => {
      child = null;
      if (signal) resolve(128 + (constants.signals[signal] ?? 0));
      else resolve(code ?? 1);
    });
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (interrupted !== null) return;
    interrupted = signal;
    console.error(`\n${label}: ${signal}; stopping, then cleaning up`);
    if (child !== null) child.kill(signal);
  });
}

const started = Date.now();
let status = 0;
let failed = null;

for (const step of MODES[mode]) {
  if (interrupted !== null) break;
  const stepStarted = Date.now();
  console.log(`\n\u001b[1m${label}: ${step.name}\u001b[0m`);
  status = await run(step.argv, step.env);
  const seconds = ((Date.now() - stepStarted) / 1000).toFixed(1);
  console.log(`${label}: ${step.name} finished in ${seconds}s`);
  if (status !== 0) {
    failed = step.name;
    break;
  }
}

const cleanup = await run([
  "node",
  "tooling/workspace-clean.mjs",
  "--after-run",
  "--quiet",
]);
if (cleanup !== 0)
  console.error(
    `${label}: workspace-clean --after-run failed; verification status is unchanged`,
  );

const seconds = ((Date.now() - started) / 1000).toFixed(1);
if (interrupted !== null) {
  console.error(
    `\n\u001b[31m${label}: INTERRUPTED (${interrupted})\u001b[0m after ${seconds}s; workspace cleaned`,
  );
  process.exit(130);
}
if (status === 0)
  console.log(`\n\u001b[32m${label}: passed\u001b[0m in ${seconds}s`);
else
  console.error(
    `\n\u001b[31m${label}: FAILED at ${failed}\u001b[0m after ${seconds}s`,
  );

process.exit(status);

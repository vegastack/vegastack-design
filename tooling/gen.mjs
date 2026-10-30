#!/usr/bin/env node
// `pnpm gen` — run every generator in dependency order (30-10-2026). One command replaces the
// per-surface `--check`/`--write` dance: run it after any change, commit what it writes, and CI's
// `gen-clean` check fails only if a generator would still change the tree.
//
//   node tooling/gen.mjs           write every generated surface
//   node tooling/gen.mjs --check   then fail if the working tree differs from before the run
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const check = process.argv.includes("--check");

const steps = [
  [
    "contract fields",
    ["node", "tooling/verify-component-contracts.mjs", "--write"],
  ],
  ["registry", ["pnpm", "-s", "registry:build"]],
  ["contract-derived surfaces", ["node", "tooling/sync-component-derived.mjs"]],
  ["design.md surfaces", ["node", "tooling/sync-design-md.mjs"]],
  ["package skills", ["node", "tooling/sync-package-skills.mjs"]],
  ["email tokens", ["node", "tooling/generate-email-tokens.mjs"]],
  ["toaster mirror", ["node", "tooling/sync-toaster-mirror.mjs"]],
  ["docs changelog", ["node", "tooling/sync-changelog.mjs"]],
];

const status = () =>
  spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" })
    .stdout;
const before = check ? status() : "";

for (const [label, [command, ...args]] of steps) {
  const started = Date.now();
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stdout + result.stderr);
    console.error(`✗ gen: ${label} failed (${args.join(" ")})`);
    process.exit(result.status ?? 1);
  }
  console.log(
    `✓ gen: ${label} (${((Date.now() - started) / 1000).toFixed(1)}s)`,
  );
}

if (check) {
  const after = status();
  if (after !== before) {
    console.error(
      "✗ gen --check: generated files were stale. Run `pnpm gen` and commit the result:",
    );
    console.error(
      spawnSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" })
        .stdout,
    );
    process.exit(1);
  }
  console.log("✓ gen --check: every generated surface is current");
}

#!/usr/bin/env node
// The pre-commit hook's whole body: design-lint over the registry, then prettier over the staged
// set. Measured ~4s. It is kept because it is the cheapest possible signal and blocks nothing that
// matters — a commit is not a publication boundary, and WIP commits, `--amend`, and `rebase -i` all
// fire it.
//
// It is a script only because of the SYMLINK FILTER below, which is the one piece of the old
// `tooling/gates.mjs commit` path worth carrying forward.

import { spawnSync } from "node:child_process";
import { lstatSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function run(command, args) {
  return spawnSync(command, args, { cwd: ROOT, stdio: "inherit" }).status ?? 1;
}

const designLint = run("node", [
  "tooling/design-lint.mjs",
  "packages/ui/registry",
]);
if (designLint !== 0) process.exit(designLint);

const staged = spawnSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
  { cwd: ROOT, encoding: "utf8" },
);
if (staged.status !== 0) {
  console.error("pre-commit: could not read the staged set from git");
  process.exit(1);
}

// SYMLINKS ARE EXCLUDED. `.claude/skills/*` and `.agents/skills/*` are symlinks into
// `skills/{internal,public}/`; prettier follows them and formats — or reports on — the TARGET,
// which is both a surprise and, for a `--check`, a failure attributed to the wrong file. A path that
// is staged but gone from disk (a rename's source) is dropped for the same reason: there is nothing
// to format.
const formattable = staged.stdout
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((file) => {
    try {
      return !lstatSync(join(ROOT, file)).isSymbolicLink();
    } catch {
      return false;
    }
  });

if (formattable.length === 0) {
  console.log("pre-commit: nothing formattable staged");
  process.exit(0);
}

process.exit(
  run("pnpm", [
    "exec",
    "prettier",
    "--check",
    "--ignore-unknown",
    ...formattable,
  ]),
);

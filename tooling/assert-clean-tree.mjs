#!/usr/bin/env node
// Fail if the working tree is dirty, naming what changed.
//
// Used by `pnpm verify:release` immediately after `pnpm registry:build`: that build stamps three
// surfaces (the registry JSON under apps/docs/public/r, the registry SOURCE, and the docs copy-in),
// and it must be idempotent. A dirty tree afterwards means a generated file in git disagrees with
// what the generator produces — the drift that `shadcn add --diff` would then hand to a consumer.
//
// Written as a script rather than `test -z "$(git status --porcelain)"` on purpose: command
// substitution swallows git's own exit code, so a git that FAILED reads as a clean tree.

import { spawnSync } from "node:child_process";

const label = process.argv[2] ?? "the working tree";
const result = spawnSync("git", ["status", "--porcelain"], {
  encoding: "utf8",
});

if (result.status !== 0) {
  console.error(
    `assert-clean-tree: \`git status\` itself failed (exit ${result.status}) — ${result.stderr?.trim()}`,
  );
  process.exit(1);
}

const dirty = result.stdout.trim();
if (dirty.length > 0) {
  console.error(`assert-clean-tree: ${label} is not clean:\n${dirty}`);
  process.exit(1);
}

console.log(`assert-clean-tree: ${label} is clean`);

#!/usr/bin/env node
// Fail if a build changed the working tree, naming exactly what it changed.
//
// Used by `pnpm verify:release` around `pnpm registry:build`: that build stamps three surfaces (the
// registry JSON under apps/docs/public/r, the registry SOURCE, and the docs copy-in), and it must be
// idempotent. A file that differs afterwards means a generated file in git disagrees with what the
// generator produces — the drift `shadcn add --diff` would then hand to a consumer.
//
// WHY THIS COMPARES INSTEAD OF DEMANDING AN EMPTY TREE
//   It used to run a bare `git status --porcelain` and fail on ANY output. That conflates two
//   unrelated things: "the generator is not idempotent", which must fail the release, and "this
//   developer has an untracked scratch file", which must not. The second one reported itself as
//   registry drift, which is a lie in the direction that wastes the most time. It fired for real on
//   2026-09-09, when the tree still carried `.gates/`, `.vrt-review/` and `apps/docs/test-results/`
//   — leftovers of the machinery the 2026-09-08 rebuild deleted, whose .gitignore entries went with
//   it. In CI the tree is always pristine (`actions/checkout` runs `git clean -ffdx`), so the
//   distinction never showed up there.
//
//   So the invariant is stated as what it actually is: run `--snapshot` before the build, `--against`
//   after, and only the DELTA is drift. Pre-existing dirt is reported once, as context, and does not
//   fail the step.
//
// WHY A SCRIPT RATHER THAN `test -z "$(git status --porcelain)"`
//   Command substitution swallows git's own exit code, so a git that FAILED reads as a clean tree.
//   Every git invocation here is checked.

import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function porcelain() {
  const result = spawnSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    console.error(
      `assert-clean-tree: \`git status\` itself failed (exit ${result.status}) — ${result.stderr?.trim()}`,
    );
    process.exit(1);
  }
  // Sorted so the comparison is order-independent; git's ordering is stable in practice but the
  // whole point of this file is not to rely on "in practice".
  return result.stdout.split("\n").filter(Boolean).sort();
}

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : (args[index + 1] ?? null);
};

const snapshotPath = flag("--snapshot");
const againstPath = flag("--against");
const label =
  args.find((argument, index) => {
    if (argument.startsWith("--")) return false;
    return args[index - 1] !== "--snapshot" && args[index - 1] !== "--against";
  }) ?? "the working tree";

if (snapshotPath) {
  const lines = porcelain();
  writeFileSync(snapshotPath, `${lines.join("\n")}\n`);
  console.log(
    lines.length === 0
      ? `assert-clean-tree: baseline recorded — ${label} is clean`
      : `assert-clean-tree: baseline recorded — ${lines.length} pre-existing dirty path(s) in ${label}, which will NOT be counted as drift`,
  );
  process.exit(0);
}

const now = porcelain();

// No baseline (or an unreadable one) means the strict reading: the tree must be clean. That is the
// right default for a caller that did not opt in, and it is what CI effectively asserts anyway.
let baseline = null;
if (againstPath) {
  try {
    baseline = readFileSync(againstPath, "utf8").split("\n").filter(Boolean);
  } catch (error) {
    console.error(
      `assert-clean-tree: could not read the baseline at ${againstPath} (${error.code ?? error.message}) — ` +
        "refusing to guess, so this is judged against a clean tree",
    );
  }
}

const before = new Set(baseline ?? []);
const introduced = now.filter((line) => !before.has(line));
const resolved = (baseline ?? []).filter((line) => !now.includes(line));

if (introduced.length > 0 || resolved.length > 0) {
  console.error(`assert-clean-tree: ${label} changed:`);
  for (const line of introduced) console.error(`  + ${line}`);
  for (const line of resolved)
    console.error(`  - ${line} (was dirty, now is not)`);
  if (before.size > 0)
    console.error(
      `\nassert-clean-tree: ${before.size} pre-existing dirty path(s) were ignored; the lines above are the change.`,
    );
  process.exit(1);
}

console.log(
  before.size === 0
    ? `assert-clean-tree: ${label} is clean`
    : `assert-clean-tree: ${label} is unchanged (${before.size} pre-existing dirty path(s) ignored)`,
);

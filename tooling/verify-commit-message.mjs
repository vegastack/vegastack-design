#!/usr/bin/env node
// Enforce the commit-message shape CLAUDE.md § Commit Message Format already requires.
//
// Deliberately narrow: it checks the SUBJECT LINE only — a conventional-commit type, a scope if
// present, a non-empty description, no trailing period, and a length that survives `git log --oneline`
// and a GitHub PR title. The body's structure is a writing standard, not something a regex should
// police; a hook that rejects a well-written body over formatting would just teach people to bypass it.
//
// Merge, revert, and fixup commits are exempt because git generates their subjects.

import { readFileSync } from "node:fs";

const TYPES = [
  "feat",
  "fix",
  "refactor",
  "docs",
  "chore",
  "perf",
  "style",
  "test",
  "build",
  "ci",
];
const MAX_SUBJECT = 100;

const path = process.argv[2];
if (!path) {
  console.error("verify-commit-message: no commit message file was passed");
  process.exit(2);
}

const message = readFileSync(path, "utf8");
const subject =
  message
    .split("\n")
    .find((line) => line.trim() !== "" && !line.startsWith("#")) ?? "";

const exempt = /^(Merge |Revert |fixup! |squash! )/.test(subject);
const problems = [];

if (!exempt) {
  const match = /^([a-z]+)(\([a-z0-9./-]+\))?(!)?: (.+)$/.exec(subject);
  if (!match)
    problems.push(
      "the subject must read `<type>: <description>` or `<type>(<scope>): <description>`",
    );
  else {
    const [, type, , , description] = match;
    if (!TYPES.includes(type))
      problems.push(
        `\`${type}\` is not a conventional-commit type — use one of ${TYPES.join(", ")}`,
      );
    if (description.length < 10)
      problems.push(
        `the description is ${description.length} character(s); say what changed and why`,
      );
    if (description.endsWith("."))
      problems.push("the subject must not end with a period");
    if (/^(update|fix|change) (files|stuff|things)$/i.test(description))
      problems.push(
        "the description is vague — CLAUDE.md requires a subject that makes sense without the body",
      );
  }
  if (subject.length > MAX_SUBJECT)
    problems.push(
      `the subject is ${subject.length} characters; keep it under ${MAX_SUBJECT} so it survives \`git log --oneline\``,
    );
}

if (problems.length > 0) {
  console.error(`verify-commit-message: rejected\n\n  ${subject}\n`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  console.error(
    `\nExpected shape (CLAUDE.md § Commit Message Format):\n` +
      `  <type>: <concise summary of WHAT and WHY>\n` +
      `  types: ${TYPES.join(", ")}\n`,
  );
  process.exit(1);
}

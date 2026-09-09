#!/usr/bin/env node
// changelog-lint — fail-closed validation of the root CHANGELOG.md:
//   • entry headings: `## [x.y.z] — <Month D, YYYY>` (em dash, friendly date), descending versions
//   • section headings from the FIXED vocabulary only
//   • every commit link's sha exists in this repo (git cat-file)
//   • every /docs (or design.vegastack.com/docs) link resolves to a real content page
// Wired into the docs lint chain; also run by the ship skill before releasing.
//
// The last two rules are exported as `proseProblems()` because a changeset body becomes a
// CHANGELOG bullet verbatim: `tooling/changeset-lint.mjs` runs them at PR time so a dead docs link
// or an unknown sha is caught by the author, not by the release-day lint on the assembled file.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import assert from "node:assert/strict";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "CHANGELOG.md");
const CONTENT = join(ROOT, "apps/docs/content");

export const VOCAB = new Set([
  "🧩 New components",
  "🔧 Changed components",
  "🗑 Removed / renamed",
  "🛠 CLI & tooling",
  "📦 npm",
  "📚 Docs",
  "🐛 Fixed",
  "⚠️ Breaking",
]);
const ENTRY_RE =
  /^## \[(\d+\.\d+\.\d+)\] — (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;

// Anchors and query strings refine the destination; they must not make the underlying page
// disappear from validation.
const docsLinkPattern =
  /\((?:https:\/\/design\.vegastack\.com)?(\/docs\/[a-z0-9\-/]+)(?:[?#][^)\s]+)?\)/g;

/** Every `/docs/...` page path a piece of prose links to, anchors and queries stripped. */
export const docsLinks = (text) =>
  [...text.matchAll(docsLinkPattern)].map((match) => match[1]);

/** Every commit sha a piece of prose links to. */
export const commitShas = (text) =>
  [...text.matchAll(/commit\/([0-9a-f]{7,40})/g)].map((match) => match[1]);

// REACHABILITY, not existence (bugs.md 2026-09-07, root fix deferred to #49 and taken here).
//
// The probe used to be `git cat-file -e <sha>^{commit}`, which asks whether the OBJECT EXISTS in
// the local database. An amended, rebased or squashed commit stays in that database — the reflog
// keeps it alive — long after it stops being reachable from any branch. So a link to an orphaned
// sha passed on the machine that wrote the entry and resolved to nothing on GitHub for everybody
// else: the failure was invisible exactly where it was introduced. That shipped once, in the
// 0.7.0 entry's link to `7ec6372`.
//
// `git merge-base --is-ancestor <sha> HEAD` asks the question the reader's browser will ask: is
// this commit in the history this branch publishes? An orphan is not, so it now fails. A sha that
// is not an object at all also fails, which is the old rule's whole coverage — this is strictly
// stronger, never weaker.
const shaReachable = (sha) => {
  try {
    execSync(`git merge-base --is-ancestor ${sha}^{commit} HEAD`, {
      cwd: ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

const docsPageExists = (path) => {
  const rel = path.replace(/^\/docs\//, "");
  return (
    existsSync(join(CONTENT, "docs", `${rel}.mdx`)) ||
    existsSync(join(CONTENT, "docs", rel, "index.mdx"))
  );
};

/**
 * The rules that apply to any CHANGELOG prose, wherever it is written — the assembled file or a
 * pending changeset body destined to become one of its bullets.
 *
 * `skipCommitShas` is for the changeset caller, which BANS commit links outright (a changeset's
 * sha is pre-merge by construction, so reachability is the wrong question there) and would
 * otherwise report the same link twice under two different rules.
 */
export function proseProblems(text, { skipCommitShas = false } = {}) {
  const problems = [];
  if (!skipCommitShas)
    for (const sha of commitShas(text))
      if (!shaReachable(sha))
        problems.push(
          `commit link references a sha that is not in this branch's history: ${sha} ` +
            `(the object may still exist locally after an amend/rebase/squash; GitHub will 404 it)`,
        );
  for (const path of docsLinks(text))
    if (!docsPageExists(path))
      problems.push(`docs link resolves to no content page: ${path}`);
  return problems;
}

function selfTest() {
  assert.deepEqual(
    docsLinks("See [API](/docs/components/button#api-reference)."),
    ["/docs/components/button"],
  );
  assert.deepEqual(
    docsLinks(
      "See [API](https://design.vegastack.com/docs/components/button?tab=api#props).",
    ),
    ["/docs/components/button"],
  );
}

function main() {
  selfTest();
  const lines = readFileSync(SRC, "utf8").split("\n");
  const problems = [];
  const versions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      const m = ENTRY_RE.exec(line);
      if (!m)
        problems.push(
          `L${i + 1}: bad entry heading (want "## [x.y.z] — July 19, 2026"): ${line}`,
        );
      else versions.push(m[1]);
    }
    if (line.startsWith("### ")) {
      const name = line.slice(4).trim();
      if (!VOCAB.has(name))
        problems.push(
          `L${i + 1}: section "${name}" not in the fixed vocabulary`,
        );
    }
  }

  // descending semver order
  const num = (v) => v.split(".").map(Number);
  for (let i = 1; i < versions.length; i++) {
    const [a, b] = [num(versions[i - 1]), num(versions[i])];
    const cmp = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    if (cmp <= 0)
      problems.push(
        `entries out of order: ${versions[i - 1]} then ${versions[i]} (must be descending)`,
      );
  }
  if (versions.length === 0) problems.push("no version entries found");

  problems.push(...proseProblems(lines.join("\n")));

  if (problems.length) {
    console.error(
      `✗ changelog-lint: ${problems.length} problem(s) in CHANGELOG.md`,
    );
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(
    `✓ changelog-lint: ${versions.length} entr${versions.length === 1 ? "y" : "ies"}, vocabulary/dates/order/shas/links all valid`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

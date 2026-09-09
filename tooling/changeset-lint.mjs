#!/usr/bin/env node
// changeset-lint — a pending changeset must be assemblable into the root CHANGELOG.md.
//
//   node tooling/changeset-lint.mjs                # lint every pending changeset
//   node tooling/changeset-lint.mjs --since <ref>  # lint only changesets absent from <ref>
//
// Two rules, both of them the assembled file's rules applied one PR earlier:
//
//   1. The body OPENS with exactly one of the eight CHANGELOG section emoji, and something
//      follows it. `tooling/changelog-assemble.mjs` owns the vocabulary and the parser.
//   2. The body is valid CHANGELOG prose: every /docs link resolves to a real content page.
//      `tooling/changelog-lint.mjs` owns that rule and exports it as `proseProblems`; a changeset
//      body becomes a bullet verbatim, so a dead link caught here is a link not caught on release
//      day with the entry already written.
//   3. The body carries NO commit link at all.
//
// WHY RULE 3 IS A BAN AND NOT A CHECK
//   `changelog-lint`'s sha rule is reachability from HEAD, which is the right question for the
//   ASSEMBLED file: `changelog-assemble` writes shas of commits already on `main`. It is an
//   unanswerable question for a CHANGESET, which is written BEFORE its own commit exists. Whatever
//   sha an author can name at that point is a pre-merge sha, and the squash or rebase that lands
//   the PR orphans it — so a changeset commit link is wrong by construction, not merely at risk of
//   rotting. The predecessor probe (`git cat-file -e`) could not see that: an orphan stays in the
//   local object database, so the link passed for its author and 404'd for every reader
//   (bugs.md, 2026-09-07). Forbidding the link is the only rule that is true for every changeset.
//   The release entry still links commits — `changelog-assemble` adds them, from merged history.
//
// An EMPTY changeset (`---\n---`) with body text is VALID: it is how a change with no package
// bump (tooling, CI, a repo-wide refactor) still gets a CHANGELOG line. It needs a marker like
// any other. A changeset with an empty body is not valid — `changeset version` would write an
// empty bullet into the package CHANGELOG and assembly would have nothing to place.
//
// There is no grandfather list. Every pending changeset is linted, because a changeset the gate
// skips is one `changelog-assemble` will refuse on release day, when the fix is most expensive.
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  readPendingChangesets,
  resolveSection,
  SECTIONS,
} from "./changelog-assemble.mjs";
import { proseProblems, commitShas } from "./changelog-lint.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Filenames present in `.changeset/` at `ref` — everything else is new and must conform. */
function changesetsAt(ref) {
  const listing = execFileSync(
    "git",
    ["ls-tree", "--name-only", ref, ".changeset/"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
  ).toString();
  return new Set(
    listing
      .split("\n")
      .filter(Boolean)
      .map((path) => path.replace(/^\.changeset\//, "")),
  );
}

export function lintChangesets({
  skip = new Set(),
  changesets = readPendingChangesets(),
  prose = proseProblems,
} = {}) {
  const problems = [];
  let linted = 0;
  for (const changeset of changesets) {
    if (skip.has(changeset.file)) continue;
    linted++;
    const resolved = resolveSection(changeset.body);
    if (resolved.problem) {
      problems.push(`${changeset.file}: ${resolved.problem}`);
      continue;
    }
    for (const sha of commitShas(resolved.text)) {
      problems.push(
        `${changeset.file}: commit link (${sha}) — a changeset must not link a commit. The sha it ` +
          `can name is always a pre-merge one, and the squash/rebase that lands the PR orphans it; ` +
          `the release entry gets its commit links from merged history at assembly time. Describe ` +
          `the change instead, or link the docs page.`,
      );
    }
    for (const problem of prose(resolved.text, { skipCommitShas: true }))
      problems.push(`${changeset.file}: ${problem}`);
  }
  return { problems, linted };
}

function main() {
  const argv = process.argv.slice(2);
  const sinceIndex = argv.indexOf("--since");
  let skip = new Set();
  if (sinceIndex !== -1) {
    const ref = argv[sinceIndex + 1];
    if (!ref) {
      console.error("✗ changeset-lint: --since needs a git ref");
      process.exit(1);
    }
    skip = changesetsAt(ref);
  }

  const { problems, linted } = lintChangesets({ skip });
  if (problems.length) {
    console.error(`✗ changeset-lint: ${problems.length} problem(s)`);
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      "\n  A changeset body must OPEN with exactly one section marker:\n" +
        SECTIONS.map(([marker, section]) => `    ${marker}  → ${section}`).join(
          "\n",
        ) +
        "\n  The marker selects the CHANGELOG.md section; the entry is assembled at version time." +
        "\n  /docs links are checked the same way the assembled file's are. Commit links are BANNED:" +
        "\n  a changeset can only name a pre-merge sha, which the squash/rebase then orphans.",
    );
    process.exit(1);
  }
  console.log(
    `✓ changeset-lint: ${linted} pending changeset(s) carry a valid section marker`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

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
//   2. The body is valid CHANGELOG prose: every commit link's sha exists in this repo and every
//      /docs link resolves to a real content page. `tooling/changelog-lint.mjs` owns those rules
//      and exports them as `proseProblems`; a changeset body becomes a bullet verbatim, so a dead
//      link caught here is a link not caught on release day with the entry already written.
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
import { proseProblems } from "./changelog-lint.mjs";

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
    for (const problem of prose(resolved.text))
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
        "\n  Commit links and /docs links in the body are checked the same way the assembled file's are.",
    );
    process.exit(1);
  }
  console.log(
    `✓ changeset-lint: ${linted} pending changeset(s) carry a valid section marker`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

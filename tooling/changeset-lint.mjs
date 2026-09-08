#!/usr/bin/env node
// changeset-lint — a pending changeset must be assemblable into the root CHANGELOG.md.
//
//   node tooling/changeset-lint.mjs                # lint every pending changeset (minus the grandfathered)
//   node tooling/changeset-lint.mjs --all          # lint every pending changeset, grandfathered included
//   node tooling/changeset-lint.mjs --since <ref>  # lint only changesets absent from <ref>
//
// The rule is one line long: the body OPENS with exactly one of the eight CHANGELOG section
// emoji, and something follows it. `tooling/changelog-assemble.mjs` owns the vocabulary and the
// parser; this script is the gate that runs per PR, so a changeset that cannot be assembled is
// caught at authoring time rather than at `pnpm version-packages` on release day.
//
// An EMPTY changeset (`---\n---`) with body text is VALID: it is how a change with no package
// bump (tooling, CI, a repo-wide refactor) still gets a CHANGELOG line. It needs a marker like
// any other. A changeset with an empty body is not valid — `changeset version` would write an
// empty bullet into the package CHANGELOG and assembly would have nothing to place.
//
// GRANDFATHERING. The fifteen changesets pending on `main` when this gate landed predate the
// convention and belong to other branches' authors; rewriting them here would collide with the
// audit merge train. They are named below and skipped. `changelog-assemble` does NOT skip them —
// it cannot invent a section — so they must be fixed before the next release, which is what the
// empty list after they are consumed will prove. Delete an entry the moment its changeset is gone.
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  readPendingChangesets,
  resolveSection,
  SECTIONS,
} from "./changelog-assemble.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Pending on main when this gate landed, written before the section-marker convention existed.
// A sibling branch that merges another marker-less changeset before this PR does needs one more
// line here (or a marker on its changeset) — the list is "everything pending before WP5".
export const GRANDFATHERED = new Set([
  "animated-icon-factory.md",
  "di1-display-leaves.md",
  "di1-indeterminate-motion.md",
  "do1a-data-attributes.md",
  "f1-interaction-recipes.md",
  "f1-ladder-migration.md",
  "f1-media-scrim-text-gate.md",
  "f1-surface-ladder-tokens.md",
  "f2-button-variant-tone.md",
  "f2-public-skill.md",
  "f2-shadow-lit-removal.md",
  "o1-overlays-floating-surface.md",
  "t2-chip-and-announcer.md",
  "wp1-geometry-contracts.md",
  "wp2-verify-command-empty.md",
  "wp4-ungit-generated-empty.md",
]);

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
  skip = GRANDFATHERED,
  changesets = readPendingChangesets(),
} = {}) {
  const problems = [];
  let linted = 0;
  for (const changeset of changesets) {
    if (skip.has(changeset.file)) continue;
    linted++;
    const resolved = resolveSection(changeset.body);
    if (resolved.problem)
      problems.push(`${changeset.file}: ${resolved.problem}`);
  }
  return { problems, linted };
}

function main() {
  const argv = process.argv.slice(2);
  const sinceIndex = argv.indexOf("--since");
  let skip = argv.includes("--all") ? new Set() : GRANDFATHERED;
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
        "\n  The marker selects the CHANGELOG.md section; the entry is assembled at version time.",
    );
    process.exit(1);
  }
  const skipped = skip === GRANDFATHERED ? GRANDFATHERED.size : 0;
  console.log(
    `✓ changeset-lint: ${linted} pending changeset(s) carry a valid section marker` +
      (skipped ? ` (${skipped} pre-convention changesets skipped)` : ""),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

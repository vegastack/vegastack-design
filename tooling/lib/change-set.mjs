// What changed, and what the content under test actually is.
//
// Three jobs, all shared so that the local gates and the CI guard can never disagree about them:
//
//   1. WHICH FILES CHANGED — in a commit range (CI) or against a merge-base including uncommitted
//      work (the local gates).
//   2. WHICH OF THOSE ARE SUBSTANTIVE — `pnpm run version-packages` runs version-sync, which runs
//      registry:build, which re-stamps `// @vegastack <name>@<version> sha256-<sha>` into EVERY
//      component source and docs copy-in: 1082 files on a 538-item registry. Those paths are
//      legitimately component sources, so a filename-level filter CANNOT tell that one-line comment
//      apart from a real edit — it has to read the diff body. Without this, every version bump would
//      trigger a full 96-route sweep that cannot possibly have moved anything.
//   3. WHAT THE CONTENT HASH OF THE TREE UNDER TEST IS — the anchor the gate receipt binds to.
//
// The provenance subtraction was written twice before as workflow shell and was wrong in both
// directions on 2026-07-25 (first reporting visual for a pure version bump, then reporting
// not-visual for a real component change while exiting 0 — a fail-open with a green log). It lives
// here, in one place, with tooling/verify-classify-change.mjs proving both directions.

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

/** The provenance header registry:build stamps into every component source and docs copy-in. */
export const PROVENANCE_HEADER = /^[+-]\/\/ @vegastack [a-z0-9-]+@[0-9]/;

/**
 * Paths excluded from the receipt's content hash. `.gates/` holds the receipt itself, so including
 * it would make the hash self-referential: writing the receipt would invalidate it, and committing
 * it would invalidate it again.
 */
export const HASH_EXCLUDED = /^\.gates\//;

export function git(args, { allowFailure = false } = {}) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.status !== 0) {
    if (allowFailure) return null;
    throw new Error(
      `git ${args.join(" ")} failed (${result.status}):\n${result.stderr?.trim()}`,
    );
  }
  return result.stdout;
}

export function resolveCommit(ref) {
  return (
    git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], {
      allowFailure: true,
    })?.trim() ?? null
  );
}

/** origin/main when it exists, else main. The base every local gate diffs against. */
export function defaultBaseRef() {
  return resolveCommit("origin/main") ? "origin/main" : "main";
}

/**
 * The merge-base of two refs, or null. Diffing a branch against the TIP of main would attribute
 * main's own commits to the branch; the merge-base is what "my change" means.
 */
export function mergeBase(a, b) {
  return git(["merge-base", a, b], { allowFailure: true })?.trim() ?? null;
}

const splitLines = (output) => (output ?? "").split("\n").filter(Boolean);

/** Files changed between two commits. */
export function changedFilesInRange(before, after) {
  return splitLines(git(["diff", "--name-only", before, after])).filter(
    (path) => !HASH_EXCLUDED.test(path),
  );
}

/** Untracked-but-not-ignored paths. `git diff` cannot see these, which matters below. */
export function untrackedFiles() {
  return splitLines(git(["ls-files", "--others", "--exclude-standard"])).filter(
    (path) => !HASH_EXCLUDED.test(path),
  );
}

/**
 * Files changed between `base` and the WORKING TREE, including untracked-but-not-ignored files.
 * This is what the local gates need: at pre-push time some edits may not be committed yet, and the
 * question is what the current content does, not what the last commit did.
 */
export function changedFilesInWorkingTree(base) {
  return [
    ...splitLines(git(["diff", "--name-only", base])).filter(
      (path) => !HASH_EXCLUDED.test(path),
    ),
    ...untrackedFiles(),
  ];
}

/**
 * Drop files whose entire diff is provenance re-stamping.
 *
 * `--no-renames` matters: with rename detection a moved component emits `rename from/to` and NO +/-
 * body lines, so a body-only filter would see nothing and wave it through. Forcing delete+add makes
 * a rename look like what it is. Binary files never emit body lines either, so they are matched
 * explicitly. Mode-only changes are deliberately NOT substantive — chmod cannot move a pixel.
 *
 * `after === null` diffs against the working tree.
 */
export function dropProvenanceOnly(files, { before, after = null }) {
  if (files.length === 0) return [];

  // An UNTRACKED file has no diff against `before`, so the body filter below sees nothing for it and
  // would drop it as non-substantive. A brand-new component source is the most substantive change
  // there is. Exempt them explicitly — this was a fail-open in the first version of this function,
  // and then a second time when the final filter was applied to the wrong list.
  const untracked = after === null ? new Set(untrackedFiles()) : new Set();
  const kept = new Set(files.filter((file) => untracked.has(file)));
  const diffable = files.filter((file) => !untracked.has(file));

  // One git process per batch rather than per file: 1082 spawns on a version bump is minutes.
  const BATCH = 200;
  for (let index = 0; index < diffable.length; index += BATCH) {
    const args = ["diff", "-U0", "--no-renames", before];
    if (after) args.push(after);
    args.push("--", ...diffable.slice(index, index + BATCH));
    for (const [file, body] of splitDiffByFile(git(args)))
      if (body.some((line) => isSubstantiveLine(line))) kept.add(file);
  }
  // Filter the ORIGINAL input so order is preserved and duplicates collapse.
  return files.filter((file) => kept.has(file));
}

/** Exported for tooling/verify-classify-change.mjs — the line-level rule is the whole subtraction. */
export function isSubstantiveLine(line) {
  if (line.startsWith("Binary files ")) return true;
  if (!/^[+-]/.test(line)) return false;
  if (line.startsWith("+++") || line.startsWith("---")) return false;
  return !PROVENANCE_HEADER.test(line);
}

/**
 * Split a unified diff into `[path, bodyLines]` pairs. `diff --git a/x b/x` is the record separator;
 * the `b/` side is used so an added file is attributed to its new path.
 */
export function splitDiffByFile(diff) {
  const entries = [];
  let current = null;
  for (const line of (diff ?? "").split("\n")) {
    const header = /^diff --git a\/(.*) b\/(.*)$/.exec(line);
    if (header) {
      current = [header[2], []];
      entries.push(current);
      continue;
    }
    if (current) current[1].push(line);
  }
  return entries;
}

// ── the version-bump exemption ────────────────────────────────────────────────────────────────────
//
// WHY THIS EXISTS
//   A gate receipt is bound to a tree hash. `changeset version` + `version-sync` move that hash —
//   they rewrite package versions, package CHANGELOGs, delete the changesets, and re-stamp provenance
//   headers into 1082 files — while changing no code a browser gate could observe. Measured on the
//   real `Version Packages (#1)` commit: tree 77a346c0 → 1b5796df.
//
//   So a machine-generated Version PR would fail `receipt-guard`, blocking every npm publish, and
//   nobody can fix it by re-running the gates: that branch is authored by a bot, and the browser
//   lanes cannot run in CI at all. `tooling/gate-receipt-carry.mjs` therefore carries the receipt
//   forward, and this predicate is what makes that carry CHECKABLE rather than a blanket exemption —
//   the guard re-derives it from git and rejects the receipt if the diff contains anything real.
//
// WHAT COUNTS, LINE BY LINE — a path allowlist alone would let a dependency change ride along inside
// package.json, so each allowed path also constrains the lines that may differ.

/**
 * The three shapes a version actually takes in these files:
 *   `"version": "0.3.0"`                    — a package manifest field
 *   `"@vegastack/design": "^0.2.0"`         — a workspace-sibling dependency changesets rewrites
 *   `"@vegastack/design@^0.2.0",`           — a registry item's npm dependency, an ARRAY ENTRY
 * The third was missed at first, and it is the one `version-sync` rewrites 630 times.
 */
const VERSION_FIELD_LINE =
  /^[+-]\s*(?:"(?:version|@vegastack\/[a-z0-9-]+)":\s*"[~^]?[0-9]|"@vegastack\/[a-z0-9-]+@[~^]?[0-9][^"]*",?\s*$)/;
/**
 * Built registry items are exempt WHOLESALE, and that is an argument rather than a shortcut.
 *
 * `apps/docs/public/r/*.json` embeds each component's entire source in a single `"content"` string,
 * so re-stamping one provenance header rewrites the whole line — a line-level rule cannot read it.
 * Policing it here would also duplicate a guarantee that already exists and is stronger: CI's
 * `quality-gate` runs `pnpm registry:build` on this very commit and fails if the tree is not clean
 * afterwards. So these files are re-derived and diffed by execution, not trusted from a diff.
 */
const GENERATED_REGISTRY_OUTPUT = /^apps\/docs\/public\/r\/.+\.json$/;

/**
 * `pnpm design:derived` output, exempt on the SAME argument as the registry output above: CI
 * re-executes `design:derived:check` (inside `pnpm lint`) on this very commit and fails on any drift.
 * Re-derivation is a stronger guarantee than reading a diff.
 *
 * They enter a version bump because version-sync rewrites the npm ranges in
 * `component-contracts.json`, which moves its SHA-256, which is stamped into every surface below.
 */
const CONTRACT_DERIVED_OUTPUT = [
  /^packages\/ui\/component-contracts\.json$/,
  /^packages\/ui\/contract-smoke-tests\.generated\.json$/,
  /^apps\/docs\/vrt\/contract-routes\.generated\.ts$/,
  /^apps\/docs\/lib\/home-component-catalog\.generated\.ts$/,
  /^apps\/docs\/components\/animated-icon-gallery\.generated\.tsx$/,
  /^docs\/ledger\/component-matrix\.md$/,
  /^docs\/research\/design-md-audit\//,
];

/**
 * AGENTS.md and README.md carry only a GENERATED REGION, so they are not exempt wholesale — only the
 * lines that region can move. Anything else in those files is prose a release must not touch.
 */
const CONTRACT_SHA_LINE =
  /^[+-].*(Contract SHA-256: `[a-f0-9]{64}`|\*\*Registry items: \d+\*\*|\*\*\d+ components\*\*)/;

const isBodyLine = (line) =>
  /^[+-]/.test(line) && !line.startsWith("+++") && !line.startsWith("---");

/**
 * Is every difference between two revisions pure version churn?
 *
 * `before` must be a COMMIT, not a tree hash. That is not a style preference — it is the fix for a
 * real failure: `workingTreeContentHash()` builds its tree through a throwaway index, so the tree
 * object it names is DANGLING. It exists only in the repository that computed it and is never pushed,
 * because git only transfers objects reachable from a ref. A guard on a CI runner asked to diff such a
 * tree dies with `fatal: bad object …` — which is exactly how release run 30168750521 failed. A commit
 * is reachable, pushed, and present everywhere.
 *
 * `after` may be another commit, or null to compare against the WORKING TREE (what the carry tool
 * needs, since the bumped tree is not committed yet at that point).
 *
 * Returns `{ ok, offenders, files }`. An offender names the file and the first line that disqualified
 * it, so a rejection is diagnosable rather than a bare no.
 */
export function versionBumpOnly(before, after = null) {
  const files = after
    ? changedFilesInRange(before, after)
    : changedFilesInWorkingTree(before);
  const offenders = [];
  const BATCH = 200;
  for (let index = 0; index < files.length; index += BATCH) {
    const args = ["diff", "-U0", "--no-renames", before];
    if (after) args.push(after);
    args.push("--", ...files.slice(index, index + BATCH));
    const diff = git(args);
    for (const [file, body] of splitDiffByFile(diff)) {
      const lines = body.filter(isBodyLine);
      const offend = (line) => offenders.push({ file, line });

      if (/^\.changeset\/.+\.md$/.test(file)) {
        // Consumed changesets are DELETED. An addition here would be new release intent.
        const added = lines.find((line) => line.startsWith("+"));
        if (added) offend(added);
      } else if (/(^|\/)CHANGELOG\.md$/.test(file)) {
        // Entries are appended. A removal would be rewriting released history.
        const removed = lines.find((line) => line.startsWith("-"));
        if (removed) offend(removed);
      } else if (
        /(^|\/)package\.json$/.test(file) ||
        // The registry manifest carries the stamped design-system version too, and version-sync
        // rewrites it in the same step. Same rule: version fields only, nothing else.
        /^packages\/ui\/registry\.json$/.test(file)
      ) {
        const other = lines.find((line) => !VERSION_FIELD_LINE.test(line));
        if (other) offend(other);
      } else if (GENERATED_REGISTRY_OUTPUT.test(file)) {
        // Exempt by re-execution, not by trust — see GENERATED_REGISTRY_OUTPUT.
      } else if (
        CONTRACT_DERIVED_OUTPUT.some((pattern) => pattern.test(file))
      ) {
        // Likewise — `design:derived:check` re-derives these in CI.
      } else if (/^(AGENTS|README)\.md$/.test(file)) {
        const other = lines.find((line) => !CONTRACT_SHA_LINE.test(line));
        if (other) offend(other);
      } else {
        // Everything else — component sources, docs copy-ins — may differ ONLY by the provenance
        // header registry:build re-stamps. `isSubstantiveLine` already encodes exactly that.
        const real = lines.find((line) => isSubstantiveLine(line));
        if (real) offend(real);
      }
    }
  }
  return { ok: offenders.length === 0, offenders, files: files.length };
}

/**
 * A canonical git tree hash of the WORKING TREE — tracked modifications and untracked-not-ignored
 * files included, `.gates/` excluded.
 *
 * Why the working tree rather than a commit: the gates run against the working tree, so this is the
 * only hash that describes what was actually tested. Because `.gates/` is excluded, committing the
 * receipt afterwards leaves the hash unchanged — which is what lets ONE commit carry both a change
 * and its receipt while the receipt still describes the pushed content exactly.
 *
 * Computed with a THROWAWAY INDEX (`GIT_INDEX_FILE`) and git's own `write-tree`, not by hashing
 * files here. That is not a stylistic choice — it is correctness:
 *
 *   - symlinks. `.claude/skills/*` and `.agents/skills/*` are symlinks to DIRECTORIES. A naive
 *     `git hash-object <path>` aborts on them (`fatal: Unable to hash .agents/skills/component`),
 *     which is exactly what the first implementation here did. git stores a symlink as a blob
 *     holding its target and gets this right for free.
 *   - file modes. A tree records them, so `chmod -x .husky/pre-push` moves the hash. A content-only
 *     hash would not have noticed, and hook executability is load-bearing here.
 *   - deletions and .gitignore. Handled by `git add -A` rather than by hand.
 *
 * The real index is never touched, so this is safe to call at any point in a hook.
 */
export function workingTreeContentHash() {
  const index = join(mkdtempSync(join(tmpdir(), "vsk-gate-index-")), "index");
  const withIndex = (args) => {
    const result = spawnSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, GIT_INDEX_FILE: index },
      maxBuffer: 256 * 1024 * 1024,
    });
    if (result.status !== 0)
      throw new Error(
        `git ${args.join(" ")} failed (${result.status}):\n${result.stderr?.trim()}`,
      );
    return result.stdout;
  };
  try {
    // Seed from HEAD so a repository with no commits still has a base, then stage everything the
    // working tree currently holds.
    if (resolveCommit("HEAD")) withIndex(["read-tree", "HEAD"]);
    withIndex(["add", "-A"]);
    // The receipt lives under .gates/ and must not be part of the hash it is bound to.
    withIndex(["rm", "--cached", "-r", "-q", "--ignore-unmatch", ".gates"]);
    const tree = withIndex(["write-tree"]).trim();
    const files = splitLines(withIndex(["ls-files"])).length;
    if (files === 0) throw new Error("refusing to hash an empty file set");
    return { hash: `tree-${tree}`, files };
  } finally {
    rmSync(dirname(index), { recursive: true, force: true });
  }
}

/** Tracked paths that differ from HEAD, ignoring `.gates/`. Empty means the tree is clean. */
export function dirtyPaths() {
  return splitLines(git(["status", "--porcelain", "--untracked-files=all"]))
    .map((line) => line.slice(3).trim())
    .map((path) => (path.includes(" -> ") ? path.split(" -> ")[1] : path))
    .filter((path) => !HASH_EXCLUDED.test(path));
}

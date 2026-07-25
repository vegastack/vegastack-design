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

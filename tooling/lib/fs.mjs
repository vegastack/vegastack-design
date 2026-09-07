// The repository root and the three filesystem helpers every tooling script used to re-derive.
//
// WHY THIS FILE EXISTS
//   The 2026-09-07 audit (06-tooling-gates.md TG-07) counted 27 independent derivations of the
//   repository root in eight spellings, seven private directory walkers, and one walker that
//   swallowed an unreadable root and reported the tree clean. Plumbing that is written many times is
//   plumbing that is wrong in one of them — the swallowed-error walker was exactly that. One
//   definition each, here, and the walker fails closed by construction: an unreadable root THROWS.
//
// ROOT
//   Derived from this file's own location (`<repo>/tooling/lib/fs.mjs`), never from `process.cwd()`.
//   A script must find the same repository whether it is run from the root, from `apps/docs` (the
//   docs lint chain does that), from a git hook, or from a Claude Code hook inside a worktree.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

/** A path relative to ROOT, always with forward slashes, for reports and comparisons. */
export function relativeToRoot(path) {
  return relative(ROOT, path).split(sep).join("/");
}

/**
 * Every file under `dir`, recursively, as sorted absolute paths.
 *
 * FAILS CLOSED: an unreadable or missing root throws instead of returning `[]`. A gate that walks a
 * directory which is not there must report that, not "clean" — `content-lint.mjs` did the latter
 * and would have passed on a moved `skills/` tree.
 *
 *   include(relativePath, dirent)  keep a file (default: every file)
 *   prune(relativePath, dirent)    skip a directory and everything under it (default: nothing)
 *
 * Both callbacks receive the path relative to `dir` with forward slashes. Symlinks are reported as
 * what they are (`dirent.isSymbolicLink()`), never followed — the `.claude/skills` and
 * `.agents/skills` trees are symlinks to directories, and following them would double-count.
 */
export function walk(dir, { include = () => true, prune = () => false } = {}) {
  // Explicit recursion rather than `readdirSync({ recursive: true })`: Node's recursive reader
  // FOLLOWS a symlinked directory, which this repository's own fixture (tooling/verify-fs-lib.mjs)
  // caught on the first run — `link-to-b/nested/c.md` appeared next to `b/nested/c.md`.
  const out = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = join(current, entry.name);
      const rel = relative(dir, absolute).split(sep).join("/");
      if (entry.isDirectory()) {
        if (!prune(rel, entry)) visit(absolute);
        continue;
      }
      if (!entry.isFile() && !entry.isSymbolicLink()) continue;
      if (include(rel, entry)) out.push(absolute);
    }
  };
  visit(dir);
  return out.sort();
}

/** Parse a JSON file, naming the file in the error when it is missing or malformed. */
export function readJson(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(`cannot read ${path}: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${error.message}`);
  }
}

/**
 * Print `<prefix>: <message>` to stderr and exit. The default code is 2 — the ladder-wide meaning of
 * "could not run" — and a caller that means "ran and failed" passes 1 explicitly.
 */
export function fatal(prefix, message, { code = 2 } = {}) {
  console.error(`${prefix}: ${message}`);
  process.exit(code);
}

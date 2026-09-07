#!/usr/bin/env node
// Prove tooling/lib/fs.mjs fails closed, and that content-lint inherits that.
//
// WHY THIS EXISTS
//   Every directory walker in tooling/ now goes through one `walk()`. That is only an improvement if
//   the one walker refuses to report "nothing here" for a root that is not there — the previous
//   content-lint walker returned `[]` on an unreadable root, so a moved `skills/` tree read as clean
//   (audit 2026-09-07, TG-07). A shared helper with the same hole would spread that fail-open to
//   every caller at once. So the helper's contract is asserted here, and content-lint is executed
//   against a synthetic repository with no docs tree to prove it exits 2 rather than 0.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ROOT, readJson, relativeToRoot, walk } from "./lib/fs.mjs";

let checks = 0;
const scratch = mkdtempSync(join(tmpdir(), "verify-fs-lib-"));

try {
  // ── walk ───────────────────────────────────────────────────────────────────────────────────────

  assert.throws(
    () => walk(join(scratch, "does-not-exist")),
    /ENOENT/,
    "walk() must THROW on a missing root — returning [] is the fail-open this file exists to prevent",
  );
  checks++;

  const tree = join(scratch, "tree");
  mkdirSync(join(tree, "b/nested"), { recursive: true });
  mkdirSync(join(tree, "skipped/deep"), { recursive: true });
  writeFileSync(join(tree, "z.md"), "");
  writeFileSync(join(tree, "a.txt"), "");
  writeFileSync(join(tree, "b/nested/c.md"), "");
  writeFileSync(join(tree, "skipped/deep/d.md"), "");
  symlinkSync(join(tree, "b"), join(tree, "link-to-b"));

  const all = walk(tree).map((path) => path.slice(tree.length + 1));
  assert.deepEqual(
    all,
    ["a.txt", "b/nested/c.md", "link-to-b", "skipped/deep/d.md", "z.md"],
    "walk() returns every file, sorted, with a symlink reported once and never followed",
  );
  const md = walk(tree, {
    include: (relative) => relative.endsWith(".md"),
    prune: (relative) => relative === "skipped",
  }).map((path) => path.slice(tree.length + 1));
  assert.deepEqual(
    md,
    ["b/nested/c.md", "z.md"],
    "include filters files and prune removes a whole subtree",
  );
  checks += 2;

  // ── readJson ───────────────────────────────────────────────────────────────────────────────────

  writeFileSync(join(scratch, "ok.json"), '{"a":1}');
  writeFileSync(join(scratch, "bad.json"), "{not json");
  assert.deepEqual(readJson(join(scratch, "ok.json")), { a: 1 });
  assert.throws(
    () => readJson(join(scratch, "bad.json")),
    /bad\.json is not valid JSON/,
    "readJson names the malformed file",
  );
  assert.throws(
    () => readJson(join(scratch, "missing.json")),
    /cannot read .*missing\.json/,
    "readJson names the missing file",
  );
  checks += 3;

  // ── ROOT ───────────────────────────────────────────────────────────────────────────────────────

  assert.equal(
    relativeToRoot(join(ROOT, "tooling/lib/fs.mjs")),
    "tooling/lib/fs.mjs",
    "ROOT resolves to the repository root, not the caller's cwd",
  );
  checks++;

  // ── content-lint inherits the fail-closed root ─────────────────────────────────────────────────
  //
  // A synthetic repository holding only tooling/: content-lint's first walk (apps/docs/content/docs)
  // finds nothing to read. The old walker returned [] here and the lint went on to report clean.
  const repo = join(scratch, "repo");
  mkdirSync(repo, { recursive: true });
  cpSync(join(ROOT, "tooling"), join(repo, "tooling"), { recursive: true });
  const lint = spawnSync("node", [join(repo, "tooling/content-lint.mjs")], {
    cwd: repo,
    encoding: "utf8",
  });
  assert.equal(
    lint.status,
    2,
    `content-lint must exit 2 on a missing docs root, got ${lint.status}:\n${lint.stdout}${lint.stderr}`,
  );
  assert.match(
    lint.stderr,
    /cannot read root 'apps\/docs\/content\/docs'/,
    "content-lint must name the root it could not read",
  );
  assert.doesNotMatch(
    lint.stdout,
    /content-lint: clean/,
    "content-lint must not report clean over a root that does not exist",
  );
  checks += 3;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

console.log(
  `✓ fs-lib: ${checks} assertions — walk() throws on a missing root, sorts, prunes, and never follows ` +
    `a symlink; readJson names its file; content-lint exits 2 instead of reporting clean over a missing tree`,
);

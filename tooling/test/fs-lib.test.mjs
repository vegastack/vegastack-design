// Prove tooling/lib/fs.mjs fails closed, and that content-lint inherits that.
//
// WHY THIS EXISTS
//   Every directory walker in tooling/ now goes through one `walk()`. That is only an improvement if
//   the one walker refuses to report "nothing here" for a root that is not there — the previous
//   content-lint walker returned `[]` on an unreadable root, so a moved `skills/` tree read as clean
//   (audit 2026-09-07, TG-07). A shared helper with the same hole would spread that fail-open to
//   every caller at once. So the helper's contract is asserted here, and content-lint is executed
//   against a synthetic repository with no docs tree to prove it exits 2 rather than 0.

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
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROOT, readJson, relativeToRoot, walk } from "../lib/fs.mjs";

let scratch;
beforeAll(() => {
  scratch = mkdtempSync(join(tmpdir(), "fs-lib-"));
});
afterAll(() => {
  rmSync(scratch, { recursive: true, force: true });
});

describe("walk", () => {
  it("THROWS on a missing root — returning [] is the fail-open this file exists to prevent", () => {
    expect(() => walk(join(scratch, "does-not-exist"))).toThrow(/ENOENT/);
  });

  it("returns every file sorted, reports a symlink once, and never follows one", () => {
    const tree = join(scratch, "tree");
    mkdirSync(join(tree, "b/nested"), { recursive: true });
    mkdirSync(join(tree, "skipped/deep"), { recursive: true });
    writeFileSync(join(tree, "z.md"), "");
    writeFileSync(join(tree, "a.txt"), "");
    writeFileSync(join(tree, "b/nested/c.md"), "");
    writeFileSync(join(tree, "skipped/deep/d.md"), "");
    symlinkSync(join(tree, "b"), join(tree, "link-to-b"));

    expect(walk(tree).map((path) => path.slice(tree.length + 1))).toEqual([
      "a.txt",
      "b/nested/c.md",
      "link-to-b",
      "skipped/deep/d.md",
      "z.md",
    ]);
  });

  it("filters with include and removes a whole subtree with prune", () => {
    const tree = join(scratch, "tree");
    const md = walk(tree, {
      include: (relative) => relative.endsWith(".md"),
      prune: (relative) => relative === "skipped",
    }).map((path) => path.slice(tree.length + 1));
    expect(md).toEqual(["b/nested/c.md", "z.md"]);
  });
});

describe("readJson", () => {
  it("parses, and names the file it could not read or parse", () => {
    writeFileSync(join(scratch, "ok.json"), '{"a":1}');
    writeFileSync(join(scratch, "bad.json"), "{not json");
    expect(readJson(join(scratch, "ok.json"))).toEqual({ a: 1 });
    expect(() => readJson(join(scratch, "bad.json"))).toThrow(
      /bad\.json is not valid JSON/,
    );
    expect(() => readJson(join(scratch, "missing.json"))).toThrow(
      /cannot read .*missing\.json/,
    );
  });
});

describe("ROOT", () => {
  it("resolves to the repository root, not the caller's cwd", () => {
    expect(relativeToRoot(join(ROOT, "tooling/lib/fs.mjs"))).toBe(
      "tooling/lib/fs.mjs",
    );
  });
});

describe("content-lint inherits the fail-closed root", () => {
  // A synthetic repository holding only tooling/: content-lint's first walk
  // (apps/docs/content/docs) finds nothing to read. The old walker returned [] here and the lint
  // went on to report clean.
  it("exits 2 and names the root, instead of reporting clean", () => {
    const repo = join(scratch, "repo");
    mkdirSync(repo, { recursive: true });
    cpSync(join(ROOT, "tooling"), join(repo, "tooling"), { recursive: true });
    const lint = spawnSync("node", [join(repo, "tooling/content-lint.mjs")], {
      cwd: repo,
      encoding: "utf8",
    });
    expect(lint.status).toBe(2);
    expect(lint.stderr).toMatch(/cannot read root 'apps\/docs\/content\/docs'/);
    expect(lint.stdout).not.toMatch(/content-lint: clean/);
  });
});

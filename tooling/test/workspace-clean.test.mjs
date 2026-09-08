// Proof that tooling/workspace-clean.mjs removes exactly what it says and nothing else.
//
// A cleanup script is the one piece of tooling whose failure mode is destroying work rather than
// blocking it, so the three properties asserted here are the ones that matter: a dry run touches
// nothing, an after-run removes the listed paths and leaves everything else, and `--weekly` REFUSES
// a worktree with uncommitted changes instead of deleting it.
//
// Every case runs against a throwaway fixture via `--root`, never against this repository.

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { normalizeBuildName } from "../workspace-clean.mjs";

const SCRIPT = fileURLToPath(
  new URL("../workspace-clean.mjs", import.meta.url),
);

/** Paths the script must remove in `--after-run`, relative to the root. */
const AFTER_RUN = [
  "apps/docs/test-results",
  "apps/docs/playwright-report",
  "packages/ui/.vitest",
  "packages/ui/test/__screenshots__",
  "packages/ui/registry/ui/.vitest-attachments",
];

/** Paths that must SURVIVE every mode. */
const SURVIVORS = [
  "packages/ui/registry/ui/button.tsx",
  "node_modules/left-pad/index.js",
  "apps/docs/content/docs/index.mdx",
];

let root;

function touch(path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, "x");
}

function run(args) {
  return execFileSync("node", [SCRIPT, "--root", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function git(cwd, args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@example.com",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@example.com",
    },
  }).trim();
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "workspace-clean-"));
  // A real pnpm lockfile line, because --weekly reads the pinned playwright version from it.
  writeFileSync(
    join(root, "pnpm-lock.yaml"),
    "packages:\n\n  playwright@1.61.0:\n    x: y\n",
  );
  for (const rel of [...AFTER_RUN, ...SURVIVORS])
    touch(join(root, rel, "file.txt"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("--dry-run", () => {
  it("removes nothing and reports the bytes it would reclaim", () => {
    const output = run(["--dry-run"]);
    for (const rel of [...AFTER_RUN, ...SURVIVORS])
      expect(existsSync(join(root, rel)), `${rel} must survive a dry run`).toBe(
        true,
      );
    expect(output).toMatch(/would remove/);
    expect(output).toMatch(/\d+(\.\d+)? ?(B|KB|MB|GB)/);
  });

  it("is the default mode when no flag is passed", () => {
    run([]);
    expect(existsSync(join(root, "apps/docs/test-results"))).toBe(true);
  });
});

describe("--after-run", () => {
  it("removes exactly the per-run artifact paths", () => {
    run(["--after-run"]);
    for (const rel of AFTER_RUN)
      expect(existsSync(join(root, rel)), `${rel} must be removed`).toBe(false);
  });

  it("leaves source, node_modules, and content untouched", () => {
    run(["--after-run"]);
    for (const rel of SURVIVORS)
      expect(existsSync(join(root, rel)), `${rel} must survive`).toBe(true);
  });

  it("is a no-op, exiting 0, when there is nothing to remove", () => {
    run(["--after-run"]);
    const second = run(["--after-run"]);
    expect(second).toMatch(/0 path\(s\)/);
  });

  it("never removes a .vitest-attachments directory inside node_modules", () => {
    touch(join(root, "node_modules/pkg/.vitest-attachments/x.png"));
    run(["--after-run"]);
    expect(existsSync(join(root, "node_modules/pkg/.vitest-attachments"))).toBe(
      true,
    );
  });
});

describe("--weekly", () => {
  /**
   * A fixture repo with one agent worktree.
   *
   * Only `README.md` is committed: the per-run artifact paths must stay UNTRACKED, exactly as they
   * are in the real repository, or `workspace-clean` refuses them for the right reason (git tracks
   * this path) and the after-run assertions below would pass for the wrong one.
   */
  function withWorktree({ dirty = false, ahead = false } = {}) {
    git(root, ["init", "-q", "-b", "main"]);
    writeFileSync(join(root, "README.md"), "seed\n");
    git(root, ["add", "README.md"]);
    git(root, ["commit", "-qm", "seed"]);
    // A local `origin/main` so `--merged origin/main` resolves without a network remote.
    git(root, ["update-ref", "refs/remotes/origin/main", "HEAD"]);

    const worktree = join(root, ".claude/worktrees/agent-x");
    git(root, ["worktree", "add", "-q", "-b", "feature/x", worktree]);
    if (ahead) {
      writeFileSync(join(worktree, "work.txt"), "landed nowhere\n");
      git(worktree, ["add", "work.txt"]);
      git(worktree, ["commit", "-qm", "unmerged work"]);
    }
    if (dirty)
      writeFileSync(join(worktree, "scratch.txt"), "uncommitted work\n");
    return worktree;
  }

  it("refuses a dirty worktree, names it, and leaves it on disk", () => {
    const worktree = withWorktree({ dirty: true });
    const output = run(["--weekly"]);
    expect(existsSync(worktree), "a dirty worktree must never be removed").toBe(
      true,
    );
    expect(existsSync(join(worktree, "scratch.txt"))).toBe(true);
    expect(output).toMatch(/refused/);
    expect(output).toMatch(/DIRTY/);
  });

  it("refuses a worktree that is dirty AND unmerged — dirtiness is reported first", () => {
    const worktree = withWorktree({ dirty: true, ahead: true });
    const output = run(["--weekly"]);
    expect(existsSync(worktree)).toBe(true);
    expect(output).toMatch(/DIRTY/);
  });

  it("refuses a clean worktree whose branch is not merged into origin/main", () => {
    const worktree = withWorktree({ ahead: true });
    const output = run(["--weekly"]);
    expect(existsSync(worktree)).toBe(true);
    expect(output).toMatch(/not merged into origin\/main/);
  });

  it("removes a worktree that is both clean and merged", () => {
    const worktree = withWorktree({});
    run(["--weekly"]);
    expect(existsSync(worktree)).toBe(false);
  });

  it("still performs the after-run removals", () => {
    withWorktree({ dirty: true });
    run(["--weekly"]);
    for (const rel of AFTER_RUN)
      expect(existsSync(join(root, rel)), `${rel} must be removed`).toBe(false);
  });
});

describe("safety", () => {
  it("refuses an unknown argument rather than guessing", () => {
    expect(() => run(["--nuke"])).toThrow();
  });

  // A real bug, caught while building this: `browsers.json` names the headless shell
  // `chromium-headless-shell`, the installed directory is `chromium_headless_shell-1228`, and an
  // exact-name comparison therefore reported the browser the suite is CURRENTLY using as stale.
  // `--weekly` would have deleted it and the next run would have failed on a missing browser.
  it("treats a dash-named and an underscore-named build as the same build", () => {
    expect(normalizeBuildName("chromium_headless_shell")).toBe(
      normalizeBuildName("chromium-headless-shell"),
    );
    expect(normalizeBuildName("chromium")).toBe("chromium");
  });
});

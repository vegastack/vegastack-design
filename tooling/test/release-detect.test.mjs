// `tooling/release-detect.mjs` decides what a push to `main` DOES: open a Version PR, publish, or
// neither. `release.yml`'s `changes` job calls it and gates `version-pr` and `publish` on its two
// outputs, so a wrong answer here is a release that silently does nothing — or one that runs the
// publish path when it should not.
//
// This logic lived in `release.yml` as shell twice, and was wrong in both directions on 2026-07-25,
// because a workflow step cannot be exercised until it has already run on `main`. It is a script so
// that it can be executed here instead.

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ROOT } from "../lib/fs.mjs";

const SCRIPT = join(ROOT, "tooling/release-detect.mjs");

function readOutputs(file) {
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split("=")),
  );
}

const scratches = [];
afterEach(() => {
  for (const dir of scratches.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

/**
 * A git repository whose only tracked content is what the caller writes. The script derives ROOT
 * from its own location, not cwd, so the fixture must be a COPY of the repository layout it reads:
 * `.changeset/` and, when a range is asked for, real commits.
 */
function fixture({ changesets = [], commits = [] } = {}) {
  const repo = mkdtempSync(join(tmpdir(), "release-detect-"));
  scratches.push(repo);
  mkdirSync(join(repo, "tooling/lib"), { recursive: true });
  mkdirSync(join(repo, ".changeset"), { recursive: true });
  writeFileSync(join(repo, ".changeset/README.md"), "# changesets\n");
  for (const [index, body] of changesets.entries())
    writeFileSync(join(repo, `.changeset/pending-${index}.md`), body);

  // The script must run from INSIDE the fixture, so copy it and the one lib it imports.
  copyFileSync(SCRIPT, join(repo, "tooling/release-detect.mjs"));
  copyFileSync(
    join(ROOT, "tooling/lib/fs.mjs"),
    join(repo, "tooling/lib/fs.mjs"),
  );

  if (commits.length > 0) {
    const git = (...args) =>
      spawnSync("git", args, { cwd: repo, encoding: "utf8" });
    git("init", "-q", "-b", "main");
    git("config", "user.email", "t@example.com");
    git("config", "user.name", "t");
    for (const files of commits) {
      for (const [path, content] of Object.entries(files)) {
        // `null` DELETES the path in that commit — which is what `changeset version` does to
        // `.changeset/*.md`, and the only way to build a ref whose tree differs from the disk.
        if (content === null) {
          rmSync(join(repo, path), { force: true });
          continue;
        }
        mkdirSync(join(repo, path, ".."), { recursive: true });
        writeFileSync(join(repo, path), content);
      }
      git("add", "-A");
      git("commit", "-qm", "step");
    }
  }
  return repo;
}

function runIn(repo, args = []) {
  const outputFile = join(repo, "gh-output");
  writeFileSync(outputFile, "");
  const result = spawnSync(
    "node",
    [join(repo, "tooling/release-detect.mjs"), ...args],
    {
      cwd: repo,
      encoding: "utf8",
      env: { ...process.env, GITHUB_OUTPUT: outputFile },
    },
  );
  return { ...result, outputs: readOutputs(outputFile) };
}

describe("release-detect", () => {
  it("reports no release path when nothing is pending and nothing changed", () => {
    const repo = fixture();
    const { status, outputs } = runIn(repo);
    expect(status).toBe(0);
    expect(outputs).toEqual({ has_changesets: "false", publish: "false" });
  });

  it("a pending changeset opens the Version PR path AND reaches the release path", () => {
    const repo = fixture({
      changesets: ['---\n"@vegastack/design": patch\n---\n\nfix\n'],
    });
    const { outputs } = runIn(repo);
    expect(outputs).toEqual({ has_changesets: "true", publish: "true" });
  });

  it("README.md in .changeset is not a changeset", () => {
    const repo = fixture();
    const { outputs } = runIn(repo);
    expect(outputs.has_changesets).toBe("false");
  });

  it("a packages/ change in the range reaches the release path with no changeset", () => {
    const repo = fixture({
      commits: [
        { "docs/a.md": "one\n" },
        { "packages/design/package.json": '{"version":"1.0.0"}\n' },
      ],
    });
    const { outputs } = runIn(repo, ["--before", "HEAD~1", "--after", "HEAD"]);
    expect(outputs).toEqual({ has_changesets: "false", publish: "true" });
  });

  it("a docs-only range does NOT reach the release path", () => {
    const repo = fixture({
      commits: [{ "docs/a.md": "one\n" }, { "docs/b.md": "two\n" }],
    });
    const { outputs } = runIn(repo, ["--before", "HEAD~1", "--after", "HEAD"]);
    expect(outputs).toEqual({ has_changesets: "false", publish: "false" });
  });

  /**
   * THE VERSION-PR CASE, and the reason `--after` governs the changeset read at all. `changeset
   * version` consumes `.changeset/*.md`, so the commit under test carries none while the runner's
   * working tree may still hold them. Reading the tree answers a different question and flips
   * `has_changesets` — which is exactly the wrong answer for the push that should PUBLISH.
   */
  const CHANGESET = '---\n"@vegastack/design": patch\n---\n\nfix\n';

  it("reads .changeset from --after, not from the working tree", () => {
    const repo = fixture({
      commits: [
        { ".changeset/pending-0.md": CHANGESET },
        {
          ".changeset/pending-0.md": null,
          "packages/design/CHANGELOG.md": "# 1.0.1\n",
        },
      ],
    });
    // The tree disagrees with the ref, the way a Version-PR runner's tree does.
    writeFileSync(join(repo, ".changeset/pending-0.md"), CHANGESET);

    const { outputs } = runIn(repo, ["--before", "HEAD~1", "--after", "HEAD"]);
    expect(outputs.has_changesets).toBe("false");
    // …and the range still reaches the release path, because `packages/` changed.
    expect(outputs.publish).toBe("true");
  });

  it("sees a changeset that exists at --after but not in the working tree", () => {
    const repo = fixture({
      commits: [
        { "docs/a.md": "one\n" },
        { ".changeset/pending-0.md": CHANGESET },
      ],
    });
    rmSync(join(repo, ".changeset/pending-0.md"), { force: true });

    const { outputs } = runIn(repo, ["--before", "HEAD~1", "--after", "HEAD"]);
    expect(outputs).toEqual({ has_changesets: "true", publish: "true" });
  });

  it("falls back to the working tree when no ref is given", () => {
    const repo = fixture({
      commits: [
        { ".changeset/pending-0.md": CHANGESET },
        { ".changeset/pending-0.md": null },
      ],
    });
    writeFileSync(join(repo, ".changeset/pending-0.md"), CHANGESET);

    expect(runIn(repo).outputs.has_changesets).toBe("true");
  });

  it("rejects an unknown flag rather than silently ignoring it", () => {
    const repo = fixture();
    const { status, stderr } = runIn(repo, ["--all-the-things"]);
    expect(status).toBe(2);
    expect(stderr).toMatch(/unknown argument/);
  });
});

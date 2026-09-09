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
  chmodSync,
  copyFileSync,
  existsSync,
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
  const shims = join(repo, "shim-bin");
  const result = spawnSync(
    "node",
    [join(repo, "tooling/release-detect.mjs"), ...args],
    {
      cwd: repo,
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_OUTPUT: outputFile,
        // A fixture that installed an `npm` shim wins over the real CLI; one that did not is
        // unaffected, so no test reaches the network unless it asked to.
        ...(existsSync(shims) ? { PATH: `${shims}:${process.env.PATH}` } : {}),
      },
    },
  );
  return { ...result, outputs: readOutputs(outputFile) };
}

/**
 * A fake `npm` on PATH, plus the two public manifests `--check-npm` reads.
 *
 * The registry answer is the ONLY thing these tests are about, and it is the one input a unit test
 * must never take from the network: the fail-open bug shipped because the real `npm view` failed for
 * a reason nothing here modelled. `body` is the shell of the shim; `$CALLS` counts invocations so a
 * test can prove the retry, and the shim records its cwd so the "outside the repo" guarantee is
 * checkable rather than asserted in a comment.
 */
function withNpm(repo, body, { versions } = {}) {
  const bin = join(repo, "shim-bin");
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(bin, "npm"),
    `#!/bin/sh
CALLS="${repo}/npm-calls"
printf '%s\\n' "$PWD" >> "$CALLS"
${body}
`,
  );
  chmodSync(join(bin, "npm"), 0o755);

  for (const [directory, [name, version]] of Object.entries(
    versions ?? {
      design: ["@vegastack/design", "1.0.0"],
      "design-tokens": ["@vegastack/design-tokens", "1.0.0"],
    },
  )) {
    mkdirSync(join(repo, "packages", directory), { recursive: true });
    writeFileSync(
      join(repo, `packages/${directory}/package.json`),
      `${JSON.stringify({ name, version }, null, 2)}\n`,
    );
  }
  return repo;
}

const npmCalls = (repo) =>
  existsSync(join(repo, "npm-calls"))
    ? readFileSync(join(repo, "npm-calls"), "utf8").split("\n").filter(Boolean)
    : [];

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

  /**
   * `--check-npm` USED TO FAIL OPEN, and every push to `main` paid for it. `npm view` ran with cwd =
   * the repo root, where `package.json` declares `devEngines.runtime` 24.20.0; npm enforces that
   * field, does not honour pnpm's `onFail: download`, and exits EBADDEVENGINES on any other Node
   * before it reaches the network. The old code read `status !== 0` as "not published", so a live
   * package was reported unpublished and `publish` was forced true — arming the OIDC-capable
   * `publish` job on changeset-free pushes. Observed on the mini in run 34323665258:
   *   publish true — unpublished: @vegastack/design (none) → 0.3.2, @vegastack/design-tokens (none) → 0.2.0
   * with both versions live on npm.
   *
   * So the three registry outcomes are each pinned here, and the one that cannot be answered is
   * pinned hardest: only a genuine E404 may mean "unpublished".
   */
  const NPM_404 = `cat 1>&2 <<'ERR'
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@vegastack%2fthing - Not found
ERR
echo '{"error":{"code":"E404","summary":"Not Found"}}'
exit 1`;

  const NPM_BAD_ENGINES = `cat 1>&2 <<'ERR'
npm error code EBADDEVENGINES
npm error EBADDEVENGINES Invalid semver version "24.20.0" does not match "v25.9.0" for "runtime"
ERR
exit 1`;

  it("a package published AT the manifest version does not reach the release path", () => {
    const repo = withNpm(fixture(), `echo '"1.0.0"'`);
    const { status, outputs } = runIn(repo, ["--check-npm"]);
    expect(status).toBe(0);
    expect(outputs).toEqual({ has_changesets: "false", publish: "false" });
  });

  it("a package published BEHIND the manifest resumes the interrupted release", () => {
    const repo = withNpm(fixture(), `echo '"0.9.0"'`);
    const { status, stdout, outputs } = runIn(repo, ["--check-npm"]);
    expect(status).toBe(0);
    expect(outputs.publish).toBe("true");
    expect(stdout).toContain("@vegastack/design 0.9.0 → 1.0.0");
  });

  it("a genuine 404 — and ONLY a 404 — means unpublished", () => {
    const repo = withNpm(fixture(), NPM_404);
    const { status, stdout, outputs } = runIn(repo, ["--check-npm"]);
    expect(status).toBe(0);
    expect(outputs.publish).toBe("true");
    expect(stdout).toContain("@vegastack/design (none) → 1.0.0");
  });

  it("an engine refusal is UNKNOWN, never 'unpublished', and fails the run", () => {
    const repo = withNpm(fixture(), NPM_BAD_ENGINES);
    const { status, stdout, stderr, outputs } = runIn(repo, ["--check-npm"]);
    // The bug, stated as an assertion: this must not become a publish.
    expect(outputs.publish).toBe("false");
    expect(stdout).not.toContain("unpublished");
    expect(stderr).toMatch(/could not be queried/);
    expect(stderr).toMatch(/EBADDEVENGINES/);
    // Fail-closed AND loud: nothing else could have set publish, so a run that cannot ask the
    // registry is a failure rather than a silent "no release owed".
    expect(status).toBe(1);
  });

  it("a network error is UNKNOWN too, and is retried once before it counts", () => {
    const repo = withNpm(
      fixture(),
      `cat 1>&2 <<'ERR'
npm error code ECONNREFUSED
npm error network request to https://registry.npmjs.org/@vegastack%2fthing failed
ERR
exit 1`,
    );
    const { status, stderr } = runIn(repo, ["--check-npm"]);
    expect(status).toBe(1);
    expect(stderr).toMatch(/ECONNREFUSED/);
    // Two packages, two attempts each — a single blip must not turn a push red.
    expect(npmCalls(repo)).toHaveLength(4);
  });

  it("an unknown that could not have changed the answer does not fail the run", () => {
    const repo = withNpm(
      fixture({
        changesets: ['---\n"@vegastack/design": patch\n---\n\nfix\n'],
      }),
      NPM_BAD_ENGINES,
    );
    const { status, stderr, outputs } = runIn(repo, ["--check-npm"]);
    // A pending changeset already reaches the release path, so the registry was never decisive.
    expect(outputs).toEqual({ has_changesets: "true", publish: "true" });
    expect(stderr).toMatch(/run continues/);
    expect(status).toBe(0);
  });

  it("queries npm from OUTSIDE the repo, where devEngines cannot reach it", () => {
    const repo = withNpm(fixture(), `echo '"1.0.0"'`);
    runIn(repo, ["--check-npm"]);
    // The cwd is what neutralises `devEngines.runtime`; if it ever moves back inside the tree the
    // fail-open bug returns silently, so pin it.
    for (const cwd of npmCalls(repo)) expect(cwd.startsWith(repo)).toBe(false);
  });

  it("does not touch the registry at all without --check-npm", () => {
    const repo = withNpm(fixture(), `exit 1`);
    expect(runIn(repo).status).toBe(0);
    expect(npmCalls(repo)).toHaveLength(0);
  });

  it("rejects an unknown flag rather than silently ignoring it", () => {
    const repo = fixture();
    const { status, stderr } = runIn(repo, ["--all-the-things"]);
    expect(status).toBe(2);
    expect(stderr).toMatch(/unknown argument/);
  });
});

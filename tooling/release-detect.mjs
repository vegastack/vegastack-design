#!/usr/bin/env node
// What will a push to `main` DO — open a Version PR, publish, or neither?
//
// ONE AUTHORITY, DELIBERATELY. This logic used to be shell inside `release.yml`'s `changes` job,
// which meant it could not be exercised until it had already run on `main`, and it was wrong there
// in both directions on 2026-07-25. It lives here, the workflow calls it, and
// `tooling/test/release-detect.test.mjs` exercises both outputs.
//
// The larger `classify-change.mjs` this replaces also answered "which browser gates must the receipt
// carry" — a question that no longer exists: `quality-gate` EXECUTES `pnpm verify` rather than
// inspecting a receipt (docs/plans/2026-09-08-verification-rebuild.md § 3.3 / § 3.4). What survives
// is the release path decision, and only that.
//
// OUTPUTS (printed, and written as key=value to $GITHUB_OUTPUT when it is set)
//   has_changesets   pending changesets exist AT `--after` (working tree when no ref is given), so
//                    the run opens a Version PR rather than publishing
//   publish          the release path is reachable for this push
//
// `--check-npm` FAILS CLOSED, AND SAYS SO. It used to fail OPEN: `npm view` was spawned with cwd =
// the repo root, where `package.json` declares `devEngines.runtime` node 24.20.0. npm does not
// honour pnpm's `onFail: download`, so on any host Node that is not exactly that version npm exits
// with EBADDEVENGINES before it ever reaches the network — and the old `status !== 0` branch read
// that as "not published". Every push to `main` therefore reported both public packages as
// unpublished and set `publish=true`, which starts `quality-gate` and arms the OIDC-capable
// `publish` job on changeset-free pushes. Run 34323665258 shows it on the mini:
//   publish  true — unpublished: @vegastack/design (none) → 0.3.2, @vegastack/design-tokens (none) → 0.2.0
// with 0.3.2 and 0.2.0 both live on npm at the time.
//
// So the registry query now distinguishes THREE outcomes, not two:
//   published   npm answered with a version — compared against the manifest
//   absent      npm answered E404 — the ONLY answer that may mean "unpublished"
//   unknown     npm could not answer (engine refusal, network, auth, npm missing, junk output)
// An `unknown` never contributes to `publish`; asserting a release from an unanswered question is
// exactly the bug above. It is also never silent: the script exits 1 when an unknown was DECISIVE —
// when `publish` would be false and only the registry could have made it true — so an unanswerable
// query fails the `changes` job loudly instead of hiding a broken probe for another two months.
// When `publish` is already true from a pending changeset or a `packages/` change, the registry
// answer changes nothing, so an unknown is reported and the run proceeds.
//
// The query itself runs in an EMPTY TEMPORARY DIRECTORY carrying a copy of the repo `.npmrc`: out of
// reach of `devEngines`, still using the repo's own `@vegastack:registry` mapping, with no parsing
// of `.npmrc` to get that mapping wrong.

import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ROOT, readJson } from "./lib/fs.mjs";

const PUBLIC_PACKAGES = ["design", "design-tokens"];

const options = { before: null, after: null, checkNpm: false };
const argv = process.argv.slice(2);
for (let index = 0; index < argv.length; index += 1) {
  const flag = argv[index];
  if (flag === "--before") options.before = argv[++index];
  else if (flag === "--after") options.after = argv[++index];
  else if (flag === "--check-npm") options.checkNpm = true;
  else {
    console.error(
      `release-detect: unknown argument ${flag}\n` +
        "Usage: node tooling/release-detect.mjs [--before <ref>] [--after <ref>] [--check-npm]",
    );
    process.exit(2);
  }
}

/**
 * The pending changesets AT `--after`, not in the working tree.
 *
 * REF-ACCURATE ON PURPOSE. `release.yml` calls this with the push's `before`/`after` shas, and the
 * only question it answers is "what does THAT COMMIT do". A working-tree read is the same thing
 * only by accident — it differs exactly in the case that matters most, the **Version PR**:
 * `changeset version` CONSUMES `.changeset/*.md`, so a checkout of the version commit has none
 * while a runner whose tree was written by an earlier step may still. The shell classifier this
 * replaces read `git ls-tree "$after" .changeset/`; dropping that was a silent behaviour change.
 * With no `--after` (a developer asking about the tree in front of them) the working tree IS the
 * right answer, and stays the fallback — as it is when the ref does not resolve.
 */
const changesetFiles = (() => {
  const isChangeset = (name) => name.endsWith(".md") && name !== "README.md";
  if (options.after) {
    const listed = spawnSync(
      "git",
      ["ls-tree", "--name-only", `${options.after}:.changeset`],
      { cwd: ROOT, encoding: "utf8" },
    );
    // status !== 0 covers both "the ref does not resolve" and "that commit has no .changeset/".
    if (listed.status === 0)
      return (listed.stdout ?? "")
        .split("\n")
        .map((name) => name.trim())
        .filter((name) => name && isChangeset(name));
    if (
      spawnSync(
        "git",
        ["rev-parse", "--verify", "--quiet", `${options.after}^{commit}`],
        {
          cwd: ROOT,
          encoding: "utf8",
        },
      ).status === 0
    )
      return []; // the commit exists and simply carries no .changeset/ directory
  }
  try {
    return readdirSync(join(ROOT, ".changeset")).filter(isChangeset);
  } catch {
    return [];
  }
})();
const hasChangesets = changesetFiles.length > 0;

/** Files changed in the range, when one was given. An unresolvable range is treated as "unknown". */
const changed =
  options.before && options.after
    ? (
        spawnSync(
          "git",
          ["diff", "--name-only", `${options.before}..${options.after}`],
          { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
        ).stdout ?? ""
      )
        .split("\n")
        .filter(Boolean)
    : [];

/**
 * A scratch directory the npm CLI can run in that is NOT inside this repository — the whole point
 * being that `package.json`'s `devEngines.runtime` is invisible from it. npm enforces that field and
 * refuses to do anything at all (EBADDEVENGINES) when the host Node differs, which is the NORMAL
 * case here: pnpm supplies 24.20.0 to `pnpm run`, while the host shell and `actions/setup-node` do
 * not. The repo `.npmrc` is copied in so the `@vegastack:registry` mapping still applies, without
 * this script reimplementing npmrc parsing to rediscover it.
 */
function npmScratchDirectory() {
  const directory = mkdtempSync(join(tmpdir(), "release-detect-npm-"));
  const npmrc = join(ROOT, ".npmrc");
  if (existsSync(npmrc)) copyFileSync(npmrc, join(directory, ".npmrc"));
  return directory;
}

/**
 * What does the registry say about `name`?
 *
 *   { state: "published", version }  npm answered with the `latest` version
 *   { state: "absent" }              npm answered E404 — the package does not exist
 *   { state: "unknown", reason }     npm could not answer; the caller must NOT guess
 *
 * `--json` so the answer is parsed rather than scraped: a version comes back as a JSON string and a
 * 404 as `{ error: { code: "E404" } }`, both distinguishable from the config warnings npm writes for
 * unrelated reasons. Anything else — a non-zero exit that is not E404, a spawn failure, a timeout,
 * output that will not parse — is `unknown`, deliberately including the EBADDEVENGINES case that
 * caused the fail-open bug.
 */
function queryRegistry(name, cwd) {
  const result = spawnSync("npm", ["view", name, "version", "--json"], {
    cwd,
    encoding: "utf8",
    timeout: 60_000,
  });
  if (result.error)
    return {
      state: "unknown",
      reason: `npm did not run (${result.error.code ?? result.error.message})`,
    };
  if (result.signal)
    return { state: "unknown", reason: `npm was killed (${result.signal})` };

  const stdout = (result.stdout ?? "").trim();
  const stderr = (result.stderr ?? "").trim();
  let parsed;
  try {
    parsed = stdout ? JSON.parse(stdout) : undefined;
  } catch {
    parsed = undefined;
  }

  if (result.status === 0) {
    if (typeof parsed === "string" && parsed)
      return { state: "published", version: parsed };
    // A dist-tag query returns exactly one version. A blank line, an array, or anything else means
    // npm answered a different question than the one asked — which is not evidence of anything.
    return {
      state: "unknown",
      reason: `npm exited 0 without a version${stdout ? ` (got ${stdout.slice(0, 80)})` : ""}`,
    };
  }

  const notFound =
    parsed?.error?.code === "E404" ||
    /\bE404\b/.test(stderr) ||
    /\bE404\b/.test(stdout);
  if (notFound) return { state: "absent" };

  const code =
    parsed?.error?.code ??
    /npm error code (\S+)/.exec(stderr)?.[1] ??
    `exit ${result.status}`;
  return { state: "unknown", reason: `npm failed with ${code}` };
}

/**
 * Ask the registry what is actually published. "Did `packages/` change in this push" alone is WRONG
 * for an INTERRUPTED release: versions can sit bumped-but-unpublished on `main` — as happened when an
 * empty changeset deadlocked the Version PR, leaving 0.2.0 on main and 0.1.1 on npm with no future
 * push able to set this true. Opt-in because it needs network.
 */
const unpublished = [];
const unknown = [];
if (options.checkNpm) {
  const cwd = npmScratchDirectory();
  try {
    for (const directory of PUBLIC_PACKAGES) {
      const manifest = readJson(
        join(ROOT, `packages/${directory}/package.json`),
      );
      // One retry, because a single transport blip on a LAN runner should not turn a push red.
      let answer = queryRegistry(manifest.name, cwd);
      if (answer.state === "unknown")
        answer = queryRegistry(manifest.name, cwd);

      if (answer.state === "unknown") {
        unknown.push(`${manifest.name}: ${answer.reason}`);
        continue;
      }
      if (answer.state === "absent") {
        unpublished.push(`${manifest.name} (none) → ${manifest.version}`);
        continue;
      }
      if (answer.version !== manifest.version)
        unpublished.push(
          `${manifest.name} ${answer.version} → ${manifest.version}`,
        );
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

const publish =
  hasChangesets ||
  changed.some((file) => file.startsWith("packages/")) ||
  unpublished.length > 0;

/**
 * An unknown was DECISIVE when nothing else reached the release path: the registry was the only
 * thing that could have set `publish`, and it did not answer. Fail the run rather than emit a
 * `publish=false` that was never established.
 */
const decisiveUnknown = unknown.length > 0 && !publish;

const outputs = { has_changesets: hasChangesets, publish };
console.log(`release-detect:`);
console.log(
  `  has_changesets  ${hasChangesets} (${changesetFiles.length} pending)`,
);
console.log(
  `  publish         ${publish}${unpublished.length ? ` — unpublished: ${unpublished.join(", ")}` : ""}`,
);
if (unknown.length > 0)
  console.error(
    "release-detect: the npm registry could not be queried, so NOTHING was concluded from it:\n" +
      unknown.map((line) => `  ${line}`).join("\n") +
      (decisiveUnknown
        ? "\n  It was the only thing that could have set publish=true, so this run FAILS rather " +
          "than report a publish=false that was never established."
        : "\n  publish=true was already established without it, so the run continues."),
  );

if (process.env.GITHUB_OUTPUT)
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    Object.entries(outputs)
      .map(([key, value]) => `${key}=${value}\n`)
      .join(""),
  );

if (decisiveUnknown) process.exit(1);

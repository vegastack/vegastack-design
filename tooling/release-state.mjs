#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse as parseYaml } from "yaml";

import {
  changedFilesInRange,
  defaultBaseRef,
  git,
  ROOT,
  resolveCommit,
} from "./lib/change-set.mjs";
import {
  classifyReleaseState,
  interpretNpmLookup,
} from "./lib/release-state.mjs";

const USAGE = `Usage: node tooling/release-state.mjs [options]

  --before <ref>       range start (default: origin/main, falling back to main)
  --after <ref>        exact commit to inspect (default: HEAD)
  --github-output <p>  write decision outputs (default: $GITHUB_OUTPUT)
  --report <path>      structured report (default: .gates/release-state.json)
  --require-github     require an authenticated Version Packages PR lookup when changesets exist

The npm registry is queried for each exact public workspace name@version. Only E404 means absent.
Timeout, 5xx, malformed data, wrong versions, ambiguous Version PR state, and lookup failures block.

Exit codes: 0 decided and unblocked · 2 unknown or blocked state.`;

function fatal(message) {
  console.error(`release-state: ${message}`);
  process.exit(2);
}

const options = {
  before: null,
  after: "HEAD",
  githubOutput: process.env.GITHUB_OUTPUT ?? null,
  report: join(ROOT, ".gates/release-state.json"),
  requireGithub: false,
};
for (let index = 2; index < process.argv.length; index++) {
  const flag = process.argv[index];
  const value = () => {
    const next = process.argv[++index];
    if (next === undefined) fatal(`${flag} requires a value`);
    return next;
  };
  if (flag === "--before") options.before = value();
  else if (flag === "--after") options.after = value();
  else if (flag === "--github-output") options.githubOutput = value();
  else if (flag === "--report") options.report = value();
  else if (flag === "--require-github") options.requireGithub = true;
  else if (flag === "--help" || flag === "-h") {
    console.log(USAGE);
    process.exit(0);
  } else fatal(`unknown option ${flag}\n\n${USAGE}`);
}

const beforeRef = options.before ?? defaultBaseRef();
const beforeSha = resolveCommit(beforeRef);
const afterSha = resolveCommit(options.after);
if (!beforeSha) fatal(`--before ref does not resolve: ${beforeRef}`);
if (!afterSha) fatal(`--after ref does not resolve: ${options.after}`);

function at(ref, path) {
  const value = git(["show", `${ref}:${path}`], { allowFailure: true });
  return value == null ? null : value;
}

function changesetsAt(ref) {
  const listed =
    git(["ls-tree", "-r", "--name-only", ref, ".changeset"], {
      allowFailure: true,
    }) ?? "";
  return listed
    .split("\n")
    .filter((path) => /^\.changeset\/.*\.md$/.test(path))
    .sort()
    .map((path) => {
      const source = at(ref, path) ?? "";
      const match = /^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/.exec(source);
      if (!match)
        return {
          name: path.slice(".changeset/".length, -3),
          releases: [],
          error: "missing or malformed YAML frontmatter",
        };
      let frontmatter;
      try {
        frontmatter = parseYaml(match[1]) ?? {};
      } catch {
        return {
          name: path.slice(".changeset/".length, -3),
          releases: [],
          error: "invalid YAML frontmatter",
        };
      }
      if (
        typeof frontmatter !== "object" ||
        Array.isArray(frontmatter) ||
        Object.entries(frontmatter).some(
          ([name, type]) =>
            name.length === 0 || !["patch", "minor", "major"].includes(type),
        )
      )
        return {
          name: path.slice(".changeset/".length, -3),
          releases: [],
          error: "frontmatter must map package names to patch, minor, or major",
        };
      const releases = Object.entries(frontmatter).map(([name, type]) => ({
        name,
        type,
      }));
      return { name: path.slice(".changeset/".length, -3), releases };
    });
}

function npmRegistry(name, version) {
  const result = spawnSync(
    "npm",
    ["view", `${name}@${version}`, "version", "--json"],
    {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 60_000,
    },
  );
  return interpretNpmLookup({
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
    expected: version,
  });
}

async function versionPrState(required, hasChangesets) {
  if (!hasChangesets) return { status: "none", source: "not-required" };
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository)
    return {
      status: "unknown",
      reason: `${required ? "required authenticated" : "authenticated"} Version Packages PR lookup unavailable (GITHUB_TOKEN/GITHUB_REPOSITORY missing)`,
    };
  const owner = repository.split("/")[0];
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/pulls?state=open&head=${owner}%3Achangeset-release%2Fmain&per_page=10`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok)
      return { status: "unknown", reason: `GitHub HTTP ${response.status}` };
    const pulls = await response.json();
    if (!Array.isArray(pulls))
      return { status: "unknown", reason: "GitHub returned malformed PR data" };
    if (pulls.length === 0) return { status: "none", source: "github" };
    if (pulls.length !== 1)
      return {
        status: "unknown",
        reason: `${pulls.length} Version Packages PRs are open`,
      };
    return {
      status: "open",
      number: pulls[0].number,
      headSha: pulls[0].head?.sha,
      source: "github",
    };
  } catch (error) {
    return {
      status: "unknown",
      reason: `GitHub lookup failed: ${error.code ?? error.name ?? "unknown"}`,
    };
  }
}

const changedFiles = changedFilesInRange(beforeSha, afterSha);
const changesets = changesetsAt(afterSha);
const hasChangesetFiles = changesets.length > 0;
const manifests = [
  "packages/design/package.json",
  "packages/design-tokens/package.json",
].map((path) => {
  const source = at(afterSha, path);
  if (source == null) fatal(`${path} is absent at ${afterSha}`);
  const manifest = JSON.parse(source);
  return {
    name: manifest.name,
    version: manifest.version,
    registry: hasChangesetFiles
      ? {
          status: "not-required",
          reason: "pending changeset prevents npm publication",
        }
      : npmRegistry(manifest.name, manifest.version),
  };
});
const versionPr = await versionPrState(
  options.requireGithub,
  changesets.some((entry) => entry.releases.length > 0),
);
const report = classifyReleaseState({
  changedFiles,
  changesets,
  publicPackages: manifests,
  versionPr,
});
report.range = {
  before: { ref: beforeRef, sha: beforeSha },
  after: { ref: options.after, sha: afterSha },
};
report.observedAt = new Date().toISOString();

mkdirSync(dirname(options.report), { recursive: true });
const temporary = `${options.report}.${process.pid}.tmp`;
writeFileSync(temporary, `${JSON.stringify(report, null, 2)}\n`, {
  mode: 0o600,
  flag: "wx",
});
renameSync(temporary, options.report);

if (options.githubOutput) {
  appendFileSync(
    options.githubOutput,
    Object.entries({
      release_state: report.decision.state,
      release_blocked: report.decision.blocked,
      release_required: report.decision.release_required,
      version_pr: report.decision.version_pr,
      npm_publish: report.decision.npm_publish,
    })
      .map(([key, value]) => `${key}=${value}`)
      .join("\n") + "\n",
  );
}

console.log(
  `release-state: ${report.decision.state}${report.decision.blocked ? " (BLOCKED)" : ""}`,
);
console.log(`  ${report.reason}`);
console.log(`  next: ${report.nextAction}`);
console.log(`  approval: ${report.approvalBoundary}`);
console.log(
  `  quality=${report.decision.release_required} version-pr=${report.decision.version_pr} npm-publish=${report.decision.npm_publish}`,
);
console.log(`  report: ${options.report}`);
if (report.decision.blocked) process.exit(2);

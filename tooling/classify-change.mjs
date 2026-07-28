#!/usr/bin/env node
// Classify a change: which gates must have run for it, and what a push to main will DO.
//
// ONE AUTHORITY, DELIBERATELY
//   This logic used to be shell inside `release.yml`'s `changes` job, which meant it could not be
//   exercised until it had already run on `main`. It was wrong there in both directions on
//   2026-07-25: first reporting a rendered-surface change for a pure version bump, then — after a
//   fix — reporting no change for a real component edit while exiting 0, a fail-open with a green
//   log. Reading the shell caught neither; executing it did.
//
//   So the logic lives here, the workflows call it, and `tooling/verify-classify-change.mjs` proves
//   both directions. `tooling/release-classify.mjs` presents its meaning for a human.
//
//   The route decision is NOT reimplemented either: "must the contract lane have run?" is answered
//   by tooling/lib/route-scope.mjs with CONTRACT_SCOPE — the same authority tooling/contracts-run.mjs
//   uses locally. A CI guard and a local runner that disagree about scope would be worse than no
//   guard at all.
//
// OUTPUTS (also written as key=value to $GITHUB_OUTPUT when it is set)
//   contracts        the receipt must carry a passing contracts lane
//   contracts_scope  all | <n> route(s) | none
//   unit             the receipt must carry a passing browser-unit lane
//   smoke            the receipt must carry a passing cross-engine smoke lane
//   publish          the release path is reachable for this push
//   has_changesets   pending changesets exist, so the run opens a Version PR rather than publishing

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

import {
  changedFilesInRange,
  changedFilesInWorkingTree,
  defaultBaseRef,
  dropProvenanceOnly,
  git,
  mergeBase,
  ROOT,
  resolveCommit,
  versionBumpOnly,
} from "./lib/change-set.mjs";
import { CONTRACT_SCOPE, selectRoutes } from "./lib/route-scope.mjs";
import { smokeImpact } from "./lib/smoke-scope.mjs";

/** Paths whose change can break the browser-unit suite. */
const UNIT_SURFACE = [
  /^packages\/ui\//,
  /^packages\/design\//,
  /^packages\/design-tokens\//,
  /^apps\/docs\/components\//,
];

const USAGE = `Usage: node tooling/classify-change.mjs [options]

  --before <ref>    range start (default: origin/main, falling back to main)
  --after <ref>     range end (default: the working tree)
  --json            print the classification as JSON instead of a table
  --github-output   write key=value pairs here (default: $GITHUB_OUTPUT when set)

Working-tree classification includes untracked paths. A changed path with no independently
inspectable git diff record is never treated as version-only; unknown dependencies widen coverage.

Exit codes: 0 classified · 2 the range could not be resolved.`;

function fatal(message) {
  console.error(`classify-change: ${message}`);
  process.exit(2);
}

const options = {
  before: null,
  after: null,
  json: false,
  githubOutput: process.env.GITHUB_OUTPUT ?? null,
  checkNpm: false,
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
  else if (flag === "--json") options.json = true;
  else if (flag === "--github-output") options.githubOutput = value();
  else if (flag === "--check-npm") options.checkNpm = true;
  else if (flag === "--help" || flag === "-h") {
    console.log(USAGE);
    process.exit(0);
  } else fatal(`unknown option ${flag}\n\n${USAGE}`);
}

const beforeRef = options.before ?? defaultBaseRef();
const beforeSha = resolveCommit(beforeRef);
if (!beforeSha)
  fatal(`--before ref does not resolve to a commit: ${beforeRef}`);

let afterSha = null;
if (options.after !== null) {
  afterSha = resolveCommit(options.after);
  if (!afterSha)
    fatal(`--after ref does not resolve to a commit: ${options.after}`);
}

/**
 * A commit range is diffed directly; the working tree is diffed from the MERGE-BASE, because a
 * branch behind main must not inherit main's changes as its own.
 */
const rangeStart = afterSha
  ? beforeSha
  : (mergeBase(beforeSha, "HEAD") ?? beforeSha);

const allChanged = afterSha
  ? changedFilesInRange(rangeStart, afterSha)
  : changedFilesInWorkingTree(rangeStart);

const changed = dropProvenanceOnly(allChanged, {
  before: rangeStart,
  after: afterSha,
});
const provenanceOnly = allChanged.length - changed.length;

/**
 * A PURE VERSION BUMP REQUIRES NOTHING, and this has to be checked explicitly.
 *
 * Without it, `packages/ui/package.json` and `packages/design/package.json` match UNIT_SURFACE below,
 * so a Version PR demanded the browser-unit lane — which the carried receipt legitimately records as
 * skipped, because nothing observable changed. The result was a publish path that could never open:
 * measured on Version PR #11, `unit=true` against a receipt saying `unit: skipped`.
 *
 * `versionBumpOnly` is the same predicate the receipt carry and its guard use, proven against real
 * history in tooling/verify-classify-change.mjs. If every difference is version churn, no gate can
 * have anything to say about it.
 */
const pureVersionBump = (() => {
  if (allChanged.length === 0) return null;
  try {
    return versionBumpOnly(rangeStart, afterSha);
  } catch {
    return null;
  }
})();

const selection = selectRoutes(
  pureVersionBump?.ok ? [] : changed,
  {},
  CONTRACT_SCOPE,
);
const contractsRequired =
  selection.routes === null || selection.routes.size > 0;
const contractsScope =
  selection.routes === null
    ? "all"
    : selection.routes.size > 0
      ? `${selection.routes.size} route(s)`
      : "none";

const unitRequired =
  !pureVersionBump?.ok &&
  changed.some((file) => UNIT_SURFACE.some((pattern) => pattern.test(file)));
const smokeSelection = smokeImpact(changed);
// A global-surface change (tokens, the shared runtime) can move motion and focus behaviour in ways
// only a second engine shows, so a full contract sweep implies the smoke lane too.
const smokeRequired =
  !pureVersionBump?.ok &&
  (selection.routes === null || smokeSelection.required);

/**
 * Read the changesets from the REF being classified. Reading the working tree was wrong whenever
 * `--after` names something not checked out — exactly what the ship skill tells you to do before
 * merging a Version PR (`--before main --after changeset-release/main`), where the whole question is
 * whether that branch consumed them.
 */
const changesetFiles = (() => {
  if (afterSha) {
    const listed = git(["ls-tree", "--name-only", afterSha, ".changeset/"], {
      allowFailure: true,
    });
    return (listed ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.endsWith(".md") && !line.endsWith("README.md"));
  }
  try {
    return readdirSync(join(ROOT, ".changeset")).filter(
      (name) => name.endsWith(".md") && name !== "README.md",
    );
  } catch {
    return [];
  }
})();
const hasChangesets = changesetFiles.length > 0;
/**
 * Is the release path reachable?
 *
 * "Did `packages/` change in this push" alone is WRONG for an interrupted release. Versions can sit
 * bumped-but-unpublished on `main` — as happened when an empty changeset deadlocked the Version PR
 * ("All changesets are empty; not creating PR"), leaving 0.2.0 on main and 0.1.1 on npm with no future
 * push able to set this true. A release that cannot resume is a release that needs a human to guess.
 *
 * So `--check-npm` additionally asks the registry what is actually published. It is opt-in because it
 * needs network: the workflow's `changes` job passes it, and the offline verifiers do not.
 */
let unpublished = [];
if (options.checkNpm) {
  for (const directory of ["design", "design-tokens"]) {
    const manifest = JSON.parse(
      readFileSync(join(ROOT, `packages/${directory}/package.json`), "utf8"),
    );
    const latest = spawnSync("npm", ["view", manifest.name, "version"], {
      encoding: "utf8",
      timeout: 60_000,
    });
    const published = (latest.stdout ?? "").trim();
    // A package with no releases at all, or one behind the workspace, is unpublished work.
    if (latest.status !== 0 || published !== manifest.version)
      unpublished.push(
        `${manifest.name} ${published || "(none)"} → ${manifest.version}`,
      );
  }
}

const publish =
  hasChangesets ||
  changed.some((file) => file.startsWith("packages/")) ||
  unpublished.length > 0;

const classification = {
  before: { ref: beforeRef, sha: beforeSha },
  after: afterSha
    ? { ref: options.after, sha: afterSha }
    : { ref: "working-tree", sha: null },
  rangeStart,
  changedFiles: allChanged.length,
  substantiveFiles: changed.length,
  provenanceOnlyFiles: provenanceOnly,
  contracts: contractsRequired,
  contracts_scope: contractsScope,
  contracts_reason: pureVersionBump?.ok
    ? "pure version bump — no observable change"
    : selection.reason,
  pureVersionBump: pureVersionBump?.ok === true,
  unit: unitRequired,
  smoke: smokeRequired,
  smoke_scope: smokeSelection.full
    ? "all"
    : `${smokeSelection.tests.length} test file(s)`,
  smoke_reason: pureVersionBump?.ok
    ? "pure version bump — no observable change"
    : smokeSelection.reasons.join("; ") || "registry/Vitest dependency closure",
  publish,
  has_changesets: hasChangesets,
  unpublished,
};

if (options.githubOutput) {
  appendFileSync(
    options.githubOutput,
    Object.entries({
      contracts: contractsRequired,
      contracts_scope: contractsScope,
      unit: unitRequired,
      smoke: smokeRequired,
      publish,
      has_changesets: hasChangesets,
    })
      .map(([key, value]) => `${key}=${value}`)
      .join("\n") + "\n",
  );
}

if (options.json) {
  console.log(JSON.stringify(classification, null, 2));
  process.exit(0);
}

console.log(
  `classify-change: ${beforeRef} (${beforeSha.slice(0, 8)}) → ${
    afterSha ? `${options.after} (${afterSha.slice(0, 8)})` : "working tree"
  }`,
);
console.log(
  `  ${allChanged.length} changed file(s); ${provenanceOnly} were provenance re-stamping only`,
);
console.log("");
console.log("required gates for this change");
console.log(
  `  contracts       ${contractsRequired} — ${contractsScope} (${classification.contracts_reason})`,
);
console.log(`  unit            ${unitRequired}`);
console.log(
  `  smoke           ${smokeRequired} — ${classification.smoke_scope} (${classification.smoke_reason})`,
);
console.log("");
console.log("release path");
console.log(
  `  publish         ${publish}${unpublished.length ? ` — unpublished: ${unpublished.join(", ")}` : ""}`,
);
console.log(`  has_changesets  ${hasChangesets}`);

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

import { readdirSync, readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

import {
  changedFilesInRange,
  changedFilesInWorkingTree,
  defaultBaseRef,
  dropProvenanceOnly,
  mergeBase,
  ROOT,
  resolveCommit,
} from "./lib/change-set.mjs";
import { CONTRACT_SCOPE, selectRoutes } from "./lib/route-scope.mjs";

const CONTRACTS_JSON = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/component-contracts.json"), "utf8"),
);

/**
 * Files whose change requires the cross-engine smoke lane: the sources and tests of every component
 * marked `coverage.crossBrowserSmoke: "selected"`. Derived from the machine authority rather than
 * listed here, so adding a component to the smoke set updates this automatically.
 */
const SMOKE_FILES = new Set(
  [
    ...CONTRACTS_JSON.components,
    ...CONTRACTS_JSON.hooks,
    ...CONTRACTS_JSON.blocks,
  ]
    .filter((record) => record.coverage?.crossBrowserSmoke === "selected")
    .flatMap((record) => [
      ...(record.sourceFiles ?? []),
      ...(record.testFiles ?? []),
    ]),
);

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

const selection = selectRoutes(changed, {}, CONTRACT_SCOPE);
const contractsRequired =
  selection.routes === null || selection.routes.size > 0;
const contractsScope =
  selection.routes === null
    ? "all"
    : selection.routes.size > 0
      ? `${selection.routes.size} route(s)`
      : "none";

const unitRequired = changed.some((file) =>
  UNIT_SURFACE.some((pattern) => pattern.test(file)),
);
// A global-surface change (tokens, the shared runtime) can move motion and focus behaviour in ways
// only a second engine shows, so a full contract sweep implies the smoke lane too.
const smokeRequired =
  selection.routes === null || changed.some((file) => SMOKE_FILES.has(file));

const changesetFiles = (() => {
  try {
    return readdirSync(join(ROOT, ".changeset")).filter(
      (name) => name.endsWith(".md") && name !== "README.md",
    );
  } catch {
    return [];
  }
})();
const hasChangesets = changesetFiles.length > 0;
const publish =
  hasChangesets || changed.some((file) => file.startsWith("packages/"));

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
  contracts_reason: selection.reason,
  unit: unitRequired,
  smoke: smokeRequired,
  publish,
  has_changesets: hasChangesets,
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
  `  contracts       ${contractsRequired} — ${contractsScope} (${selection.reason})`,
);
console.log(`  unit            ${unitRequired}`);
console.log(`  smoke           ${smokeRequired}`);
console.log("");
console.log("release path");
console.log(`  publish         ${publish}`);
console.log(`  has_changesets  ${hasChangesets}`);

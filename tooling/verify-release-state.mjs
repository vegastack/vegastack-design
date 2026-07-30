#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  classifyReleaseState,
  interpretNpmLookup,
} from "./lib/release-state.mjs";

const packages = (design, tokens) => [
  { name: "@vegastack/design", version: "0.3.0", registry: design },
  { name: "@vegastack/design-tokens", version: "0.2.0", registry: tokens },
];
const publishedDesign = { status: "published", version: "0.3.0" };
const publishedTokens = { status: "published", version: "0.2.0" };
const none = { status: "none" };

function state(input) {
  return classifyReleaseState({
    changedFiles: [],
    changesets: [],
    publicPackages: packages(publishedDesign, publishedTokens),
    versionPr: none,
    ...input,
  });
}

assert.deepEqual(state({}).decision, {
  state: "clean-noop",
  blocked: false,
  release_required: false,
  version_pr: false,
  npm_publish: false,
});

for (const changeset of [
  [
    {
      name: "private-ui",
      releases: [{ name: "@vegastack/ui", type: "patch" }],
    },
  ],
  [
    {
      name: "design",
      releases: [{ name: "@vegastack/design", type: "minor" }],
    },
  ],
  [
    {
      name: "tokens",
      releases: [{ name: "@vegastack/design-tokens", type: "patch" }],
    },
  ],
  [
    { name: "empty", releases: [] },
    { name: "mixed", releases: [{ name: "@vegastack/design", type: "patch" }] },
  ],
]) {
  const result = state({ changesets: changeset });
  assert.equal(result.decision.state, "changesets-nonempty");
  assert.equal(result.decision.version_pr, true);
  assert.equal(result.decision.npm_publish, false);
}

const empty = state({ changesets: [{ name: "empty", releases: [] }] });
assert.equal(empty.decision.state, "changesets-all-empty");
assert.equal(empty.decision.blocked, true);

const invalid = state({
  changesets: [
    { name: "broken", releases: [], error: "invalid YAML frontmatter" },
  ],
});
assert.equal(invalid.decision.state, "changesets-invalid");
assert.equal(invalid.decision.blocked, true);
assert.equal(invalid.decision.version_pr, false);

const conflict = state({
  changedFiles: [".github/workflows/release.yml", ".changeset/design.md"],
  changesets: [
    {
      name: "design",
      releases: [{ name: "@vegastack/design", type: "patch" }],
    },
  ],
});
assert.equal(conflict.decision.state, "workflow-diff-conflict");
assert.equal(conflict.decision.blocked, true);

const open = state({
  changesets: [
    {
      name: "design",
      releases: [{ name: "@vegastack/design", type: "patch" }],
    },
  ],
  versionPr: { status: "open", number: 21, headSha: "abc" },
});
assert.equal(open.decision.state, "version-pr-open");
assert.equal(open.decision.version_pr, true);

const githubUnknown = state({
  changesets: [
    {
      name: "design",
      releases: [{ name: "@vegastack/design", type: "patch" }],
    },
  ],
  versionPr: { status: "unknown", reason: "HTTP 500" },
});
assert.equal(githubUnknown.decision.state, "changesets-nonempty");
assert.equal(githubUnknown.decision.blocked, true);
assert.match(
  githubUnknown.nextAction,
  /Restore the authenticated Version Packages PR lookup/,
);

const registryOnly = state({
  changedFiles: ["packages/ui/registry/ui/button.tsx"],
});
assert.equal(registryOnly.decision.state, "published");
assert.equal(registryOnly.decision.release_required, true);
assert.equal(registryOnly.decision.npm_publish, false);

const oneMissing = state({
  publicPackages: packages({ status: "missing" }, publishedTokens),
});
assert.equal(oneMissing.decision.state, "versioned-unpublished");
assert.equal(oneMissing.decision.npm_publish, true);
assert.equal(oneMissing.decision.release_required, true);

const interrupted = state({
  publicPackages: packages(publishedDesign, { status: "missing" }),
});
assert.equal(interrupted.decision.state, "versioned-unpublished");
assert.equal(interrupted.decision.npm_publish, true);

for (const registry of [
  { status: "unknown", reason: "timeout" },
  { status: "unknown", reason: "HTTP 503" },
  { status: "unknown", reason: "malformed JSON" },
]) {
  const result = state({
    publicPackages: packages(registry, publishedTokens),
  });
  assert.equal(result.decision.state, "registry-unknown");
  assert.equal(result.decision.blocked, true);
  assert.equal(result.decision.npm_publish, false);
}

assert.deepEqual(
  interpretNpmLookup({ status: 0, stdout: '"0.3.0"', expected: "0.3.0" }),
  { status: "published", version: "0.3.0" },
);
assert.equal(
  interpretNpmLookup({
    status: 1,
    stderr: "npm error code E404",
    expected: "0.3.0",
  }).status,
  "missing",
);
for (const fixture of [
  { status: null, error: { code: "ETIMEDOUT" }, expected: "0.3.0" },
  { status: 1, stderr: "503 Service Unavailable", expected: "0.3.0" },
  { status: 0, stdout: "not-json", expected: "0.3.0" },
  { status: 0, stdout: '"9.9.9"', expected: "0.3.0" },
])
  assert.equal(interpretNpmLookup(fixture).status, "unknown");

console.log(
  "✓ release state: clean/nonempty/empty/open/conflict/unpublished/published/registry-unknown and npm 404/timeout/5xx/malformed/interrupted fixtures fail closed",
);

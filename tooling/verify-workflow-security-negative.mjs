#!/usr/bin/env node

// Mutation proof for verify-workflow-security.mjs. Every case starts from the real passing workflow
// set, applies exactly one security/topology regression, and requires the verifier to reject it.

import assert from "node:assert/strict";

import {
  readWorkflowSources,
  verifyWorkflowSources,
} from "./verify-workflow-security.mjs";

const sources = readWorkflowSources();
verifyWorkflowSources(sources);

const cases = [
  {
    name: "PR CI restores the complete component suite",
    file: "ci.yml",
    find: 'run: pnpm verify:affected --base "$BASE_SHA" --head "$HEAD_SHA"',
    replace: "run: pnpm test:full --engines chromium",
  },
  {
    name: "PR CI drops affected verification",
    file: "ci.yml",
    find: 'run: pnpm verify:affected --base "$BASE_SHA" --head "$HEAD_SHA"',
    replace: "run: pnpm verify:static",
  },
  {
    name: "Version PR restores component selection",
    file: "ci.yml",
    find: "        run: pnpm verify:static\n",
    replace:
      '        run: pnpm verify:affected --base "$BASE_SHA" --head "$HEAD_SHA"\n',
  },
  {
    name: "Version PR drops static proof",
    file: "ci.yml",
    find: "      - name: Static proof for generated Version Packages output\n",
    replace: "      - name: Generated Version Packages output\n",
  },
  {
    name: "fork guard is removed",
    file: "ci.yml",
    find: "    if: github.event.pull_request.head.repo.full_name == github.repository\n",
    replace: "",
  },
  {
    name: "PR quality gains a manual trigger",
    file: "ci.yml",
    find: "on:\n  pull_request:\n",
    replace: "on:\n  pull_request:\n  workflow_dispatch:\n",
  },
  {
    name: "PR job moves to hosted capacity",
    file: "ci.yml",
    find: "runs-on: [self-hosted, linux, vsk-runner]",
    replace: "runs-on: ubuntu-latest",
  },
  {
    name: "PR job gains write authority",
    file: "ci.yml",
    find: "    timeout-minutes: 20",
    replace: "    timeout-minutes: 20\n    permissions:\n      contents: write",
  },
  {
    name: "browser container is removed",
    file: "ci.yml",
    find: "    container:\n      image: mcr.microsoft.com/playwright:v1.63.0-noble\n      volumes:\n        - /opt/vsk-runner/pnpm-store:/pnpm-store\n",
    replace: "",
  },
  {
    name: "browser image drifts from Playwright",
    file: "ci.yml",
    find: "mcr.microsoft.com/playwright:v1.63.0-noble",
    replace: "mcr.microsoft.com/playwright:v0.0.1-noble",
  },
  {
    name: "action pin becomes mutable",
    file: "ci.yml",
    find: "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803",
    replace: "actions/checkout@v6",
  },
  {
    name: "checkout persists credentials",
    file: "release.yml",
    find: "persist-credentials: false",
    replace: "persist-credentials: true",
  },
  {
    name: "macOS pnpm bootstrap returns to shared home",
    file: "release.yml",
    find: "          dest: ${{ runner.temp }}/setup-pnpm",
    replace: "          dest: ~/setup-pnpm",
  },
  {
    name: "macOS install drops the persistent per-agent store",
    file: "release.yml",
    find: 'pnpm install --frozen-lockfile --ignore-scripts --store-dir "$RUNNER_WORKSPACE/pnpm-store"',
    replace: "pnpm install --frozen-lockfile --ignore-scripts",
  },
  {
    name: "manual full audit gains a PR trigger",
    file: "full-suite.yml",
    find: "on:\n  workflow_dispatch:",
    replace: "on:\n  pull_request:\n  workflow_dispatch:",
  },
  {
    name: "release stops coordinating main pushes",
    file: "release.yml",
    find: "  push:\n    branches: [main]\n",
    replace: "",
  },
  {
    name: "release loses the exact-main guard",
    file: "release.yml",
    find: 'test "$(git rev-parse origin/main)" = "$REQUESTED_SHA" || {',
    replace: 'test -n "$REQUESTED_SHA" || {',
  },
  {
    name: "release state bypasses the tested detector",
    file: "release.yml",
    find: "          node tooling/release-detect.mjs \\\n",
    replace: "          node -e 'process.exit(0)' \\\n",
  },
  {
    // The exact-SHA boundary: the Version PR's head must be confirmed against the branch ref, not
    // taken from the PR API alone. The positive gate has always asserted this; nothing had ever
    // watched it fail, and the surrounding step was edited on 2026-09-23 to retry the comparison
    // through REST. The realistic weakening is not deleting the check but making it vacuous.
    name: "Version PR head is trusted without binding it to the branch ref",
    file: "release.yml",
    // Matched on the API call alone, not the whole line: the first version of this mutation pinned
    // the leading whitespace and the exact command, and adding `|| true` to that line made it stop
    // applying. The harness caught that itself — `mutation did not apply` is an assertion, not a
    // skip — but a mutation needing an edit whenever its line moves is one nobody keeps current.
    find: '$(gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/$VERSION_BRANCH" --jq .object.sha || true)',
    replace: '"$HEAD_SHA"',
  },
  {
    name: "Version PR creation ignores whether anything bumps",
    file: "release.yml",
    find: "    if: needs.changes.outputs.has_version_bump == 'true'",
    replace: "    if: always()",
  },
  {
    name: "release adds a duplicate Version PR quality dispatch",
    file: "release.yml",
    find: "\n  publish:\n",
    replace:
      "\n  dispatch-version-pr-quality:\n    runs-on: [self-hosted, vsk-runners-mac-mini]\n    timeout-minutes: 5\n    steps:\n      - run: gh workflow run ci.yml\n\n  publish:\n",
  },
  {
    name: "Changesets loses the GitHub metadata token",
    file: "release.yml",
    find: "          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n",
    replace: "",
  },
  {
    name: "generated release output escapes its allowlist",
    file: "ci.yml",
    find: '        run: node tooling/verify-release-output-scope.mjs --base "$BASE_SHA"\n',
    replace: "",
  },
  {
    name: "publish can run while changesets remain",
    file: "release.yml",
    find: "      needs.changes.outputs.publish == 'true' &&\n      needs.changes.outputs.has_version_bump == 'false'",
    replace: "      needs.changes.outputs.publish == 'true'",
  },
  {
    name: "publish retry becomes unbounded",
    file: "release.yml",
    find: "            for attempt in 1 2 3; do\n              if npm view",
    replace: "            while true; do\n              if npm view",
  },
  {
    name: "deploy dispatch retry becomes unbounded",
    file: "release.yml",
    find: "          BEFORE=$(gh run list --repo \"$GITHUB_REPOSITORY\" --workflow deploy.yml --limit 20 --json databaseId --jq '.[].databaseId')\n          for attempt in 1 2 3; do",
    replace:
      "          BEFORE=$(gh run list --repo \"$GITHUB_REPOSITORY\" --workflow deploy.yml --limit 20 --json databaseId --jq '.[].databaseId')\n          while true; do",
  },
  {
    name: "publish gains repository write authority",
    file: "release.yml",
    find: "      contents: read\n      id-token: write",
    replace: "      contents: write\n      id-token: write",
  },
  {
    name: "long-lived npm token returns",
    file: "release.yml",
    find: "          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}",
    replace:
      "          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}",
  },
  {
    name: "deploy restores all-component testing",
    file: "deploy.yml",
    find: "      - run: pnpm verify:distribution",
    replace: "      - run: pnpm test:full --engines all",
  },
  {
    name: "deploy accepts a commit outside main history",
    file: "deploy.yml",
    find: 'git merge-base --is-ancestor "$EXPECTED_SHA" origin/main || {',
    replace: 'test -n "$EXPECTED_SHA" || {',
  },
  {
    name: "deploy stops waiting for distribution proof",
    file: "deploy.yml",
    find: "    needs: distribution-proof",
    replace: "    needs: []",
  },
  {
    name: "tampered Sigstore manifest no longer blocks deploy",
    file: "deploy.yml",
    find: '            echo "::error::Tampered manifest unexpectedly verified"\n            exit 1',
    replace:
      '            echo "::warning::Tampered manifest unexpectedly verified"',
  },
  {
    name: "wrong Sigstore identity no longer blocks deploy",
    file: "deploy.yml",
    find: '            echo "::error::Wrong signer identity unexpectedly verified"\n            exit 1',
    replace:
      '            echo "::warning::Wrong signer identity unexpectedly verified"',
  },
  {
    name: "a red step is ignored",
    file: "deploy.yml",
    find: "      - run: pnpm verify:distribution",
    replace:
      "      - run: pnpm verify:distribution\n        continue-on-error: true",
  },
  {
    name: "job timeout is removed",
    file: "full-suite.yml",
    find: "    timeout-minutes: 45\n",
    replace: "",
  },
  {
    name: "shell expression is interpolated directly",
    file: "ci.yml",
    find: "          corepack enable",
    replace: "          echo ${{ github.event.pull_request.title }}",
  },
];

for (const mutation of cases) {
  const original = sources[mutation.file];
  const changed = original.replace(mutation.find, mutation.replace);
  assert.notEqual(
    changed,
    original,
    `mutation did not apply: ${mutation.name}`,
  );
  assert.throws(
    () =>
      verifyWorkflowSources({
        ...sources,
        [mutation.file]: changed,
      }),
    undefined,
    `workflow verifier accepted: ${mutation.name}`,
  );
  console.log(`✓ ${mutation.name}`);
}

console.log(
  `verify-workflow-security-negative: ${cases.length}/${cases.length} mutations rejected`,
);

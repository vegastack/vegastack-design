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
    name: "fork guard is removed",
    file: "ci.yml",
    find: "    if: github.event.pull_request.head.repo.full_name == github.repository\n",
    replace: "",
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
    name: "release becomes automatic on main",
    file: "release.yml",
    find: "on:\n  workflow_dispatch:",
    replace: "on:\n  push:\n    branches: [main]\n  workflow_dispatch:",
  },
  {
    name: "release loses the exact-main guard",
    file: "release.yml",
    find: 'test "$(git rev-parse origin/main)" = "$EXPECTED_SHA" || {',
    replace: 'test -n "$EXPECTED_SHA" || {',
  },
  {
    name: "release stops requiring the main ruleset",
    file: "release.yml",
    find: '      - name: Require affected PR protection before releasing\n        run: node tooling/main-ruleset.mjs --check-file "$RUNNER_TEMP/main-ruleset.json"\n',
    replace: "",
  },
  {
    name: "no-changeset main commit is treated as a resumable release",
    file: "release.yml",
    find: 'test "$(git log -1 --format=%s)" = "chore: release packages [skip ci]" || {',
    replace: 'test -n "$EXPECTED_SHA" || {',
  },
  {
    name: "release token is exposed in git argv",
    file: "release.yml",
    find: "          gh auth setup-git",
    replace:
      '          git push "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" HEAD:main',
  },
  {
    name: "Changesets loses the GitHub metadata token",
    file: "release.yml",
    find: "          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n",
    replace: "",
  },
  {
    name: "generated release output escapes its allowlist",
    file: "release.yml",
    find: '            node tooling/verify-release-output-scope.mjs --base "$EXPECTED_SHA"\n',
    replace: "",
  },
  {
    name: "generated release changelog stops being validated",
    file: "release.yml",
    find: "            node tooling/changelog-lint.mjs\n",
    replace: "",
  },
  {
    name: "publish retry becomes unbounded",
    file: "release.yml",
    find: "for attempt in 1 2 3; do",
    replace: "while true; do",
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

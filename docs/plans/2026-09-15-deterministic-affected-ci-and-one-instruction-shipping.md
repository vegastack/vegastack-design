# Deterministic affected CI and one-instruction shipping

**Date:** 2026-09-15 · **Status:** implemented · **Owner:** MK

This plan supersedes the full-component sweep on every pull request, the duplicate static/browser
verification on `main` and deploy, the private-site export matrix while production is public-only,
the Version Packages PR, and the separate approval required for each outward release step.

## Decisions

1. Pull-request CI is the single automatic quality boundary: full static verification once, followed
   by Chromium tests for changed registry items, their transitive reverse dependents, owned
   cross-cutting suites, and their preview geometry fixtures.
2. The complete component suite is manual only. Its workflow accepts `chromium` or `all` engines and
   is an audit/diagnostic tool, never an ordinary merge requirement.
3. Broad-impact changes run explicit contract suites and fixed geometry canaries; they never silently
   expand to every component. An unclassified path fails closed.
4. Local affected checks are optional feedback and carry no attestation value.
5. `main`, npm publication, and deployment do not repeat the PR's static or component tests.
   Deployment proves the public distribution artifact: registry integrity, real consume, public docs
   metadata/links/shell, signature, upload, and the production boundary.
6. `main` is protected by a ruleset requiring the PR quality check. The GitHub Actions app receives a
   narrow bypass for the generated release commit only.
7. One explicit **ship it** authorizes the current change from branch commit through PR, exact-SHA
   merge, direct release commit on `main`, npm OIDC publication, public registry/docs deployment, and
   production verification. All pending changesets ship as one coherent batch; no Version Packages
   PR, git tag, or GitHub release is created.
8. Transient operations retry up to three times. Surgical corrective branches and patch releases may
   also run for at most three source-changing iterations under the same authorization. Automation
   stops immediately for secrets, Cloudflare Access, auth policy, workflow-permission expansion,
   runner trust, a new sanctioned dependency, destructive data action, or version reversal.

## Implementation contract

- `packages/ui/component-contracts.json` remains the machine authority. It gains ownership records
  for every cross-cutting browser suite and the fixed broad-impact geometry canaries.
- `tooling/affected-tests.mjs` classifies exact git ranges or the working tree, computes transitive
  reverse dependencies from registry metadata already reconciled against source imports, extracts
  preview exports through the TypeScript AST, and emits an auditable plan before executing anything.
- The geometry harness accepts an explicit fixture allowlist but always runs its CSS/token sentinels,
  barrel/exclusion/dynamic metadata validation, and empty/unknown-selection guards.
- Commands are separated by responsibility: `verify:static`, `verify:affected`, `check:affected`,
  `test:full`, and `verify:distribution`. `check:component` remains as an affected-check alias.
- PR CI uses one Linux job. A manual full-suite workflow provides selectable engines. Release uses a
  direct, expected-SHA-bound commit and job-scoped permissions. Deploy verifies only the public
  distribution boundary and retains the existing Linux verification / macOS credential split while
  artifact storage is unavailable.

## Required proof

The selector's tests cover leaf and foundational components, transitive dependents, cycles, multiple
seeds, test/preview/docs-only changes, new/deleted/renamed/untracked files, semantic contract and
registry changes, broad inputs, version-only output, missing ownership, stale fixtures, and unknown
paths. Negative workflow tests prove that automatic full-suite execution, duplicate quality gates,
an unverified main update, a mismatched release SHA, an unbounded retry, or a protected-boundary
auto-fix all fail.

Rollout order: land and prove the selector plus commands; replace PR CI and add the manual audit;
activate the `main` ruleset; only then remove main/release/deploy repetition and enable the direct
release commit.

## Implemented evidence

- The final `pnpm verify` passed in 55.4s with typecheck, lint, 88 tooling/policy tests, design
  invariants and non-browser package tests executed once, then 142 selected Chromium tests across
  three changed component tests and all 11 cross-cutting suites.
- An earlier infrastructure-only working-tree proof selected all 11 cross-cutting suites plus nine
  geometry canaries and passed 84 Chromium tests without component test files.
- Explicit `code-block` selection resolved `code-block` plus `markdown-view` and passed 31 tests
  across two component files and seven geometry fixtures.
- The selector/policy/tooling suites cover the graph, git-range and fail-closed cases; affected and
  workflow mutation harnesses reject 8 and 32 regressions respectively.
- Public-only distribution proof passed registry idempotency, the public docs export, 13 docs-shell
  checks, nine injected docs-shell defects, 28 real shadcn graphs and 597/597 simulated items across
  both consumer layouts in 161.2s, with no component regression suite.
- The optional complete audit was also exercised manually: `pnpm test:full --engines all` passed in
  235.7s with Chromium 2,412/2,412 and Firefox 2,397 passed plus 15 intentional skips; WebKit emitted
  the repository's expected macOS host-incompatibility skip.
- `pnpm ruleset:check` correctly reports the external rule missing. Apply it only after this PR's
  `PR quality` workflow exists on `main`; `release.yml` refuses to create a direct release commit
  until the rule is present.

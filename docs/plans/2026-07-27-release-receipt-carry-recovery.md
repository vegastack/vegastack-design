# Release receipt-carry recovery

**Date:** 2026-07-27
**Status:** Proposed, expanded after clean-room release proof — implementation requires MK approval

## Context

Release run `30284410263` failed in `version-pr` after `changeset version`, `version-sync`, and the
registry rebuild completed. `tooling/gate-receipt-carry.mjs` rejected the generated Version Packages
tree as non-version churn, so Changesets never created the Version Packages PR and nothing was
published or deployed.

The rejection is a tooling defect, not product drift. `versionBumpOnly(baseCommit, null)` reads the
post-bump working tree through `readFileSync`, but `tooling/lib/change-set.mjs` does not import that
function. The resulting `ReferenceError` is caught by `readAtRevision` and converted to `null`, which
makes every structurally compared JSON authority look different.

A clean-room replay of the exact production command found two more deterministic blockers that the
first failure prevented CI from reaching:

1. `version-sync` updates dependency ranges inside `component-contracts.json`, but the production
   `version-packages` command does not run `pnpm design:derived`. The generated contract-SHA surfaces
   are therefore stale, and the Version Packages quality gate fails in `pnpm lint`.
2. Regenerating those surfaces legitimately changes the contract SHA. The carry updates the receipt's
   tree but not its `contractSha256`, so the independent guard rejects the generated Version Packages
   commit even though the carry proof accepted every file as version-only.

The existing release preflight did not catch any of these because it validates only a committed
simulated bump, runs `design:derived` outside the production command, and never executes the real
working-tree carry or its post-commit receipt guard.

## Scope

1. Import the missing `readFileSync` filesystem API in `tooling/lib/change-set.mjs`.
2. Make `version-sync` run `pnpm design:derived` before it returns, so the real `version-packages`
   command and the preflight cannot disagree about whether derived contract surfaces are current.
3. After `versionBumpOnly` succeeds, carry the current `contractSha256()` together with the current
   tree. This does not widen the exemption: a non-version diff is still rejected before either field
   can move.
4. Make `tooling/verify-release-chain.mjs` execute the real receipt-carry command against the
   simulated, uncommitted version tree before creating its simulated Version Packages commit.
5. Keep the existing commit-to-commit proof and run the independent receipt guard after the simulated
   commit so both release phases remain covered: the action's carry and CI's re-derivation.
6. Improve preflight failure text so working-tree carry, generated-surface, and contract-SHA failures
   name the same actionable cause that production reports.

## Non-goals

- No component, token, registry inventory, package API, or release version changes.
- No weakening of `versionBumpOnly`; valid version churn remains the only carryable diff.
- No manual receipt editing, skipped gate, workflow rerun, npm publish, or deploy workaround.
- No changeset. This is release tooling only, and the pending product changesets on `main` must
  remain the sole release intent.

## Verification

1. Run the repository-required push gates on the recovery tree and commit the resulting receipt.
2. In a clean clone at the failed merge, execute the real pending release sequence: all 23 changesets,
   `version-sync`, `design:derived`, and the carry. Assert the intended versions
   (`@vegastack/design@0.3.0`, `@vegastack/ui@0.4.0`, tokens unchanged at `0.2.0`).
3. Commit that generated tree and run the independent receipt guard. It must accept the new tree and
   new contract SHA, while `classify-change` reports `pureVersionBump: true` and requires no browser
   lanes.
4. Run the Release quality-gate commands: typecheck, full lint/security/negative fixtures, design
   package tests, production build, idempotent `registry:build`, and the complete registry consume
   round-trip.
5. Run the hardened `pnpm release:preflight`; it must visibly execute the real uncommitted carry,
   generated-surface check, committed guard, classifier proof, and full consume round-trip.
6. Push a focused recovery PR. After it is reviewed and merged, watch the Release workflow create a
   green Version Packages PR. Stop for MK's separate approval before merging that PR/npm publication,
   and stop again for separate approval before dispatching the ordinary production deploy.

## Clean-room evidence

The expanded three-part production fix was applied only in a throwaway clone rooted at failed main
commit `cfa1d05`; no repository or production state was changed.

- Recovery baseline: typecheck, lint, browser unit/axe, WebKit/Firefox smoke, and all 864 behaviour
  contracts passed in one run. One earlier smoke attempt failed without retained diagnostics; an
  unchanged direct rerun passed 643 tests, and the subsequent full gate passed, so it is classified
  as a non-reproducing browser-lane flake rather than part of this release defect.
- Real `pnpm run version-packages`: consumed 23 changesets, rebuilt/stamped all 554 items, regenerated
  all seven moved contract-derived surfaces, and carried 1,706 changed files as version-only.
- Independent post-commit guard: passed with the newly derived tree and contract SHA.
- Classifier: `pureVersionBump: true`; contracts/unit/smoke all false for the version commit.
- Release quality gate: typecheck, lint, security/negative fixtures, design tests, all-package build,
  425-page production docs export, and idempotent registry rebuild passed.
- Consumer proof: 26/26 real `shadcn add` graphs and 554/554 simulated graphs across both supported
  layouts passed, including TypeScript and local tarballs for the intended public versions.

## Risks and controls

- **False-positive carry:** unchanged risk; the semantic allowlist and independent commit-to-commit
  proof are not broadened, and the existing real-code negative fixture must stay red.
- **Preflight mutates the checkout:** it already requires a clean tree and restores the exact base
  commit on every exit. The carried receipt is included in that same restoration path.
- **Recovery on a release-bearing `main`:** the fix contains no new changeset, so merging it lets the
  existing pending changesets drive the next Version Packages run without altering release intent.

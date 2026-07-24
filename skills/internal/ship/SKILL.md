---
name: ship
description: Release VegaStack Design end to end — changesets, root CHANGELOG.md entry, version PR, npm OIDC publish, registry deploy, and verification. Use when asked to ship, release, publish, cut a version, or update the changelog for vegastack-design.
---

# Ship a VegaStack Design release

**MK-gated:** shipping is always MK's decision. Prepare everything, then STOP and present
the plan (versions, changelog entry, what deploys) and wait for an explicit "yes proceed"
BEFORE: pushing changesets, merging the Version PR, or dispatching deploy.yml. Never
auto-ship. Each gate is separate — approval to push is not approval to merge or deploy.

Run from the repo root. Every step is required unless marked optional. Never publish
manually with npm tokens — publishing is CI-only (OIDC trusted publishing).

## 1. Preflight

Refresh the contract-derived public inventory first. This regenerates the homepage component
catalog and counts alongside the contract route, matrix, and audit surfaces. If it changes files,
include those outputs with the component change before rerunning preflight; never hand-edit them.

```bash
pnpm design:derived
git status --porcelain          # must be empty — see below if it is not
pnpm lint && pnpm typecheck && pnpm test
pnpm registry:build             # must be idempotent: git status stays clean after
pnpm registry:verify-consume    # real `shadcn add` round-trip against the built registry
node tooling/changelog-lint.mjs
pnpm --filter @vegastack/docs test:contracts   # 768 behaviour contracts — blocking in ci.yml and release.yml
SITE_VISIBILITY=private pnpm --filter @vegastack/docs build
SITE_VISIBILITY=public pnpm --filter @vegastack/docs build
```

**If `git status` is not empty:** that is the signal, not an obstacle. Either the regenerated
surfaces above changed (commit them with the work that caused them) or there is unrelated
uncommitted work in the tree (finish or stash it). Never ship from a dirty tree — the version job
snapshots the pushed commit.

## 1b. Visual review

Run this whenever the release contains a component, token, preview, or docs-shell change. It is a
review step, not a gate: it exits 0 for any pixel outcome.

```bash
node tooling/vrt-review.mjs
```

Then follow [references/visual-review.md](references/visual-review.md) exactly:

1. Read `.vrt-review/report.json`.
2. For every entry with `status !== "unchanged"`, **read the before, after, and diff images**.
3. Classify each **intended** / **unintended** / **uncertain**.
4. Present a table — route, project, pixels changed, verdict, one-line reasoning.
5. **Stop. MK decides.** Never self-clear a diff.

A run that captured nothing prints SKIPPED. Report it as skipped; it is not evidence of a clean diff.
An exit code of 2 means no report could be produced — an infrastructure failure, not a pass.

## 2. Changesets (one per user-visible package change)

```bash
pnpm changeset
```

- `@vegastack/design` / `@vegastack/design-tokens`: patch = fix, minor = feature (pre-1.0).
- `@vegastack/ui` (private): bump minor for any registry item add/change — its version
  becomes every item's `meta.version`.
- A change under `skills/public/**` ships inside `@vegastack/design` and IS consumer-visible —
  it needs its own changeset (patch for a wording fix, minor for new guidance). Changes under
  `skills/internal/**` are not published and need none.
- Body: one sentence, imperative, states the consumer-visible effect. It lands verbatim in
  the package CHANGELOG.

Do NOT bundle workflow-file edits (`.github/workflows/*`) in the same push as changesets —
the version-PR branch push gets rejected (see `docs/RELEASING.md` § Known edge).

## 3. Root CHANGELOG.md entry

Add or extend the entry for the NEXT design-system version (= the `@vegastack/ui` version
after bump) at the TOP of `/CHANGELOG.md`, following
[references/changelog-format.md](references/changelog-format.md) exactly. Then:

```bash
node tooling/changelog-lint.mjs        # vocabulary, dates, shas, doc links
node tooling/sync-changelog.mjs        # regenerate the docs changelog page
pnpm --filter @vegastack/docs lint     # includes the sync drift gate
```

Commit changesets + CHANGELOG.md + the regenerated page together.

## 4. Version PR → publish

Changes reach `main` through a **reviewed PR**, not a direct push (`docs/RELEASING.md` step 4 is
canonical). MK approval is required before the change PR is merged. GitHub Team cannot provide
required-reviewer environments for this private repository, so review and the explicit merge action
are the approval boundary; MK may be the actor.

```bash
gh pr create --base main --fill        # then: review → explicit MK-approved merge
```

Watch runs by POLLING status (`gh run watch` can exit early):

```bash
until [ "$(gh run view <id> -R VegaStack/vegastack-design --json status --jq .status)" != "in_progress" ]; do sleep 60; done
```

The unprivileged Release quality gate runs first. A changeset-bearing run opens or updates the
**Version Packages** PR through a job that has no OIDC permission. Review its package versions,
`version-sync` stamped item versions, generated changelogs, and regenerated `public/r`. STOP for the
separate MK approval, then merge it. The merge run validates again and only the isolated publish job
receives npm OIDC. The trusted publisher is pinned to repository + `release.yml`, matching the proven
0.1.1 release; no npm token or GitHub environment is involved.
Verify:

```bash
npm view @vegastack/design version
```

## 5. Deploy the registry + docs

```bash
# ORDINARY deploy — the cutover jobs are skipped by design.
gh workflow run deploy.yml -R VegaStack/vegastack-design -f cutover_phase=ordinary
```

The manual dispatch from `main` is the outward-deploy approval. The workflow builds without
credentials, signs in the only OIDC-capable job, reverifies the immutable artifact in the
credential-only deploy job, and then probes the live boundary. Before cutover, ordinary deploys
require broad root SSO and service-token-only `/r/*`; after cutover, they require public docs,
SSO-only `/internal/*`, and service-token-only `/r/*`.

**The one-time public cutover is two separate dispatches.** Never chain them: the workflow must end
after `prepare` so an approved operator can remove broad root SSO before `verify` begins.

```bash
gh workflow run deploy.yml -R VegaStack/vegastack-design -f cutover_phase=prepare
# wait for success; then, under the separately approved Cloudflare change, remove broad root SSO
gh workflow run deploy.yml -R VegaStack/vegastack-design -f cutover_phase=verify
```

Each dispatch needs its own MK approval. `prepare` verifies broad root SSO and registry Service Auth,
checks the recorded Access IDs/token expiry, and purges retired derivatives. `verify` runs only after
the Access mutation and proves the public/internal/registry boundary. After it passes, record
`PUBLIC_DOCS_CUTOVER=complete`; future ordinary deploys run the public probe automatically. The
inventory/rollback record in `docs/plans/public-docs-cutover.md` and the specific `/internal/*` SSO +
`/r/*` Service Auth topology must be complete. Confirm the public probe covers public pages,
every exported internal derivative, the retired route derivatives, and all registry trust files,
including:

```
✓ / → 200
✓ /docs/components/button → 200
✓ /docs.md → 200
✓ /docs/components/button.md → 200
✓ /og/home/image.png → 200 image/png 1200×630
✓ /og/docs/components/button/image.png → 200 image/png 1200×630
✓ /llms.txt → 200
✓ /llms-full.txt → 200
✓ /api/search → 200
✓ /internal/internal-projects rejects anonymous requests
✓ /internal/internal-projects.html rejects anonymous requests
✓ /internal/internal-projects.md rejects anonymous requests
✓ /internal/internal-projects/__next._full.txt rejects anonymous requests
✓ /r/registry.json rejects anonymous requests
✓ /r/integrity-manifest.json rejects anonymous requests
✓ /r/integrity-manifest.sigstore rejects anonymous requests
✓ /r/button.json rejects anonymous requests
✓ /r/registry.json accepts the service token
✓ registry index, manifest, signature bundle, and representative item validate
```

## 6. Post-release verification

```bash
# reference consumer must be clean against the new production state
cd ../vegastack-design-starter && pnpm check-updates
```

Expect `up to date` for everything except items you just changed (those show `⬆`/`≈` —
correct). If the release changed the starter's own components, pull them
(`shadcn add @vegastack/<name> --overwrite`), rerun `pnpm test:smoke`, commit.

## Failure recovery

- Version PR push rejected mentioning `workflows permission` → re-run Release on current
  main (`docs/RELEASING.md` § Known edge). Never bundle `.github/workflows/*` edits into a
  changeset-bearing push; land them as their own PR first.
- Contract gate red → the run's Playwright report and traces are uploaded as the
  `contracts-failure-<run-id>` artifact. Download it and read the failure before re-running; the
  same failure reproduces locally with
  `cd apps/docs && pnpm exec playwright test contracts.spec.ts -g "<route>"`.
- Deploy "Asset too large" → a page exceeds Cloudflare's 25 MiB limit; the deploy log names
  it. Usually Story-controls type explosion — see `apps/docs/components/stories/story-shims.tsx`.
- A self-hosted job is queued with no runner → both `vsk-runners-mac-mini` minis are busy or offline.
  Nothing to fix in the repository; check the runners.

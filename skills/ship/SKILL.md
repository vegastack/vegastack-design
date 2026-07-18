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

```bash
git status --porcelain          # must be empty
pnpm lint && pnpm typecheck && pnpm test
pnpm registry:build             # must be idempotent: git status stays clean after
node tooling/changelog-lint.mjs
```

Component/visual changes also need committed VRT baselines — see
[references/vrt-baselines.md](references/vrt-baselines.md) if the pixel gate is red
or a new page/route was added.

## 2. Changesets (one per user-visible package change)

```bash
pnpm changeset
```

- `@vegastack/design` / `@vegastack/design-tokens`: patch = fix, minor = feature (pre-1.0).
- `@vegastack/ui` (private): bump minor for any registry item add/change — its version
  becomes every item's `meta.version`.
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

```bash
git push origin main            # MK approval required first
```

Watch runs by POLLING status (`gh run watch` can exit early):

```bash
until [ "$(gh run view <id> -R VegaStack/vegastack-design --json status --jq .status)" != "in_progress" ]; do sleep 60; done
```

The Release workflow (path-routed: pixel gate only for component-visual changes) opens the
**Version Packages** PR. Review it: package versions, `version-sync` stamped item versions,
regenerated `public/r`. Merge it. The merge run publishes npm packages via OIDC — no tokens,
nothing to do. Verify:

```bash
npm view @vegastack/design version
```

## 5. Deploy the registry + docs

```bash
gh workflow run deploy.yml -R VegaStack/vegastack-design   # MK approval required first
```

Wait for success. The run self-verifies the Access boundary; confirm its log shows all three:

```
✓ docs gated (anonymous → 302)
✓ /r/* rejects anonymous (→ 403)
✓ /r/* accepts the service token (→ 200)
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
  main (`docs/RELEASING.md` § Known edge).
- Pixel gate red on pages you edited → baselines are stale:
  [references/vrt-baselines.md](references/vrt-baselines.md).
- Deploy "Asset too large" → a page exceeds Cloudflare's 25 MiB limit; the deploy log names
  it. Usually Story-controls type explosion — see `apps/docs/components/stories/story-shims.tsx`.

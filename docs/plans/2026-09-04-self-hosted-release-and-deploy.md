# 2026-09-04 — Release and deploy entirely on self-hosted runners (no GitHub-hosted)

> Point-in-time record. Preserved as the historical decision. For current behaviour, see AGENTS.md
> § Locked decisions, `docs/RELEASING.md`, and `tooling/verify-workflow-security.mjs`.

## Problem

An account-level GitHub billing lock suspended all GitHub-hosted Actions runners (hosted jobs start
with zero steps executed). Five jobs ran on `ubuntu-latest` and could no longer execute:

- `release.yml` → `package-build`, `publish`
- `deploy.yml` → `sign-curated`, `deploy-curated`, `verify-public-boundary`

So npm releases and registry/docs deploys were stuck, with new components already merged to `main`
(PR #26, audio-player) and a `@vegastack/design` patch publish due. Goal: move the **entire** pipeline
onto the self-hosted mac-mini pool so any team member can release and deploy with **zero** GitHub-
hosted dependency, changing nothing else.

## Decision (MK, 2026-09-04)

Every job in every workflow runs on `[self-hosted, vsk-runners-mac-mini]`. Reuse the existing pool; no
new runner label. The boundary probe runs on the same pool.

This mirrors sibling repo **`vegastack/vegafactory`**, which publishes to npm this exact way —
`runs-on: [self-hosted, vsk-runners-mac-mini]`, token-free OIDC trusted publishing, `--no-provenance`.

### Empirical proof (this overrides npm's docs)

npm's published docs still say _"Self-hosted runners are not currently supported"_ for trusted
publishing (verified 2026-09-04 at <https://docs.npmjs.com/trusted-publishers/>). **That is stale.**
vegafactory publishes as `@vegastack/skills` (its name before a rename to `@vegastack/vegafactory`,
which is why the new name reads 404 — a rename needs a fresh first-publish bootstrap). On npm,
`@vegastack/skills` shows:

| version | npm publish time (UTC) | matching self-hosted `release.yml` run | attestations |
| ------- | ---------------------- | -------------------------------------- | ------------ |
| 0.16.1  | 2026-09-01T08:20:18    | run started 08:19:43 → success         | none         |
| 0.16.2  | 2026-09-01T13:52:18    | run started 13:51:51 → success         | none         |
| 0.17.0  | 2026-09-01T18:44:11    | run started 18:43:45 → success         | none         |

Real packages, on the public registry, published from self-hosted runners via token-free OIDC, ~35s
after each run started, with no provenance. Empirical reality outranks the docs (truth hierarchy):
self-hosted OIDC trusted publishing works; only the provenance _bundle_ needs a GitHub-hosted runner.

### The correction that shaped this

An earlier draft assumed the npm docs were current and switched publishing to a long-lived
`NPM_TOKEN`. The `@vegastack/skills` evidence above disproves that: publishing stays token-free OIDC —
no new secret, no package-setting change, no security downgrade — and simply disables provenance.

### Why each move is safe

- **npm publish → keep OIDC trusted publishing, disable provenance with the `--no-provenance` flag.**
  `publish` keeps the `id-token` permission and the repository + `release.yml` trusted-publisher
  identity. Provenance must be off because trusted publishing auto-enables it and npm rejects a
  provenance bundle built on a self-hosted runner (**E422**). Because the repo is now public, npm DOES
  attempt provenance (unlike when it was private) — and `NPM_CONFIG_PROVENANCE=false` is NOT honoured by
  the changesets action's OIDC path, so the publish step calls `npm publish --no-provenance` directly,
  as vegafactory does. Releases ship without an attestation while hosted runners are billing-locked.
  No `NPM_TOKEN` exists.
- **Sigstore signing keeps GitHub OIDC.** GitHub OIDC (unlike a hosted-only provenance bundle) is
  minted by the Actions control plane and works on self-hosted runners. The signer certificate
  identity is the workflow ref (`deploy.yml@refs/heads/main`), independent of runner, so the `cosign
verify-blob` identity pinned in `apps/docs/scripts/probe-deployment.mjs` and re-checked in
  `deploy-curated` is unchanged.
- **`deploy-curated`** is credential-only Wrangler; nothing is runner-specific.
- **Boundary probe on the minis.** Its proof needs an outside-the-network origin, so the minis must
  not be enrolled in Cloudflare Access device posture / WARP. Fail-safe if they were: an authenticated
  "anonymous" `/r/*` request returns 200 and `expectProtected` fails the deploy loudly.

## Changes

- `.github/workflows/release.yml` — all jobs → self-hosted; `publish` keeps the `id-token` permission,
  holds no token, and publishes each public package with `npm publish --no-provenance`. The separate
  `package-build` job was **removed** and its build folded into `publish`: the billing lock also
  exhausts Actions artifact storage, so the cross-job `upload-artifact`/`download-artifact` hand-off
  failed (quota, then ETIMEDOUT). With token-free OIDC there is no credential to isolate from the
  build, so building in the publish job is safe. The changesets action publish was replaced with a
  direct per-package `npm publish` loop so the `--no-provenance` flag can be passed (changeset publish
  cannot forward it); this trades away automatic git-tag/GitHub-release creation.
- `.github/workflows/deploy.yml` — all jobs → self-hosted. `build-curated` + `sign-curated` +
  `deploy-curated` were **merged into one `build-sign-deploy` job** for the same artifact-storage
  reason (they passed the built docs between jobs as artifacts). `verify-public-boundary` re-fetches
  from prod and stays separate.
- `tooling/verify-workflow-security.mjs` — `GITHUB_HOSTED_JOBS` all empty; deploy.yml OIDC in the one
  `build-sign-deploy` job; new rules: no `NPM_TOKEN`/`NODE_AUTH_TOKEN` anywhere, and `publish` must
  call `npm publish --no-provenance`.
- `tooling/verify-workflow-security-negative.mjs` — publish-onto-ubuntu, provenance-re-enabled,
  npm-token-reintroduced, and the boundary-probe cases (18 total).
- Docs — AGENTS.md § Status + § Locked decisions; `docs/RELEASING.md`; `skills/internal/ship`.

## Prerequisites

**None.** The Trusted Publisher entries already exist (design already published via OIDC), so no
`NPM_TOKEN`, no npmjs.com setting change. The only operational requirement is that the mac minis reach
`registry.npmjs.org` + the Cloudflare API, can install cosign on macOS, and are **not** enrolled in
Cloudflare Access / WARP (boundary probe).

## Verification

Static: `node tooling/verify-workflow-security.mjs`, `node tooling/verify-workflow-security-negative.mjs`,
`pnpm lint`, `pnpm design:derived && git status --porcelain`.

End-to-end (MK-gated): land the fix (version-pr path runs, no publish) → merge Version PR (publish on
a mini, token-free OIDC, provenance off; confirm `npm view` bump and no attestations) → dispatch
`deploy.yml` (sign + deploy + boundary all on minis) → downstream `vegastack-design check-updates` /
`npm update` in `~/code/vegastack-design-starter`.

## What actually broke, and the fixes (in order)

The first publish attempts surfaced two blockers not visible until CI ran on the minis:

1. **Actions artifact storage is exhausted** under the billing lock. `package-build`'s
   `upload-artifact` failed (`quota`, then `ETIMEDOUT`), so `publish` never got the dist. Fix: remove
   the cross-job artifact — build in the `publish` job. Same fix applied to `deploy.yml` (merged into
   `build-sign-deploy`).
2. **Provenance E422 on the now-public repo.** Making the repo public re-enabled npm provenance
   generation (it was skipped while private). Under trusted publishing npm attached a provenance
   bundle and the registry rejected it: `E422 ... Unsupported GitHub Actions runner environment:
"self-hosted"`. Crucially, **`NPM_CONFIG_PROVENANCE=false` did NOT suppress it** through the
   changesets action's OIDC path. Fix: replace `changeset publish` with a direct per-package
   `npm publish --access public --no-provenance` loop (the explicit flag vegafactory uses), which npm
   does honour. Trade-off: no automatic git tags / GitHub releases from changesets.

Provenance is therefore intentionally off until hosted runners return; a public repo could otherwise
carry it.

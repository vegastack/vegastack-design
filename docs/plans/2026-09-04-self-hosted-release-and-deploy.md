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
`runs-on: [self-hosted, vsk-runners-mac]`, token-free OIDC trusted publishing, `--no-provenance`.

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

- **npm publish → keep OIDC trusted publishing, disable provenance.** `publish` keeps `id-token:
write` and the repository + `release.yml` trusted-publisher identity. It sets
  `NPM_CONFIG_PROVENANCE=false` because trusted publishing auto-enables provenance and its bundle
  can't be built on a mini. No attestation is lost: `@vegastack/design@0.3.1` (published from
  `ubuntu-latest`) already carries none, because the source repo is private. No `NPM_TOKEN` exists.
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

- `.github/workflows/release.yml` — `package-build` + `publish` → self-hosted; `publish` keeps
  `id-token: write`, holds no token, and sets `NPM_CONFIG_PROVENANCE: "false"` on the changesets
  publish step.
- `.github/workflows/deploy.yml` — `sign-curated` (keeps `id-token: write`), `deploy-curated`,
  `verify-public-boundary` → self-hosted.
- `tooling/verify-workflow-security.mjs` — `GITHUB_HOSTED_JOBS` all empty; release.yml OIDC count
  stays 1 (publish); new rules: no `NPM_TOKEN`/`NODE_AUTH_TOKEN` anywhere, and `publish` must set
  `NPM_CONFIG_PROVENANCE=false`.
- `tooling/verify-workflow-security-negative.mjs` — publish-onto-ubuntu, provenance-re-enabled, and
  npm-token-reintroduced mutations (18 cases total).
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

## Residual risk (low) to confirm on the first release

Two small differences from vegafactory, both low-risk:

1. **Design is a PRIVATE source repo** (vegafactory/`@vegastack/skills` is public). npm does not
   generate provenance for a private-repo package at all — `@vegastack/design@0.3.1`, published from
   `ubuntu-latest` trusted publishing, already carries no attestations. So provenance is very likely
   never even attempted here, and `NPM_CONFIG_PROVENANCE=false` is a belt-and-suspenders no-op rather
   than load-bearing. Either way the publish should succeed.
2. **Design uses `pnpm changeset publish`, not raw `npm publish --no-provenance`.** The env var
   `NPM_CONFIG_PROVENANCE=false` maps to the same npm config the flag sets. If — against expectation —
   the first `publish` fails with a provenance error, the explicit fallback is `provenance = false` in
   the publish `.npmrc` or `publishConfig.provenance: false` in both public package.json files.

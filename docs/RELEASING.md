# Releasing — shipping component & package updates

How VegaStack ships updates from this **private** GitHub repo, and how downstream pulls them. Two
distribution channels, both already wired:

- **npm packages** (`@vegastack/design` + `@vegastack/design-tokens`) → prepared by `release.yml`
  (changesets) on push to `main`, then published after the reviewed **Version Packages** PR is
  merged, via **npm OIDC trusted publishing** (same pattern as vegastack-cli): no `NPM_TOKEN`
  secret exists and the account keeps 2FA. npm does not emit
  provenance attestations from a private source repository, so these releases deliberately do not
  claim one; OIDC authentication remains short-lived and workflow-bound. One-time setup: each package
  on npmjs.com has a Trusted Publisher entry
  → GitHub Actions → `vegastack/vegastack-design` → `release.yml`. (The very first 0.1.0 publish
  was done locally with `pnpm -r publish` + OTP, since a trusted-publisher entry can only be added
  to an existing package.) The trusted-publisher identity is repository + `release.yml`, with no
  GitHub environment name—the exact identity proven by the 0.1.1 publish. Consumers get these via
  `npm update` (semver).
- **Component registry** (`/r/*.json`) → built, **Sigstore-signed**, and deployed to Cloudflare by
  `deploy.yml` (manual `workflow_dispatch`). Consumers **pull** updates with `shadcn add` — copy-in,
  so there is **no auto-push** (that's the shadcn model; whole-item integrity/content is the update
  signal, with a preserved provenance header used only as an optional fast path).

> The registry is **not** served from the private GitHub repo directly — shadcn's `owner/repo/item`
> address form doesn't support private repos. GitHub is the source; the signed `/r/*` is served from
> Cloudflare (`design.vegastack.com/r/`) behind Cloudflare Access service tokens.

## Release a component update (maintainer)

1. Edit the **canonical** source only: `packages/ui/registry/ui/<name>.tsx`.
2. `npm run registry:build` — regenerates the docs copy-in + per-item JSON and **re-stamps the
   SHA-256 integrity + provenance header**. The changed hash is the machine-readable "this changed"
   signal consumers' `vegastack-design check-updates` reads.
3. `pnpm changeset` — bump `@vegastack/ui` (and any other changed package). **List the affected
   component name(s) in the summary** — `@vegastack/ui`'s generated `CHANGELOG.md` is the
   consumer-facing "what changed per version".
4. PR → review → merge to `main`. `release.yml` runs the full unprivileged gate (typecheck, lint,
   test, all-browser smoke, build, `registry:build` idempotency, `registry:verify-consume`), plus
   the 768-check component contract suite when the visual surface changed. A
   changeset-bearing run then uses its non-OIDC version job to update the **Version Packages** PR.
   Review its package versions, generated changelogs, registry item versions, and regenerated
   `/r/*`; merging that PR is the separate human action that authorizes the next main run's isolated
   npm OIDC publish job. The private source repository means npm provenance attestations are
   unavailable even though trusted publishing itself is supported.
5. **Publish the registry**: run the **Deploy** workflow (`deploy.yml`, manual, from `main`). It
   builds/tests without credentials, uploads a validated artifact, signs it in the only OIDC-capable
   job, and reverifies it in the credential-only job before pinned Wrangler uses the existing
   repository Cloudflare secrets. The manual dispatch is the explicit outward-deploy approval.
   Before the public-docs cutover the live probe requires broad root SSO plus service-token-only
   `/r/*`; after cutover it requires anonymous public docs, SSO-only `/internal/*`, and
   service-token-only `/r/*`. The new registry versions are then _available_—consumers still pull
   them.

This is the approved GitHub Team/private-repository operating model. Required-reviewer environment
protection is unavailable on this plan, so releases do not depend on GitHub Environments or change
the proven npm trusted-publisher identity. Independent review belongs at the change PR and Version
Packages PR; MK may initiate a run, but every changeset push, Version PR merge, deploy dispatch, and
cutover phase remains a separate explicit MK decision under the `ship` skill.

Docs/deployment-only changes do not require a package changeset, version bump, or npm publish. Keep
workflow changes out of a changeset-bearing push if package work unexpectedly becomes necessary.

## Where the jobs run

Non-browser jobs run on the self-hosted mac minis (`runs-on: [self-hosted, vsk-runners-mac-mini]`):
`release.yml`'s `changes` and `version-pr`, and `deploy.yml`'s `ref-guard` and `build-curated`.
Everything else is pinned to `ubuntu-latest` by an allowlist enforced in
`tooling/verify-workflow-security.mjs`, for four distinct reasons:

- **Browsers** — all of `ci.yml`, plus `contracts-gate` in `release.yml`/`deploy.yml` and
  `quality-gate`. The minis cannot launch Chromium: their runner has no per-user Mach bootstrap
  namespace, so launches die with `bootstrap_look_up
  org.chromium.Chromium.MachPortRendezvousServer.1: Unknown service name (1102)` and SIGTRAP.
  Deterministic on both minis in run `30131471680`; the same suite passes locally on the same OS and
  CPU. **The fix is on the host** — reinstall the Actions runner as a LaunchAgent inside a logged-in
  session instead of a LaunchDaemon. Then move those five jobs back by editing `GITHUB_HOSTED_JOBS`.
- **`release.yml` `publish`** — npm trusted publishing does not support self-hosted runners
  (<https://docs.npmjs.com/trusted-publishers/>) and this repository holds no `NPM_TOKEN`.
- **`deploy.yml` `sign-curated` and `deploy-curated`** — the OIDC signing job and the credential-only
  Cloudflare deploy. Neither executes repository code; both are ~1 minute.
- **`deploy.yml`'s three boundary jobs** — `pre-cutover-purge`, `verify-protected-boundary`, and
  `verify-public-boundary` assert that ANONYMOUS requests are rejected. A runner inside VegaStack's
  network can be silently authenticated by Cloudflare device posture, which would void the proof. A
  boundary test has to originate outside the trusted network.

Job containers are banned on the self-hosted jobs — Linux-only, they cannot start on macOS. A
GitHub-hosted job may use one, digest-pinned to the Playwright image: `quality-gate` needs it because
bare `ubuntu-latest` WebKit could not settle the compiled-CSS Toaster contrast check.

**Screenshots are not part of CI.** Pixel comparison is a local `/ship` step —
`node tooling/vrt-review.mjs` — reviewed by a human. Rationale and evidence:
`docs/ledger/operator-review.md`, 2026-07-25.

### Versioning model

`meta.version` on every registry item = `@vegastack/ui`'s package version (global). A bump moves all
items to the same number; `check-updates` compares by **integrity hash**, so a component only reports
an update when its content actually changed (no false positives from the global bump). The changeset
summary + `@vegastack/ui` CHANGELOG tell consumers _which_ components moved.

## Receive an update (downstream)

See `apps/docs/content/docs/install.mdx` → "Updating components". In short:

```bash
npx vegastack-design check-updates                       # what's stale
VEGASTACK_VERIFY_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vegastack-verify.XXXXXX")"
VEGASTACK_ITEM="$VEGASTACK_VERIFY_DIR/item.json"         # this file must not already exist
npx vegastack-design verify --save "$VEGASTACK_ITEM" <name>  # integrity preflight
VEGASTACK_EXPECTED_INTEGRITY="$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).meta.integrity)' "$VEGASTACK_ITEM")"
npx shadcn@latest add @vegastack/<name> --diff           # review
npx shadcn@latest add @vegastack/<name> --overwrite      # apply (re-apply local edits)
npx vegastack-design verify --post-write --item "$VEGASTACK_ITEM" --expected-integrity "$VEGASTACK_EXPECTED_INTEGRITY" --target-dir .
```

## Future (not yet built)

- Scheduled CI bot: `check-updates --fail-on-update --json` → opens a "design-system updates" PR.
- npm path for animated icons (`@vegastack/design/icons` animated mirrors) so they update via `npm update`.
- Per-item independent semver instead of the global `@vegastack/ui` version.

## Known edge: workflow files + the Version PR

The Actions `GITHUB_TOKEN` cannot push changes to `.github/workflows/*`. The Version PR now uses the
Changesets action's GitHub-API commit mode and a non-persisted checkout token, but a release run's
commit has workflow files that differ from the current `main` tip (e.g. a workflow edit landed
right after it, or the same push carries both a changeset AND a workflow change), the changesets
action's `changeset-release/main` branch push is rejected with
`refusing to allow a GitHub App to … update workflow … without 'workflows' permission`.
**Fix:** re-run the Release workflow on the current `main` tip (or push any no-op commit) — a run
whose base matches main has no workflow diff and the Version PR push succeeds. Avoid bundling
workflow edits with changeset-bearing pushes.

Downstream lifecycles (who gets updates and how, handover model): the public Guides plus the
SSO-protected `/internal/*` operations pages.

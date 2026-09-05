# Releasing — shipping component & package updates

How VegaStack ships updates from this **private** GitHub repo, and how downstream pulls them. Two
distribution channels, both already wired:

- **npm packages** (`@vegastack/design` + `@vegastack/design-tokens`) → prepared by `release.yml`
  (changesets) on push to `main`, then published after the reviewed **Version Packages** PR is merged,
  via **npm OIDC trusted publishing** — token-free, and running on the **self-hosted mac minis**. npm
  trusted publishing works on self-hosted runners; only the provenance _bundle_ requires a
  GitHub-hosted runner, so `publish` sets `NPM_CONFIG_PROVENANCE=false`. No attestation is lost anyway:
  npm emits no provenance from a private source repository (published dists have never carried one).
  **No `NPM_TOKEN` exists** and the account keeps 2FA. One-time setup (already done): each package on
  npmjs.com has a Trusted Publisher entry → GitHub Actions → `vegastack/vegastack-design` →
  `release.yml`; identity is repository + `release.yml`, no GitHub environment. (The very first 0.1.0
  publish was done locally with `pnpm -r publish` + OTP, since a trusted-publisher entry can only be
  added to an existing package.) npm's public docs claim self-hosted is unsupported for trusted
  publishing, but that is stale: sibling repo `vegastack/vegafactory` publishes as `@vegastack/skills`,
  whose 0.16.1–0.17.0 landed on npm from self-hosted runs (2026-09-01), token-free OIDC, no
  attestations — the empirical proof it works. Consumers get these via `npm update` (semver).
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
   the 864-check component contract suite when the visual surface changed. A
   changeset-bearing run then uses its version job to update the **Version Packages** PR.
   Review its package versions, generated changelogs, registry item versions, and regenerated
   `/r/*`; merging that PR is the separate human action that authorizes the next main run's isolated
   npm OIDC publish job, which runs on a mini token-free via trusted publishing (provenance disabled).
   The private source repository means npm provenance attestations are unavailable regardless, so none
   is claimed.
5. **Publish the registry**: run the **Deploy** workflow (`deploy.yml`, manual, from `main`). It
   builds/tests without credentials, uploads a validated artifact, signs it in the only OIDC-capable
   job, and reverifies it in the credential-only job before pinned Wrangler uses the existing
   repository Cloudflare secrets. The manual dispatch is the explicit outward-deploy approval.
   The live probe requires every non-registry route to be anonymously reachable, requires
   `/internal/*` to remain unlisted with `noindex`/`no-store`, and requires `/r/*` to reject
   anonymous requests while accepting the service token. It also proves the representative live
   registry item's exact version, integrity hash, and signed-manifest membership. The new registry
   versions are then _available_—consumers still pull them.

This is the approved GitHub Team/private-repository operating model. Required-reviewer environment
protection is unavailable on this plan, so releases do not depend on GitHub Environments or change the
proven repository + `release.yml` trusted-publisher identity; publishing is gated by the reviewed
Version PR merge. Independent review belongs at the change PR and Version Packages PR; MK may initiate a
run, but every changeset push, Version PR merge, and deploy dispatch remains a separate explicit MK
decision under the `ship` skill.

Docs/deployment-only changes do not require a package changeset, version bump, or npm publish. Keep
workflow changes out of a changeset-bearing push if package work unexpectedly becomes necessary.

## Where the jobs run

**No CI runner executes a browser.** The browser-unit suite, the cross-engine smoke, the three-engine
suite, and the 864 behaviour contracts run on a developer machine — scoped in `.husky/pre-push`, in
full under `pnpm gates:ship` — and each run writes `.gates/receipt.json`, bound to a git tree hash of
the working tree with `.gates/` excluded. Every workflow has a `receipt-guard` job that rejects a push
whose receipt does not cover the pushed tree. A receipt is **attestation, not proof**; see
`tooling/lib/gate-receipt.mjs` and AGENTS.md § Locked decisions for exactly what that does and does
not buy.

**Every job runs on the self-hosted mac minis** (`runs-on: [self-hosted, vsk-runners-mac-mini]`) —
`ci.yml`, `release.yml`, and `deploy.yml` in full. **A pull request, a release, and a deploy each cost
zero billable minutes.** No job is GitHub-hosted; the empty allowlist is enforced in
`tooling/verify-workflow-security.mjs` and negative-tested in
`tooling/verify-workflow-security-negative.mjs`, which rejects a move back onto `ubuntu-latest` in
either direction. Five jobs used to be hosted; each moved without losing a property that existed:

- **`release.yml` `package-build`** — its own job that builds the two public dists into a validated
  artifact so `publish` consumes bytes and runs no repository build code itself. ~4 minutes, no
  browsers, no container.
- **`release.yml` `publish`** — token-free npm OIDC **trusted publishing**, which works on self-hosted
  runners. Only the provenance _bundle_ requires a GitHub-hosted runner, so it sets
  `NPM_CONFIG_PROVENANCE=false` (no attestation is lost — a private source repo emits none anyway). It
  runs no repository code — it only downloads the validated artifact and runs `changeset publish`. No
  `NPM_TOKEN` is involved.
- **`deploy.yml` `sign-curated`** — keeps GitHub OIDC (Sigstore keyless signing). GitHub OIDC is
  minted by the Actions control plane and works on self-hosted runners, and the signer certificate
  identity is the workflow ref (`deploy.yml@refs/heads/main`), not the runner, so `cosign verify-blob`
  is unaffected.
- **`deploy.yml` `deploy-curated`** — credential-only Cloudflare deploy; nothing is runner-specific.
- **`deploy.yml` `verify-public-boundary`** — asserts every non-registry route is anonymously
  reachable and anonymous `/r/*` requests are rejected. Its proof depends on originating **outside**
  the trusted network, so the minis must **not** be enrolled in Cloudflare Access device posture /
  WARP. This is fail-safe if they were: an authenticated "anonymous" `/r/*` request would return 200
  and the probe (`apps/docs/scripts/probe-deployment.mjs`, `expectProtected`) would fail the deploy
  loudly, not pass falsely.

Job containers are banned outright. They are Linux-only and cannot start on the minis, and the one job
that legitimately needed one — the three-engine suite in the digest-pinned Playwright image, because
bare `ubuntu-latest` WebKit could not settle the compiled-CSS Toaster contrast check — no longer runs
in CI. That suite takes 1m39s locally.

The minis still cannot launch Chromium (no per-user Mach bootstrap namespace; `bootstrap_look_up
org.chromium.Chromium.MachPortRendezvousServer.1: Unknown service name (1102)` and SIGTRAP,
reconfirmed in run `30150905149`). Under this topology that blocks nothing. Fixing it — reinstall the
Actions runner as a LaunchAgent inside a logged-in session — is optional, and worth doing only if you
later want a second machine independently re-running the browser lanes.

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

Downstream lifecycles (who gets updates and how, handover model): the public Guides plus the public,
unlisted/noindex `/internal/*` operations pages.

# Releasing — shipping component & package updates

**This file is the reference; `skills/internal/ship/SKILL.md` is the procedure.** The ship skill owns
the ordered steps an agent or a maintainer follows, and defers to this file for what the topology
actually is — where jobs run, how publishing authenticates, what the changelog system is, and what a
consumer does downstream. When the two disagree, the enforcing script wins over both.

How VegaStack ships updates from this **public** GitHub repo, and how downstream pulls them.
`gh repo view --json visibility` is the authority and answers `PUBLIC`; the repository was made
public before the 0.3.x releases, and what is private is the **registry**, not the source. Two
distribution channels, both already wired:

- **npm packages** (`@vegastack/design` + `@vegastack/design-tokens`) → prepared by `release.yml`
  (changesets) on push to `main`, then published after the reviewed **Version Packages** PR is merged,
  via **npm OIDC trusted publishing** — token-free, and running on the **self-hosted mac minis**. npm
  trusted publishing works on self-hosted runners; only the provenance _bundle_ requires a
  GitHub-hosted runner (npm rejects a self-hosted one with **E422**), so `publish` calls
  `npm publish --no-provenance` directly — the `NPM_CONFIG_PROVENANCE` env is not honoured by the
  changesets action's OIDC path. **Provenance is off because the runner is self-hosted, not because
  of repository visibility** — a public repo is exactly what makes provenance possible in principle,
  and a hosted runner could attach it, but hosted runners are billing-locked. Releases therefore ship
  without an attestation, and none is claimed anywhere.
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

> The registry is **not** served from GitHub. The source repo is public, so serving `/r/*` from it
> would make the registry public too — the access boundary is Cloudflare's, not GitHub's. The signed
> `/r/*` is served from Cloudflare (`design.vegastack.com/r/`) behind Cloudflare Access service
> tokens, which is what keeps the component registry private while the source is not.

## Release a component update (maintainer)

1. Edit the **canonical** source only: `packages/ui/registry/ui/<name>.tsx`.
2. `npm run registry:build` — regenerates the docs copy-in + per-item JSON and **re-stamps the
   SHA-256 integrity + provenance header**. The changed hash is the machine-readable "this changed"
   signal consumers' `vegastack-design check-updates` reads.
3. `pnpm changeset` — bump `@vegastack/ui` (and any other changed package). **The summary opens
   with one of the eight root-CHANGELOG section emoji** (`🧩 🔧 🗑 🛠 📦 📚 🐛 ⚠️`) and **lists the
   affected component name(s)** — the marker selects the section the release entry will place the
   line under, and the rest is the consumer-facing "what changed per version" in
   `@vegastack/ui`'s generated `CHANGELOG.md`. `tooling/changeset-lint.mjs` (in `pnpm lint`)
   rejects a body with no marker, two markers, or no text. **The changeset is the only changelog
   artefact a PR writes; `/CHANGELOG.md` is not hand-edited between releases.**
4. PR → review → merge to `main`. `release.yml`'s unprivileged `quality-gate` runs `pnpm verify` —
   the same command a developer runs — on the LAN Linux runners in the pinned Playwright container. A
   changeset-bearing run then uses its version job to update the **Version Packages** PR.
   Review its package versions, generated changelogs, the assembled root `CHANGELOG.md` entry and
   the regenerated docs Changelog page, registry item versions, and regenerated `/r/*`; merging that PR is the separate human action that authorizes the next main run's isolated
   npm OIDC publish job, which runs on a mini token-free via trusted publishing (provenance disabled
   because the runner is self-hosted — npm rejects a self-hosted provenance bundle with E422 — not
   because of repository visibility). **No git tag and no GitHub release is created**; see
   § Tags and GitHub releases below.
5. **Publish the registry**: run the **Deploy** workflow (`deploy.yml`, manual, from `main`). One
   job, `build-sign-deploy`, builds and verifies the export, signs the curated manifest (Sigstore
   keyless over GitHub OIDC), re-verifies the signature, and only then lets pinned Wrangler use the
   existing repository Cloudflare secrets. The manual dispatch is the explicit outward-deploy
   approval.
   The live probe requires every non-registry route to be anonymously reachable, requires
   `/internal/*` to remain unlisted with `noindex`/`no-store`, and requires `/r/*` to reject
   anonymous requests while accepting the service token. It also proves the representative live
   registry item's exact version, integrity hash, and signed-manifest membership. The new registry
   versions are then _available_—consumers still pull them.

This is the approved operating model for a **public** repository on a GitHub Team plan whose hosted
runners are billing-locked. Required-reviewer environment protection is unavailable on this plan, so
releases do not depend on GitHub Environments or change the proven repository + `release.yml`
trusted-publisher identity; publishing is gated by the reviewed Version PR merge. Independent review belongs at the change PR and Version Packages PR; MK may initiate a
run, but every changeset push, Version PR merge, and deploy dispatch remains a separate explicit MK
decision under the `ship` skill.

Docs/deployment-only changes do not require a package changeset, version bump, or npm publish. Keep
workflow changes out of a changeset-bearing push if package work unexpectedly becomes necessary.

## Where the jobs run

**CI executes the browser lanes.** `ci.yml`'s `verify`, `release.yml`'s `quality-gate`, and
`deploy.yml`'s `verify` each run `pnpm verify` — typecheck, lint, `design:verify`, and the
`@vegastack/ui` browser suite including the geometry contracts — on the LAN Linux runners inside the
pinned Playwright container. `deploy.yml` adds `pnpm verify:release` (docs export, links, metadata,
the docs-shell contracts over that export plus their self-test, registry build and idempotency, the
shadcn consume round-trip, and the complete suite in all three engines) before `build-sign-deploy`
starts.

None of that ran in CI before 2026-09-08, when the browser lanes were attested rather than executed;
that whole mechanism was removed by `docs/plans/2026-09-08-verification-rebuild.md`, and the history
is in `docs/ledger/operator-review.md`, 2026-09-09.

**Every job runs on self-hosted hardware** — the mac minis
(`runs-on: [self-hosted, vsk-runners-mac-mini]`) for everything that needs a credential rather than a
browser, and the LAN Linux boxes (`[self-hosted, linux, vsk-runner]`) for the three verification jobs
above. **A pull request, a release, and a deploy each cost zero billable minutes.** No job is
GitHub-hosted; the empty allowlist is enforced in `tooling/verify-workflow-security.mjs` and
negative-tested in `tooling/verify-workflow-security-negative.mjs`, which rejects a move back onto
`ubuntu-latest` in either direction. Five jobs used to be hosted; each moved without losing a property
that existed:

- **`release.yml` `publish`** — token-free npm OIDC **trusted publishing**, which works on self-hosted
  runners. Only the provenance _bundle_ requires a GitHub-hosted runner, so it sets
  `npm publish --no-provenance` (npm rejects a self-hosted provenance bundle with E422; hosted runners
  that could attach one are billing-locked). It builds the two public packages in-job and publishes
  them directly. No `NPM_TOKEN` is involved. (A
  separate `package-build` job that handed the dist over as an artifact was removed: with token-free
  OIDC there is no credential to isolate from the build, and Actions artifact storage is unavailable
  under the billing lock, so cross-job artifacts fail.)
- **`deploy.yml` `build-sign-deploy`** — one job that builds the export, signs the curated
  manifest (Sigstore keyless, GitHub OIDC), re-verifies it, and deploys with the Cloudflare credential.
  GitHub OIDC is minted by the Actions control plane and works on self-hosted runners, and the signer
  certificate identity is the workflow ref (`deploy.yml@refs/heads/main`), not the runner, so
  `cosign verify-blob` is unaffected. The three-job split (`build-curated` → `sign-curated` →
  `deploy-curated`) was folded into this one job on 2026-09-05 because Actions artifact storage is
  unavailable under the billing lock; restore the split once it is.
- **`deploy.yml` `verify-public-boundary`** — asserts every non-registry route is anonymously
  reachable and anonymous `/r/*` requests are rejected. Its proof depends on originating **outside**
  the trusted network, so the minis must **not** be enrolled in Cloudflare Access device posture /
  WARP. This is fail-safe if they were: an authenticated "anonymous" `/r/*` request would return 200
  and the probe (`apps/docs/scripts/probe-deployment.mjs`, `expectProtected`) would fail the deploy
  loudly, not pass falsely.

Job containers are **required** on the Linux runners and impossible on the minis. A container is
Linux-only and cannot start on macOS at all; on the Linux boxes the pinned
`mcr.microsoft.com/playwright` image (tag derived from `pnpm-lock.yaml`) is what makes a box
interchangeable, so `tooling/verify-workflow-security.mjs` requires it there and rejects it
everywhere else, with the negative harness proving both halves by mutation. The minis still cannot
launch a browser, which under this topology blocks nothing; fixing it — reinstalling their Actions
runner as a LaunchAgent inside a logged-in session — is optional, and worth doing only if you later
want a second machine independently re-running the browser lanes.

**Screenshots are not part of anything.** The pixel-capture lane was removed on 2026-09-08 with the
rest of the attestation stack; the blocking visual-surface gate is
`packages/ui/test/geometry.browser.test.tsx` inside `pnpm verify`, which takes no screenshots.
Rationale and evidence: `docs/ledger/operator-review.md`, 2026-07-25 and 2026-09-09.

### The changelog

Two files, one direction, and no per-PR hand edit:

```
.changeset/*.md  --changelog-assemble-->  /CHANGELOG.md  --sync-changelog-->  docs/changelog.mdx
```

Per PR, the changelog artefact is the **changeset**, whose body opens with a section-vocabulary
emoji. Per version, `pnpm run version-packages` — `changelog-assemble`, then `changeset version`,
`version-sync`, `sync-changelog` — assembles the `## [x.y.z] — Month D, YYYY` entry at the top of
`/CHANGELOG.md`, groups the lines under the fixed sections, appends the `📦 npm` versions
from the release plan, and regenerates the docs page. The Version PR carries all of it.
`tooling/changelog-lint.mjs` still validates the assembled file (vocabulary, dates, descending
order, commit shas, docs links) inside the docs lint chain.

Rationale: `/CHANGELOG.md` is one list at the top of one file, so every branch editing it collided
with every other. `docs/plans/2026-09-08-verification-rebuild.md` R5.

### Versioning model

`meta.version` on every registry item = `@vegastack/ui`'s package version (global). A bump moves all
items to the same number; `check-updates` compares by **integrity hash**, so a component only reports
an update when its content actually changed (no false positives from the global bump). The changeset
summary + `@vegastack/ui` CHANGELOG tell consumers _which_ components moved.

### Tags and GitHub releases

**A release creates neither, deliberately.** `git tag` still shows `@vegastack/design@0.1.1` through
`@vegastack/design@0.3.1` and `@vegastack/design-tokens@0.2.0` — artefacts of the old
`changesets/action` publish path. That path was replaced on 2026-09-04 by a direct per-package
`npm publish --access public --no-provenance` loop, because the changesets action's OIDC path does
not honour `NPM_CONFIG_PROVENANCE` and npm rejected the self-hosted provenance bundle with E422
(`docs/plans/2026-09-04-self-hosted-release-and-deploy.md` § 2, where the loss of automatic tags and
GitHub releases is recorded as the accepted trade-off). Since then `packages/design` has published
0.3.2 with no tag, and there is no GitHub release for it.

Nothing consumes them, which is why the trade-off stands rather than being repaid:

- `/CHANGELOG.md` links **commits** (`.../commit/<sha>`), never tags; `tooling/changelog-lint.mjs`
  validates commit shas and docs links and knows nothing about tags.
- No script, workflow, skill, or docs page reads a tag, `refs/tags`, or a `releases/tag` URL — the
  only mention of tags anywhere in the tree is the trade-off note cited above.
- The published npm versions are themselves the immutable, verifiable release markers, and the
  registry has its own: `meta.integrity` plus the Sigstore-signed manifest.

So the tags that exist are historical residue, not a series with a gap in it; do not backfill them.
If a tag is ever genuinely wanted (a `git log <tag>..HEAD` range, a GitHub release page), that is a
new decision, and the fix is a step in `release.yml`'s `publish` job after the publish loop — not a
manual `git tag`, which would create a tag for a version that may not have reached npm.

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

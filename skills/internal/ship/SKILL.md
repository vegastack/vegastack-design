---
name: ship
description: Release VegaStack Design end to end — changesets, root CHANGELOG.md entry, version PR, npm OIDC publish (self-hosted), registry deploy, and verification. Use when asked to ship, release, publish, cut a version, or update the changelog for vegastack-design.
---

# Ship a VegaStack Design release

**MK-gated:** shipping is always MK's decision. Prepare everything, then STOP and present
the plan (versions, changelog entry, what deploys) and wait for an explicit "yes proceed"
BEFORE: pushing changesets, merging the Version PR, or dispatching deploy.yml. Never
auto-ship. Each gate is separate — approval to push is not approval to merge or deploy.

Run from the repo root. Every step is required unless marked optional. Never publish
manually — publishing is CI-only, token-free via OIDC trusted publishing, from the
self-hosted runners (provenance disabled; no `NPM_TOKEN`).

## 0. Release-chain preflight — run this FIRST

```bash
pnpm release:preflight        # ~5min, in place, restores the tree on exit
```

It simulates a version bump and runs the whole chain — version-sync, both authorities, and a full
`shadcn` consume round-trip. A release is a chain, and a defect anywhere fails all of it.

> **Stale under the verification rebuild.** `verify-release-chain.mjs` still asserts the receipt
> carry, which `docs/plans/2026-09-08-verification-rebuild.md` removed along with `.gates/`. It is
> scheduled for deletion in WP3; until then a failure in its receipt-carry step is the script being
> out of date, not the release being broken. Every other step of it is current.

**This exists because a release once took seven merge-and-watch cycles**, each one discovering the
next broken link ~25 minutes later. Five of those seven would have surfaced in this single run. If it
fails, read [references/release-gotchas.md](references/release-gotchas.md) — each entry has the
symptom, the cause, and the run id that found it.

Do not skip it because the change looks small. Most of those failures only appear on a MINOR bump;
the previous patch release exercised none of them.

## 1. Preflight

Refresh the contract-derived public inventory first. This regenerates the homepage component
catalog and counts alongside the contract route, matrix, and audit surfaces. If it changes files,
include those outputs with the component change before rerunning preflight; never hand-edit them.

```bash
pnpm design:derived
git status --porcelain          # must be empty — see below if it is not
pnpm verify                     # typecheck · lint · design:verify · browser suite · design CLI tests. ~2.5min.
pnpm verify:release             # BOTH docs matrices · links · registry · consume · 3 engines. ~7min.
node tooling/changelog-lint.mjs
```

**CI executes both of these itself.** `deploy.yml` runs `pnpm verify && pnpm verify:release` on the
LAN Linux runners in the pinned Playwright container before `build-sign-deploy` starts, so a deploy
cannot happen without them. Running them here is about finding a failure in two minutes instead of
twelve on a dispatched workflow — it is not the evidence, and there is no receipt to commit.

That is the change from the previous topology: `pnpm gates:ship` used to be the release's ONLY
evidence, because no CI runner could launch a browser, and its `.gates/receipt.json` had to be
committed with the release and had to describe exactly the pushed tree. Both the sweep command and
the receipt are gone (`docs/plans/2026-09-08-verification-rebuild.md`, R1). Failures are ordinary
command output now — the `gates` skill covers how to classify one at its root.

**If `git status` is not empty:** that is the signal, not an obstacle. Either the regenerated
surfaces above changed (commit them with the work that caused them) or there is unrelated
uncommitted work in the tree (finish or stash it). Never ship from a dirty tree — the version job
snapshots the pushed commit.

Then find out what the push will actually DO, before pushing:

```bash
node tooling/release-classify.mjs        # origin/main → HEAD
```

It extracts `release.yml`'s `detect` step verbatim and runs it, printing whether the quality gate
runs and whether the run opens a Version PR or publishes. Reconcile that against what you expect.
**A surprise here is the finding.** Exit 1 means the step left an output unset, which in an `if:`
reads as false, so the requirement it drives is silently RELAXED rather than failed.

Its `contracts` / `unit` / `smoke` outputs no longer drive anything: they existed to tell
`receipt-guard` which lanes the receipt had to carry, and CI now simply runs every lane. Read
`publish` and `has_changesets`; ignore the rest. (The classifier and this wrapper are both scheduled
for deletion in WP3.)

## 1a. What the gates cannot see

`pnpm lint` is thorough and will still pass while the release is wrong in two specific ways. Both
have shipped.

- **A claim about a gate that was never executed.** A workflow condition, an `if:`, an artifact
  upload, a `--reporter` flag — reading it is not verifying it. Execute it: run the shell, force the
  failure, check the artifact actually contains something. An upload step configured against a
  reporter that was never enabled collects nothing and reports success.
- **Prose that went stale.** `design.md` is truth-hierarchy #4 and `design:sync:check` only gates its
  DERIVED surfaces — it cannot tell that the doctrine now contradicts a component. If this release
  changes how a component behaves in a way `design.md` describes in prose, `design.md` is part of the
  release. So is the matching consumer-facing foundations page under
  `apps/docs/content/docs/foundations/`.
- **A verification result that describes a different tree.** This used to be enforced by binding a
  receipt to a tree hash. It no longer is — and it no longer needs to be, because CI re-runs
  `pnpm verify` against the pushed commit itself. What is still on you is the ordering: run the
  checks, then commit, then push, and read the CI result rather than assuming your local run stands
  in for it.

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
- Body: **opens with one of the eight CHANGELOG section emoji**, then one sentence, imperative,
  stating the consumer-visible effect. The marker selects the section the release entry will place
  it under; the rest lands verbatim in the package CHANGELOG. Exactly one marker per changeset — a
  change that belongs in two sections is two changesets.

```
---
"@vegastack/ui": minor
---

🔧 **Button** — `variant` × `tone` replaces fifteen hand-maintained variants.
```

`🧩 New components` · `🔧 Changed components` · `🗑 Removed / renamed` · `🛠 CLI & tooling` ·
`📦 npm` · `📚 Docs` · `🐛 Fixed` · `⚠️ Breaking`. An **empty** changeset (`---\n---`) with body
text is valid and IS assembled — that is how a tooling or CI change with no package bump still
gets a changelog line. `tooling/changeset-lint.mjs` (in `pnpm lint`) rejects a body with no
marker, two markers, or no text.

**Workflow edits and changesets — check the precondition before applying the workaround.** The
Actions `GITHUB_TOKEN` cannot push `.github/workflows/*`, so the standing advice is to land workflow
edits as their own PR first (`docs/RELEASING.md` § Known edge). That advice assumes `main` is
changeset-free. **Verify it — `git ls-tree --name-only origin/main .changeset/`.** If changesets are
already pending on `main`, the next Release run is changeset-bearing no matter what you do, splitting
your PR buys nothing, and you end up with a changeset-only PR describing already-merged code. Take
the recovery path below instead; it is one action. This was applied wrongly on 2026-07-25 precisely
because the rule was followed without checking the condition it depends on.

## 3. Root CHANGELOG.md entry — assembled, not written

**Nobody hand-edits `/CHANGELOG.md` between releases.** The release entry is assembled from the
pending changesets by `tooling/changelog-assemble.mjs`, once per version, inside
`pnpm run version-packages` — so a PR's only changelog artefact is its changeset, and branches stop
colliding on the top of one shared file. Format and conventions:
[references/changelog-format.md](references/changelog-format.md).

Preview what the next entry will say, and prove every pending changeset can be placed:

```bash
node tooling/changelog-assemble.mjs --dry-run   # print the entry; touch nothing
node tooling/changelog-assemble.mjs --check     # exit 1 if a changeset carries no section marker
node tooling/changelog-lint.mjs                 # vocabulary, dates, shas, doc links (on the file as it is)
```

Assembly runs BEFORE `changeset version` (which deletes the changesets it consumes) and takes the
heading version from `changeset status`, changesets' own release plan. It is idempotent: a version
whose `## [x.y.z]` heading already exists is not written twice. `--check` and assembly FAIL on a
changeset with no marker — including the pre-convention ones `changeset-lint` grandfathers — so fix
those before a release rather than at the version step.

A hand-written entry is still legitimate when a release needs prose no changeset carried (a
migration note, a summary paragraph): edit `/CHANGELOG.md`, then `node tooling/sync-changelog.mjs`.
It is the exception, not the per-PR obligation.

## 4. Version PR → publish

**The Version PR no longer needs a receipt carried forward.** `pnpm run version-packages` is
`changelog-assemble && changeset version && version-sync && sync-changelog` — assemble the release
entry, bump, re-stamp the registry, regenerate the docs Changelog page — and that is all it is. It used to end with
`tooling/gate-receipt-carry.mjs`, because a receipt was bound to a tree hash and `changeset version`
moves that hash — versions, package CHANGELOGs, consumed changesets, and a re-stamped provenance
header across ~1082 files — while changing nothing a browser gate can observe. Without a carry every
Version PR failed `receipt-guard` and no publish was reachable at all. CI now re-runs `pnpm verify`
against the Version PR's own commit, so the whole mechanism (`receipt-guard`, the carry, and the
`versionBumpOnly` proof it rested on) is deleted rather than replaced.

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

**A green PR page is not evidence the gates ran.** `main` carries no branch protection and no
required status checks (`gh api repos/VegaStack/vegastack-design/branches/main/protection` → 404), so
a red or skipped check does not block a merge. Read the run's job list and confirm the jobs you
expected actually executed — a skipped job looks identical to an absent one, and `quality-gate` (the
job that runs `pnpm verify`) is the one whose absence would matter most:

```bash
gh run view <id> -R VegaStack/vegastack-design --json jobs \
  --jq '.jobs[] | "\(.conclusion // .status)  \(.name)"'
```

The unprivileged Release quality gate runs first. A changeset-bearing run opens or updates the
**Version Packages** PR. Review its package versions, `version-sync` stamped item versions, generated
changelogs, and regenerated `public/r`. STOP for the separate MK approval, then merge it. The merge
run validates again and only the isolated publish job holds OIDC. Publishing runs on the self-hosted
minis, token-free via OIDC trusted publishing, calling `npm publish --no-provenance` directly (npm
accepts a provenance bundle only from a GitHub-hosted runner and rejects a self-hosted one with E422;
the `NPM_CONFIG_PROVENANCE` env is not honoured by the changesets action's OIDC path, so the flag is
used instead). No `NPM_TOKEN`, no GitHub environment. If `publish` fails with an E422 provenance error,
confirm the `--no-provenance` flag is still on the `npm publish` command; if it fails auth, the
package's trusted-publisher entry (repo + `release.yml`) is missing — see `docs/RELEASING.md`.
Verify:

```bash
npm view @vegastack/design version
```

## 5. Deploy the registry + docs

```bash
gh workflow run deploy.yml -R VegaStack/vegastack-design
```

The manual dispatch from `main` is the outward-deploy approval. The workflow builds without
credentials, signs in the only OIDC job (Sigstore keyless via GitHub OIDC, which works on the
self-hosted minis — the signer identity is the workflow ref, not the runner), reverifies the immutable
artifact in the credential-only deploy job, and then probes the one production boundary. Every
non-registry route is
public. `/internal/*` remains intentionally absent from discovery and carries `noindex`/`no-store`,
but it is not an authorization boundary. Only `/r/*` requires Cloudflare Access Service Auth.
Confirm the public probe covers public pages, every exported internal derivative, the retired route
derivatives, and all registry trust files, including:

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
✓ /internal/internal-projects → anonymously readable + noindex/no-store
✓ /internal/internal-projects.html → same-origin redirect + noindex/no-store
✓ /internal/internal-projects.md → anonymously readable + noindex/no-store
✓ /internal/internal-projects/__next._full.txt → anonymously readable + noindex/no-store
✓ /r/registry.json rejects anonymous requests
✓ /r/integrity-manifest.json rejects anonymous requests
✓ /r/integrity-manifest.sigstore rejects anonymous requests
✓ /r/stepper.json rejects anonymous requests
✓ /r/registry.json accepts the service token
✓ registry index, manifest, signature bundle, and representative item version validate
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

- Version PR push rejected mentioning `workflows permission` → re-run Release on the current `main`
  tip. Once the workflow commits are ancestors of the remote `main`, the version branch carries no
  workflow diff and the push succeeds. This is the recovery referenced in §2 — it is one action, and
  it is why splitting a PR to avoid the edge is usually not worth it.
- Contract gate red → download the artifact and READ it before re-running. Re-running a browser gate
  to see the failure again is how a release loses a day:

  ```bash
  gh run download <id> -R VegaStack/vegastack-design -n contracts-failure-<id> -D /tmp/cf
  open /tmp/cf/playwright-report/index.html          # or: pnpm exec playwright show-trace /tmp/cf/test-results/**/trace.zip
  ```

  Then reproduce locally — the same failure is deterministic:
  `cd apps/docs && pnpm exec playwright test contracts.spec.ts -g "<route>"`.
  **If the artifact is empty, that is its own bug** — the reporter or trace setting in
  `apps/docs/playwright.config.ts` regressed, and the gate has gone back to being undiagnosable.

- Deploy "Asset too large" → a page exceeds Cloudflare's 25 MiB limit; the deploy log names
  it. Usually Story-controls type explosion — see `apps/docs/components/stories/story-shims.tsx`.
- A self-hosted job is queued with no runner → both `vsk-runners-mac-mini` minis are busy or offline.
  Nothing to fix in the repository; check the runners.

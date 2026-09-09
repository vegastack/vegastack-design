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
pnpm release:preflight        # = `pnpm verify:release`; the same command deploy.yml runs
```

It runs both docs-visibility matrices with their metadata contracts, the link check, the docs-shell
contracts over the public export and their `--self-test`, the registry build and its idempotency
assertion, a full `shadcn` consume round-trip, and the complete unit suite in all three engines. A
release is a chain, and a defect anywhere fails all of it.

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
pnpm verify:release             # BOTH docs matrices · links · docs shell · registry · consume · 3 engines. ~7min.
node tooling/changelog-lint.mjs
```

**CI executes both of these itself.** `deploy.yml` runs `pnpm verify && pnpm verify:release` on the
LAN Linux runners in the pinned Playwright container before `build-sign-deploy` starts, so a deploy
cannot happen without them. Running them here is about finding a failure in two minutes instead of
twelve on a dispatched workflow — it is not the evidence, and there is nothing to commit alongside
the release. The local full-sweep command and the attested evidence file it wrote were removed on
2026-09-08 (`docs/plans/2026-09-08-verification-rebuild.md`, R1); a failure is now ordinary command
output, and the `review` skill covers how to classify one at its root.

**If `git status` is not empty:** that is the signal, not an obstacle. Either the regenerated
surfaces above changed (commit them with the work that caused them) or there is unrelated
uncommitted work in the tree (finish or stash it). Never ship from a dirty tree — the version job
snapshots the pushed commit.

Then find out what the push will actually DO, before pushing:

```bash
node tooling/release-detect.mjs --check-npm    # what release.yml's `changes` job will decide
```

This is the same script `release.yml` calls, so what it prints is what the workflow will do: whether
the run opens a Version PR (`has_changesets`) or publishes (`publish`). Reconcile that against what
you expect — **a surprise here is the finding.** `--check-npm` asks the registry what is actually
published, which is what lets an interrupted release resume.

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
- **A verification result that describes a different tree.** Nothing binds your local run to what you
  push, and nothing needs to, because CI re-runs `pnpm verify` against the pushed commit itself. What
  is still on you is the ordering: run the checks, then commit, then push, and read the CI result
  rather than assuming your local run stands in for it.

## 1b. Visual review

There is **no pixel-capture tool** any more; the before/after lane was deleted with the rest of the
attestation stack (`docs/plans/2026-09-08-verification-rebuild.md` § 3.3). What replaced it is:

- **The geometry contracts**, inside `pnpm verify` — 320px reflow, RTL containment, and the effective
  24px pointer target, measured against the real compiled token CSS. Blocking, in CI, no baselines.
- **A human looking at the docs site.** When a release contains a component, token, preview, or
  docs-shell change, run `pnpm -F @vegastack/docs dev`, open the routes it touched, and describe what
  changed. **Stop there. MK decides.** Never self-clear a visual change.

See [references/visual-review.md](references/visual-review.md) for what to look at, route by route.

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
heading version from `changeset status`, changesets' own release plan. `--check` and assembly FAIL
on a changeset with no marker; `changeset-lint` runs the same rule per PR, over every pending
changeset with no grandfather list, so a failure here means someone bypassed the lint.

**Idempotency is keyed on the assembled marker, not the version.** A written entry carries
`<!-- assembled from N changesets: <fingerprint> -->` under its heading (stripped from the docs
page, which is MDX and has no HTML comments). Re-running over the same pending set is a no-op.
A `## [x.y.z]` heading with NO marker is a hand-written entry for the version about to be released,
and the assembler **refuses**, loudly, with the reconciliation steps — because exiting 0 there
would let `changeset version` delete every pending changeset whose prose was never placed. That is
not hypothetical: `main` carried exactly such an entry, hand-written by the audit train, when this
gate was written.

**When a hand-written edit is legitimate — and when it is not.** The exception is bounded to the
**Version PR, after assembly has already written the heading**: the entry exists, the changesets
are consumed, and the release needs a line no changeset carried (a migration note, a summary
paragraph). Edit `/CHANGELOG.md` inside that PR, then `node tooling/sync-changelog.mjs`.

Never hand-write an entry for an **upcoming** version on `main`. Between releases the only
changelog artefact is a changeset; a `## [x.y.z]` heading for a version that has not been assembled
yet is the failure mode above, and reconciling one back into changesets is a day of work.

## 4. Version PR → publish

**The Version PR is just a version bump now.** `pnpm run version-packages` is
`changelog-assemble && changeset version && version-sync && sync-changelog` — assemble the release
entry, bump, re-stamp the registry, regenerate the docs Changelog page — and that is all it is. The
carry step it used to end with, and the guard job that made the carry necessary, were removed on
2026-09-08.

**Do not wait for green checks on the Version PR — they never arrive.** GitHub withholds workflow
runs on a branch pushed by the changesets action's `GITHUB_TOKEN`, so every `CI` run on
`changeset-release/main` sits at `action_required` until a maintainer clicks **Approve and run**.
Verified 2026-09-09: twelve consecutive runs on that branch, none executed. An earlier version of
this section claimed the bot branch "can pass like any other" — it cannot, and reading it that way
means merging while believing something ran.

What actually gates the publish is `quality-gate` on `main`, twice: once on the push that created
the Version PR, and again on the push created by **merging** it, where `publish` lists it in
`needs:` and cannot start until `pnpm verify` has passed on the merged tree. So the published
content is verified; the Version PR is simply not where you see it. If you want checks on the PR
itself, approve the run by hand — it is the same `pnpm verify`.

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
mac mini, token-free via OIDC trusted publishing, calling `npm publish --no-provenance` directly (npm
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
self-hosted mac mini — the signer identity is the workflow ref, not the runner), reverifies the immutable
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
(`shadcn add @vegastack/<name> --overwrite`), rerun the starter's own smoke suite, commit.

## Failure recovery

- Version PR push rejected mentioning `workflows permission` → re-run Release on the current `main`
  tip. Once the workflow commits are ancestors of the remote `main`, the version branch carries no
  workflow diff and the push succeeds. This is the recovery referenced in §2 — it is one action, and
  it is why splitting a PR to avoid the edge is usually not worth it.
- A browser gate is red in CI → there is **no artifact to download and no Playwright report**. The
  Playwright-over-the-docs-export contract lane and its failure artifacts were deleted; the browser
  gates are now vitest browser-mode suites inside `pnpm verify`, and the run log IS the report. The
  same command reproduces the failure locally, deterministically, because CI runs exactly it:

  ```bash
  pnpm verify                                              # the whole gate, as CI runs it
  pnpm exec turbo run test --filter=@vegastack/ui          # just the browser suite
  pnpm check:component <name>                              # one component, ~5s
  ```

  For a release-only failure (both docs matrices, links, the docs-shell contracts, the consume
  round-trip, three engines): `pnpm verify:release`.

- Deploy "Asset too large" → a page exceeds Cloudflare's 25 MiB limit; the deploy log names
  it. Usually Story-controls type explosion — see `apps/docs/components/stories/story-shims.tsx`.
- A self-hosted job is queued with no runner → both `vsk-runners-mac-mini` agents are busy, or the
  one machine hosting them (`patrick-mac-mini`) is offline.
  Nothing to fix in the repository; check the runners.

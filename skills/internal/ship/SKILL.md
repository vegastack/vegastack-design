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

## 0. Release-chain preflight — run this FIRST

```bash
pnpm release:preflight        # in place; restores the tree on exit
```

It simulates a version bump and runs the whole chain — version-sync, both authorities, the
classifier, the receipt-carry proof, and a full `shadcn` consume round-trip. Consume explicitly
rebuilds both public packages, packs them, and verifies that every declared export is present before
installing them into clean consumers; ignored `dist` output left by an earlier command is never
evidence. A release is a chain, and a defect anywhere fails all of it.

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
git status --porcelain          # must be empty except .gates/ — see below if it is not
pnpm gates:ship                 # THE full local sweep. Prior retained range: 30m15s–48m25s; writes receipt.
node tooling/changelog-lint.mjs
SITE_VISIBILITY=private pnpm --filter @vegastack/docs build
```

`pnpm gates:ship` is not a convenience wrapper — it is the release's evidence. It runs the full lint
chain, `typecheck`, the browser-unit suite, the cross-engine smoke, the complete three-engine suite,
`registry:build` idempotency, the `shadcn` consume round-trip, and **all 108 contract routes**, then
writes `.gates/receipt.json` binding those results to a tree hash.

**No CI runner executes a browser.** `deploy.yml`'s `receipt-guard` demands a receipt with all three
browser lanes present and passing, which only this command produces — so a deploy is impossible
without it. That also means a partial sweep is not a shortcut here; it is a blocked deploy.

**Run this BEFORE committing, then commit `.gates/receipt.json` together with the release.**
`.gates/` is excluded from the tree hash the receipt binds to, so including it in the commit cannot
invalidate it — but committing FIRST leaves a receipt describing the previous tree, which every
workflow's `receipt-guard` rejects. `gates push` checks this and refuses the push with the fix, so
the mistake is cheap; do not rely on that.

Then read the reports rather than trusting the exit code — the `gates` skill covers how to classify
each failure at its root:

```bash
cat .gates/ship.json                                    # per-gate status and duration
node -p "const r=require('./.gates/contracts.json'); r.status+' · '+r.executed+' executed · '+r.scope.reason"
```

The smoke and all-browser reports may show five reporter-visible Firefox Dropzone paste exclusions.
Read `runtimeExclusions`: only the five exact `synthetic-clipboard-files` leaves bound by
`tooling/lib/vitest-runtime-exclusions.mjs` are allowed. This is not permission for an arbitrary
`test.skip`/`skipIf`; a new, renamed, wrong-file/engine, stale-manifest, or pre-listed skipped leaf
must fail the run. Each report's executed count must exactly match its independently listed required
leaf manifest; excluded definitions never become receipt evidence. Account for every one of the five
direct top-level registrations exactly once: reporter-excluded, or independently listed and passed.
If a leaf is absent from both, stop—the capability did not prove recovery, even when
`runtimeExclusions` is empty.

A contracts entry reporting `status: "skipped"` or `executed: 0` after `gates:ship` is a defect, not a
pass: `ship` runs `--all`, so an empty scope means the runner or the route set is wrong.

An unchanged pre-push after this full ship currently records an exact-tree reuse observation but
still executes its planned browser/contract lanes. Reuse is shadow-only until the recorded 20-run
zero-escape checkpoint and separate MK approval. Do not interpret `would-reuse` as a skip, and do
not replace the production-full receipt with a weaker change receipt.

`pnpm gates:retry` is a diagnostic aid after failure, never a release step. Its pass cannot satisfy
this checklist, clear `.gates/last-failure.json`, or contribute a receipt leaf. Run the applicable
blocking ladder again after the root fix.

`pnpm gates:affected` is also not a release step. It is a shadow post-fix planner whose current push
oracle writes no receipt; its local report and proposed Turbo hashes cannot satisfy this checklist.
Only an explicit `--oracle ship` result can count as a production-full shadow checkpoint sample, and
even that is not release evidence. Affected reuse is disabled pending 30 representative
production-full zero-escape samples and separate MK approval.
The current authority has no agreeing greater-than-six-route foundation fixture, so the qualifying
cohort is machine-blocked at 0/30. Do not collect qualifying checkpoint samples until MK separately
resolves that authority/policy blocker; synthetic or substitute samples never count.
Even after any local checkpoint, production still requires the complete exact-tree `gates:ship`
profile unless MK separately changes the cross-tree compositional-evidence policy.

Before deciding which iterative diagnostics or pixel review apply, run `pnpm gates:plan`. Read its
machine reasons rather than inferring from a file extension. Operational plans, ledgers, root
instructions, and internal skills can have no product impact; rendered MDX, previews, generated
copy-ins, tokens, global CSS/fonts, provider/theme, docs shell, dependencies, configs, toolchain,
metadata, and unknown paths cannot inherit that exemption. A component change selects it plus every
reachable dependent from the union of registry, import, Vitest-related, and route authorities.
Missing or disagreeing authorities widen. `safely-skipped` must carry a reason and selector digest;
`unknown` stops. Exact selected commands remain diagnostic/shadow-only and do not satisfy this ship
checklist.
Internal skills are operational prose. Public skills and their generated `packages/design/skills/**`
mirrors ship inside `@vegastack/design`: they can avoid rendered component lanes only when the plan
retains the skill-mirror, package-export, and package-build checks.

This makes `/ship` dynamic in explanation and pixel applicability, not in production evidence. If
the VRT lane is safely skipped, say that no rendered route was selected—never call it a clean pixel
diff. If routes are selected, follow the plain-language/image-link protocol below. In both cases the
terminal `pnpm gates:ship` remains the complete exact-final-tree production proof until D7 and a
separate MK approval change that policy.

Consume diagnostics are independently isolated: each selected real-CLI and simulated root starts
from a fresh consumer and must pass post-write verification and typecheck. The full profile retains
the exhaustive two-layout consolidated collision/typecheck proof. These reports are never receipt
leaves and never authorize reuse. D1 has not been approved, so CI, Release quality, and
`gates:ship` continue to run full consume even when an affected command is available.

**If `git status` is not empty:** that is the signal, not an obstacle. Either the regenerated
surfaces above changed (commit them with the work that caused them) or there is unrelated
uncommitted work in the tree (finish or stash it). Never ship from a dirty tree — the version job
snapshots the pushed commit.

Then find out what the push will actually DO, before pushing:

```bash
git fetch --prune origin                     # comparisons below require fresh remote truth
node tooling/release-classify.mjs        # origin/main → HEAD
pnpm release:state                       # exact npm + Version PR state; writes .gates/release-state.json
```

It extracts `release.yml`'s `detect` and `state` steps verbatim and runs them, printing which gates the
receipt must carry and the explicit release state. Reconcile `release_required`, `version_pr`, and
`npm_publish` against what you expect. **A surprise here is the finding.** The structured state report
names the reason, next action, and approval boundary. Only npm E404 proves an exact public version is
missing; timeout, 5xx, malformed/wrong registry data, an ambiguous Version PR, all-empty or invalid changesets, or a
release-workflow/changeset conflict blocks. Never turn `registry-unknown` into publish permission.

`changesets-nonempty` and `version-pr-open` run no hosted npm work. `versioned-unpublished` alone may
run the hosted isolated exact-byte package build and npm OIDC job. `published` means a release surface changed but both
exact public versions already exist, so quality runs on the mini while hosted npm jobs skip. A
one-published/one-missing result resumes the interrupted publish path. The post-publish exact-version
readback must pass before publication is complete.

The classification itself lives in `tooling/classify-change.mjs` (`pnpm classify`), which that step
calls; `tooling/verify-classify-change.mjs` proves it against real history, including the dated
2026-07-25 Version Packages incident — 1058 files whose only diff is a re-stamped provenance header — requires no
contract lane at all. Run it again on the Version PR
branch before merging it (`--before main --after changeset-release/main`).
PR `receipt-guard` runs this classifier before dependency installation. Its dependency-free smoke
authority must remain loadable in a clean clone with no `node_modules`; the executable classifier
fixture proves both an empty range and a stale-shadow registry mutation, while the dedicated
dependency-free suite rejects malformed JSON, missing/conflicting entries, invalid leaves, stale
contract/toolchain/content bindings, unknown source, and global inputs, then removes its scratch
clone on every exit. A missing package here is a
release blocker, never a reason to install dependencies in the guard or bypass the receipt.
The gate classifier is not the npm authority and no longer accepts `--check-npm`; release state lives
only in `tooling/release-state.mjs`.

A carried `production-full` receipt is allowed to satisfy Release's weaker `change` guard because
the guard independently reconstructs and verifies the complete stronger leaf universe. Dominance is
one-way: a scoped change receipt never satisfies deploy. This does not enable exact-tree reuse, and a
carried receipt remains reuse-ineligible.

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
- **A receipt that describes a different tree.** The four browser lanes are attested rather than
  re-executed by CI, so `.gates/receipt.json` is the release's only evidence they ran. If you commit
  anything after `gates:ship`, the receipt no longer covers the tree and every workflow will reject
  it. Re-run the sweep; do not hand-edit the receipt. Confirm before pushing:

  ```bash
  pnpm gates:verify-receipt --contracts true --unit true --smoke true
  ```

## 1b. Visual review

Run this whenever the release contains a component, token, preview, or docs-shell change. It is a
review step, not a gate: it exits 0 for any pixel outcome.

```bash
node tooling/vrt-review.mjs
```

Then follow [references/visual-review.md](references/visual-review.md) exactly:

1. Read `.vrt-review/report.json`.
2. Read every artifact the status can produce: changed = Before/After/Difference; new = After (and
   Difference only if emitted); removed = Before; broken = the report error plus any available image.
3. Classify each **intended** / **unintended** / **uncertain**.
4. Present a human-readable handoff:
   - Start with short plain-language bullet points: what visibly changed, what did not change, the
     likely cause, and whether a user would notice it. Never make a pixel count the explanation.
   - Include the audit table — route, project, pixels changed, verdict, and one-line reasoning.
   - Expose every available status-appropriate image as an absolute, clickable path, plus the
     absolute report path. Never invent a missing Before/After/Difference path.
   - A broken entry has no visual verdict: explain the error, link what exists, rerun, and stop.
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

**Workflow edits and changesets — check the precondition before applying the workaround.** The
Actions `GITHUB_TOKEN` cannot push `.github/workflows/*`, so the standing advice is to land workflow
edits as their own PR first (`docs/RELEASING.md` § Known edge). That advice assumes `main` is
changeset-free. **Verify it — `git ls-tree --name-only origin/main .changeset/`.** If changesets are
already pending on `main`, the next Release run is changeset-bearing no matter what you do, splitting
your PR buys nothing, and you end up with a changeset-only PR describing already-merged code. Take
the recovery path below instead; it is one action. This was applied wrongly on 2026-07-25 precisely
because the rule was followed without checking the condition it depends on.

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

**The Version PR carries its receipt forward automatically, and you should know why.** A receipt is
bound to a tree hash, and `changeset version` + `version-sync` move that hash — versions, package
CHANGELOGs, consumed changesets, and re-stamped provenance headers on the generated registry
inventory. The exact inventory size is derived from the current authorities; it is not a release
constant. Nothing a browser gate can observe changes, so `pnpm run version-packages` ends by running
`tooling/gate-receipt-carry.mjs`, which rewrites only the receipt's tree-bound facts (`tree`,
`treeFiles`, and the contract SHA) and records `carriedFrom`. `receipt-guard` then re-derives the
proof from git and rejects the carry if anything real changed. Without this the Version PR would
fail the guard and no publish could ever happen.

If `gate-receipt-carry` REFUSES, do not work around it: something other than a version bump is in
that branch, and the browser gates have to run against it. The proof rejects untracked paths before
reading content because `git diff` has no record for them; it also rejects binary records,
file-mode-only changes, renames, deletions, and any inventory path missing from the parsed diff.
Generated output is exempt only when it is tracked and independently re-derived by the quality gate.

Deploy accepts only receipt **schema 2** with the explicit **`production-full`** profile. That
profile independently represents unit/axe, every smoke engine, the complete **`all-browsers`**
Chromium/Firefox/WebKit lane, and all 108 routes / 864 contract leaves. Its canonical sorted leaf
manifest is reconstructed by the guard from the checked-out tree; `mode: ship` and a coverage-root
digest without leaves are never sufficient.

The docs export warm-up must finish before every browser lane. Do not move that barrier to chase
wall time; Chromium canvas timing and cross-engine interaction timing both failed under overlap.

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
expected actually executed — a skipped job looks identical to an absent one, and `receipt-guard` is
the one whose absence would matter most:

```bash
gh run view <id> -R VegaStack/vegastack-design --json jobs \
  --jq '.jobs[] | "\(.conclusion // .status)  \(.name)"'
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
gh workflow run deploy.yml -R VegaStack/vegastack-design
```

The manual dispatch from `main` is the outward-deploy approval. The workflow builds without
credentials, signs in the only OIDC-capable job, reverifies the immutable artifact in the
credential-only deploy job, captures Wrangler's structured Cloudflare version ID, and then probes the
one production boundary. **Upload is not completion:** require the final `deployment-complete` job to
be green and read its summary; it must contain the Cloudflare version ID, an `executed/pass`
structured probe count, and the exact registry version, and cannot run after a failed/skipped/empty
probe. Every non-registry route is
public. `/internal/*` remains intentionally absent from discovery and carries `noindex`/`no-store`,
but it is not an authorization boundary. Only `/r/*` requires Cloudflare Access Service Auth.

The exact-main deploy candidate is **shadow-only**. It may come only from the already-required,
successful `release.yml` quality build for this exact main SHA. `build-curated` validates the selected
immutable artifact ID, API/archive digest, producer workflow/run/SHA, canonical sorted leaf manifest,
toolchain/config context, and byte parity against its own mandatory rebuild. The candidate never
reaches signing or deployment. D4 requires a separate MK approval and code change before reuse.
A missing or expired candidate is a safe miss and uses the rebuild. A live malformed, tampered,
wrong-tree, or ambiguous claim must fail before OIDC or Cloudflare credentials; do not delete or
ignore the claim to make the deploy proceed.
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
- Local contract gate red → read `.gates/last-failure.json` and `.gates/contracts.json`, then rerun
  the exact route through `node tooling/contracts-run.mjs --routes <route>`. Never call Playwright
  directly or imply a CI browser artifact exists; no CI runner executes this lane.

- Deploy "Asset too large" → a page exceeds Cloudflare's 25 MiB limit; the deploy log names
  it. Usually Story-controls type explosion — see `apps/docs/components/stories/story-shims.tsx`.
- A self-hosted job is queued with no runner → both `vsk-runners-mac-mini` minis are busy or offline.
  Nothing to fix in the repository; check the runners.
- `deploy-curated` green but `deployment-complete` absent/skipped → production is not verified. Read
  the external boundary-probe failure; do not describe the Cloudflare upload/version as completion.

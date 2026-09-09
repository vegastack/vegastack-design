# Release gotchas — what actually breaks, and the check that catches it

Every entry here cost a full merge-and-watch cycle on 2026-07-25/26. Seven cycles, because each
blocker was found _serially_ — fix, push, merge, watch, discover the next one. **The lesson above all
others: exercise the whole chain in one pass before starting.** `pnpm verify:release`
does that; it simulates a version bump in a throwaway worktree and asserts every link. It would have
found five of these at once.

Nothing here is theoretical: each was observed on a real release run.

---

## 0a. The sequence that actually shipped 0.2.0

Proven end to end on 2026-07-26. Follow it in this order.

1. `pnpm release:preflight` — the whole chain against a simulated bump. Fix everything it reports
   before touching a branch.
2. `pnpm verify`, then `pnpm verify:release`. CI runs both itself — `deploy.yml` runs them on the
   Linux runners before anything outward happens — so this is about finding a failure in minutes
   rather than on a dispatched workflow. Nothing is carried forward — CI executes the same commands.
3. Commit and push. Read the CI result; do not treat the local run as standing in for it.
4. Merge the change PR → `version-pr` opens the Version PR.
5. Merge the Version PR → `publish` → npm.
6. Review the affected docs routes by hand, then dispatch `deploy.yml`.

**`publish` showing "Skipped" on step 4 is CORRECT** — that is the two-phase changesets model. It
runs only when `has_changesets == 'false'`, i.e. after the Version PR merges. Do not treat it as a
fault.

## 0b. `workflow_dispatch` can return HTTP 500 spuriously

Observed once dispatching `deploy.yml` from a correctly-registered, active workflow. Retry; confirm by
comparing the newest run id before and after rather than trusting the command's output.

## 0. The meta-rule

**Never discover release blockers serially.** A release is a chain — bump → sync → build → consume →
publish. A defect anywhere fails the whole thing, and each discovery costs a full cycle. Run the whole chain locally first:

```bash
pnpm verify:release                      # the release half of the one command
```

Second rule: **most of these only appear on a MINOR bump.** The 0.1.0 → 0.1.1 release exercised none
of them, because `^0.1.0` still matched and no route set moved. A patch release proves very little
about the next minor.

---

## 1. Registry npm ranges do not follow the packages they point at

- **Symptom:** `registry:verify-consume` fails with
  `ERR_PNPM_NO_MATCHING_VERSION: No matching version found for @vegastack/design@^0.1.0`.
- **Cause:** every registry item declares `"@vegastack/design@^0.1.0"` in its npm `dependencies`.
  `^0.1.0` means `>=0.1.0 <0.2.0`, so it **excludes** 0.2.0.
- **Why it hid:** 0.1.0 → 0.1.1 still satisfied `^0.1.0`. The first minor bump broke it.
- **Blast radius if shipped:** every `shadcn add @vegastack/<component>` installs the PREVIOUS runtime
  beneath components built against the new tokens. **npm versions are immutable** — unrecoverable.
- **Now:** `version-sync` rewrites the ranges in both authorities.

## 2. The two authorities must move together

- **Symptom:** `verify-component-contracts: 96 problem(s) … expected ^0.2.0, received ^0.1.0`.
- **Cause:** `packages/ui/component-contracts.json` records the same ranges as
  `packages/ui/registry.json`, and that gate compares them. Fixing one alone fails the other.
- **Knock-on:** changing the contract JSON moves its SHA-256, so `version-sync` runs
  **`pnpm design:derived` inside the production command** and its output is part of the same commit.

## 3-4. Version-bump gate exemptions — REMOVED 2026-09-08

Two entries lived here: a pure version bump had to be exempted from the per-lane requirement, and the
attested evidence file had to be carried across `changeset version` because that command moves the
tree hash (versions, package CHANGELOGs, consumed changesets, and a re-stamped provenance header in
1082 files) while changing nothing a browser gate can observe. Both mechanisms were deleted on
2026-09-08; CI runs every lane on every commit, the Version PR included. The reasoning is preserved in
`docs/ledger/operator-review.md`, 2026-09-09 — it is the clearest statement of why binding evidence to
a tree hash was fragile.

## 5. Never anchor a cross-machine proof to a tree hash

- **Symptom:** `fatal: bad object e8a242b8…` on a runner.
- **Cause:** `workingTreeContentHash()` builds its tree through a throwaway index, so the object is
  **dangling** — never reachable from a ref, therefore never pushed, therefore absent everywhere else.
- **Rule:** a tree hash is fine for "does this describe the same content" (both sides recompute it).
  It is useless as a **diff endpoint**. Anchor those to commits.

## 6. version-sync must not reformat what it rewrites

- **Symptom:** ~20KB of noise in the release diff; the carry refuses to cross it.
- **Cause:** `JSON.stringify(…, 2)` expands every short array that prettier keeps on one line.
  408,865 → 428,665 bytes across 538 items.
- **Rule:** after programmatically rewriting a checked-in file, hand it back to prettier — via the
  **API**, not `pnpm exec`, which fails in a detached worktree.

## 7. `changeset status` gates any `packages/**` change

- **Symptom:** `Some packages have been changed but no changesets were found`.
- **Rule:** a fix that corrects an **unpublished** release takes an **empty changeset** (`---\n---`),
  which is changesets' own sanctioned answer and has precedent here. It costs one extra Version-PR
  cycle — budget for it, or fold the fix in before the Version PR is opened.

## 7b. An EMPTY changeset deadlocks a pending release

- **Symptom:** `version-pr` succeeds with `All changesets are empty; not creating PR`, and `publish`
  is skipped forever.
- **Cause:** changesets will not open a Version PR when every pending changeset is empty — so
  `has_changesets` stays **true** on main, and `publish` (gated on `has_changesets == 'false'`) can
  never run. Meanwhile the bumped versions sit on main, unpublished.
- **Rule:** an empty changeset is fine on a quiet main. **Never add one while a version bump is
  awaiting publication** — fold the fix in before the Version PR is opened, or land it after the
  publish. Verified live: it stranded 0.2.0 on main with 0.1.1 on npm.
- **Recovery:** delete the empty changeset, and make sure `publish` can still become true —
  `release-detect --check-npm` asks the registry what is actually published, so an interrupted
  release resumes instead of needing a human to guess.

## 8. Generated surfaces vs prettier

- **Symptom:** `prettier --check` and `design:derived --check` each undo the other.
- **Rule:** anything a generator owns belongs in `.prettierignore` — or the generator must emit
  prettier's shape. Already caught: `component-matrix.md`, `*.generated.*`,
  `design-tokens/src/tokens.ts`, `audit-register.json`, `audits/coverage.json`.
- **Deliberately NOT ignored:** `component-contracts.json` is a hand-maintained authority.

## 9. A script can depend on generated output it does not generate

- **Symptom:** `Cannot find package 'collections'` from `apps/docs/lib/source.ts` on a clean clone.
- **Cause:** the docs lint chain needed `.source`, which only `typecheck`/`build` produced. It passed
  in CI purely because `typecheck` happens to run first in the same job.
- **Rule:** a package script must produce its own prerequisites. Ordering is not a contract.

## 10. `pnpm lint` ≠ `turbo run lint`

The umbrella adds `design:verify`, the security gates, secret-scan, and every negative fixture.
`pnpm verify` runs the umbrella for exactly this reason — a green `turbo run lint` proves less than it
appears to.

## 11. Reaping a server: kill the group, and filter the port

- `pnpm exec serve` spawns a child; killing the wrapper orphans the server. Use `detached: true` and
  kill the **process group**.
- `lsof -ti tcp:<port>` matches sockets with that port on **either** end — including the process that
  just polled the server. Without `-sTCP:LISTEN` it SIGKILLs the runner: exit 137 after a clean
  `768 passed`, with the report already written as `"pass"`. **The deleted workflows used the
  unfiltered idiom.**

## 11b. Canvas/rAF unit tests flake under load

- **Symptom:** 4 failures in `particle-field.test.tsx`, all `expected false to be true`, all on
  frame-painting assertions (`draws a static frame`, `sets data-drawn once the first frame has
painted`). 1251/1255 passed.
- **Classification, with evidence — never retry blind:**
  1. the diff touched no component or runtime code, only tooling and docs;
  2. the file passed **6/6 in isolation**;
  3. the three-engine suite ran the same Chromium tests **in the same sweep** and passed.
- **Cause:** `requestAnimationFrame` painting is starved when the machine is busy. This ran directly
  after another full gate run.
- **Rule:** re-run the single file before concluding anything, and state all three facts. A flake that
  is really a race will come back on someone else's machine.

## 11c. Never edit files while a verification run is in flight

The reason has changed but the rule has not. Evidence used to be hashed from the working tree when a
run FINISHED, so a mid-run edit attested a tree the gates never executed against; that mechanism was
removed on 2026-09-08, but a mid-run edit still means the result on your screen describes a tree that no longer
exists, and vitest's watch-free `run` mode will happily have transformed half of each. Write first,
then verify.

## 12. Commit ordering — RESOLVED 2026-09-08

Verification used to have to run BEFORE committing, and its evidence file had to be committed with
the code, or every workflow rejected the push. That whole mechanism was removed on 2026-09-08: CI
re-runs `pnpm verify` against the pushed commit, so nothing about commit ordering matters any more.

## 13. `continue-on-error` steps report `conclusion: success`

A diagnostic whose steps are `continue-on-error` will look green in the API even when the command
failed. Read the step **`outcome`**, or have the job compute its own verdict from every outcome — the
first version of the mini diagnostic reported "Green" while `pnpm lint` had failed inside it.

## 14. Fetch before you compare

Two false diagnoses in one session came from a stale `origin/main`. Any classification against
`origin/*` starts with `git fetch origin --prune`.

---

## Historical completed release evidence — verified 2026-07-26

> Superseded boundary evidence: this records the former broad-root Access topology. As of
> 2026-07-28 every non-registry route is public and only `/r/*` is private. Do not use the old 302
> result or a cutover phase as a current deploy expectation.

- npm: `@vegastack/design@0.2.0`, `@vegastack/design-tokens@0.2.0` (from 0.1.1 / 0.1.0).
- `build-sign-deploy` (then three jobs, `sign-curated` → `deploy-curated`; folded into one on
  2026-09-05): `Verified OK` (cosign, before deploying) then `Uploaded 1477 of 1477 assets`.
- `verify-protected-boundary` against `https://design.vegastack.com`: `/` and `/docs/*` return **302**
  to Cloudflare Access, and every `/r/*` path rejects anonymous while accepting the service token.
  **302 is the correct pre-cutover state, not a failure** — the public-docs cutover is separate.
- Independently confirmed by hand: `/` → 302 to `peerxp.cloudflareaccess.com`, `/r/registry.json` → 403.
- Billed minutes for the publish run: **0** — every job runs on the self-hosted mac mini, including
  `publish`, `build-sign-deploy` and the boundary probe. No job is GitHub-hosted.

## 15. A successful upload can still end in a failed deployment workflow

One deploy run uploaded the signed production artifact successfully, then failed only in the
final boundary probe because the repository still expected `/internal/*` to be SSO-only after the
operator had intentionally made the whole non-registry site public. The recovery is to align the
verifier with the approved boundary, not to roll Cloudflare back: remove the obsolete cutover phase,
assert public/noindex/no-store on every exported internal derivative, keep anonymous `/r/*`
fail-closed, and validate a representative registry item's exact workspace version, hash, and signed
manifest entry. Treat `build-sign-deploy` success and final workflow success as separate evidence.

Two recovery-specific follow-ons:

- An unlisted route named in an otherwise public guide is still discoverable: it is copied into
  search/LLM corpora by design. Keep public policy prose path-agnostic and let the existing metadata
  gate reject route literals; never add a prose allowlist that weakens the exclusion.
- A lone browser timeout in a cold full sweep is neither a reason to waive the lane nor proof of a
  component defect. Re-run that exact engine/test repeatedly, then the complete suite on the warm
  tree. In this incident the test passed 6/6 targeted attempts and all 4,408 runnable tests passed in
  the complete rerun, so no assertion or timeout budget was weakened. The ship ladder now also
  awaits its cold docs warm-up before the complete browser lane, matching its stated ordering.

After publishing, `release-detect --check-npm` reports nothing unpublished, so a later docs-only push
correctly leaves `publish=false` and cannot re-publish by accident.

## The one thing still open

Nothing from the verification rebuild is outstanding. The forced-colors focus assertion that used to
be listed here as un-failable was not ported into the geometry lane on 2026-09-08 — it was dropped,
because it could not fail (Chromium paints its own ring in that mode). Manual forced-colors focus
review is now a judgment step, not a gate: `skills/internal/review/references/lint-rules.md` says
where and how. Evidence: `docs/ledger/bugs.md`, 2026-07-25.

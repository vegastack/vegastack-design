# Release gotchas — what actually breaks, and the check that catches it

Every entry here cost a full merge-and-watch cycle on 2026-07-25/26. Seven cycles, because each
blocker was found _serially_ — fix, push, merge, watch, discover the next one. **The lesson above all
others: exercise the whole chain in one pass before starting.** `node tooling/verify-release-chain.mjs`
does that; it simulates a version bump in place, restores the original tree on exit, and asserts
every link. It would have
found five of these at once.

Nothing here is theoretical. Each has a run id.

---

## 0a. The sequence that actually shipped 0.2.0

Proven end to end on 2026-07-26. Follow it in this order.

1. `pnpm release:preflight` — the whole chain against a simulated bump. Fix everything it reports
   before touching a branch.
2. `pnpm gates:ship` — **not `gates:push`**. `deploy.yml` demands all three browser lanes
   unconditionally, and the receipt carry PRESERVES gate results across the version bump. A
   full-sweep receipt committed once therefore survives to the deploy; a `gates:push` receipt does
   not, and costs an extra ~25-minute cycle to redo.
3. Run `node tooling/vrt-review.mjs` when the tree affects a visual route; inspect every non-unchanged
   image and stop for MK on any uncertain or unintended result.
4. Commit code **and** `.gates/receipt.json` together, then stop for the separate push approval. (§12)
5. Merge the change PR only with its separate approval → `version-pr` opens the Version PR.
6. Merge the reviewed Version PR only with its separate approval → `package-build` + `publish` → npm.
7. Dispatch `deploy.yml` only with its separate production approval; require the external probe and
   terminal `deployment-complete` summary, including Cloudflare version ID, nonzero structured probe
   count/state, and exact registry version.

**`package-build` and `publish` showing "Skipped" on step 4 is CORRECT** — the explicit state is
`changesets-nonempty` or `version-pr-open`. They run only for `versioned-unpublished`, after the
reviewed Version PR merge has put an exact public workspace version on `main` that npm lacks.
Do not treat it as a fault.

## 0b. `workflow_dispatch` can return HTTP 500 spuriously

Observed once dispatching `deploy.yml` from a correctly-registered, active workflow. Record the
newest run ID before dispatch, then query the newest run after any HTTP 500. If a new run exists,
observe that run and do not retry. Retry only when the read-only query proves that no run was
created, and treat the retry as a new production-dispatch approval boundary.

## 0. The meta-rule

**Never discover release blockers serially.** A release is a chain — bump → sync → build → consume →
classify → carry → guard → publish. A defect anywhere fails the whole thing, and each discovery costs
a full cycle. Run the whole chain locally first:

```bash
node tooling/verify-release-chain.mjs     # ~5min, read-only exact npm lookup, restores the tree
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
- **Now:** `version-sync` rewrites the ranges in both authorities. Run 30172679327.

## 2. The two authorities must move together

- **Symptom:** `verify-component-contracts: 96 problem(s) … expected ^0.2.0, received ^0.1.0`.
- **Cause:** `packages/ui/component-contracts.json` records the same ranges as
  `packages/ui/registry.json`, and that gate compares them. Fixing one alone fails the other.
- **Knock-on:** changing the contract JSON moves its SHA-256, so `version-sync` runs
  **`pnpm design:derived` inside the production command** and its output is part of the same commit.
  This includes `smoke-impact.generated.json`; its full contract digest moves on a version-only
  authority rewrite even though smoke topology does not.
  The carry updates the receipt's contract SHA only after the version-only proof succeeds; otherwise
  the independent guard rejects the Version PR even when its tree hash was carried correctly.

## 3. A pure version bump must require no gate

- **Symptom:** `receipt-guard` demands the `unit` lane; the carried receipt records it skipped.
- **Cause:** `packages/ui/package.json` matches the unit-lane surface, so a version bump looked like a
  package change. The publish path could never open.
- **Now:** `classify-change` short-circuits on `versionBumpOnly`. Run 30172679327.

## 4. The receipt cannot cross a version bump on its own

- **Symptom:** `receipt-guard` rejects the Version PR; no publish is reachable.
- **Cause:** `changeset version` + `version-sync` move the tree hash — versions, package CHANGELOGs,
  consumed changesets, and re-stamped provenance headers throughout that release's generated
  registry inventory. The dated 2026-07-26 specimen changed 1,082 files (77a346c0 → 1b5796df);
  current procedures derive the inventory instead of assuming that historical count.
- **Unfixable by re-running gates:** that branch is bot-authored and browsers cannot run in CI.
- **Now:** `gate-receipt-carry` carries it, the guard re-derives the proof. If the carry **refuses**,
  do not work around it — something other than a version bump is in that branch. Untracked paths
  have no diff record and therefore always refuse; mode, binary, rename, deletion, and missing-record
  changes also refuse. A tracked derived output is eligible only because exact-tree quality
  independently reconstructs it, and never by itself: at least one real package version field must
  change.

## 5. Never anchor a cross-machine proof to a tree hash

- **Symptom:** `fatal: bad object e8a242b8…` on a runner.
- **Cause:** `workingTreeContentHash()` builds its tree through a throwaway index, so the object is
  **dangling** — never reachable from a ref, therefore never pushed, therefore absent everywhere else.
- **Rule:** a tree hash is fine for "does this describe the same content" (both sides recompute it).
  It is useless as a **diff endpoint**. Anchor those to commits. Run 30168750521.

## 6. version-sync must not reformat what it rewrites

- **Symptom:** ~20KB of noise in the release diff; the carry refuses to cross it.
- **Cause:** `JSON.stringify(…, 2)` expands every short array that prettier keeps on one line.
  408,865 → 428,665 bytes across 538 items.
- **Rule:** after programmatically rewriting a checked-in file, hand it back to prettier — via the
  **API**, not `pnpm exec`, which fails in a detached worktree.

## 7. `changeset status` gates any `packages/**` change

- **Symptom:** `Some packages have been changed but no changesets were found`.
- **Rule:** do not use an all-empty changeset as release state. `release-state.mjs` reports
  `changesets-all-empty` and blocks. Fold the fix in before the Version PR, or remove the empty file
  and resume from the exact npm version state.

## 7b. An EMPTY changeset deadlocks a pending release

- **Symptom:** `version-pr` succeeds with `All changesets are empty; not creating PR`, and `publish`
  is skipped forever.
- **Cause:** changesets will not open a Version PR when every pending changeset is empty. The old
  boolean topology nevertheless treated the file as pending and stranded bumped versions on main.
- **Rule:** all-empty is now a blocking `changesets-all-empty` state, even on a quiet main. Fold the
  fix in before the Version PR or land it after publication. Verified live: the old behavior stranded
  0.2.0 on main with 0.1.1 on npm.
- **Recovery:** delete or repair the empty changeset, then run `pnpm release:state`. Exact E404 may
  yield `versioned-unpublished`; timeout, 5xx, malformed output, or wrong version yields blocking
  `registry-unknown`, never publication permission.

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
`gates:push` runs `pnpm exec turbo run lint`; `gates:ship`, CI, and Release quality run the root
umbrella where their profiles require it. A green pre-push Turbo lint therefore proves less than a
green root `pnpm lint`; do not describe them as equivalent.

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

## 11c. Never edit files while a gates run is in flight

The receipt hashes the working tree when the run FINISHES. Edit anything mid-run and it attests a tree
the gates never executed against — the exact fail-open the receipt exists to prevent. Write first,
then gate.

## 12. Receipt ordering

Run `pnpm gates:push` **before** committing, then commit code and `.gates/receipt.json` together.
`.gates/` is excluded from the tree hash, so including it cannot invalidate the receipt. Commit first
and HEAD carries a receipt for the previous tree. `gates push` now blocks on this.

## 13. `continue-on-error` steps report `conclusion: success`

A diagnostic whose steps are `continue-on-error` will look green in the API even when the command
failed. Read the step **`outcome`**, or have the job compute its own verdict from every outcome — the
first version of the mini diagnostic reported "Green" while `pnpm lint` had failed inside it.

## 14. Fetch before you compare

Two false diagnoses in one session came from a stale `origin/main`. Any classification against
`origin/*` starts with `git fetch origin --prune`.

## 15. Consume must build and inspect the packages it packs

- **Symptom:** clean `release:preflight` produced many `TS2307 Cannot find module
'@vegastack/design'` errors, while `gates:ship` consume had passed.
- **Cause:** `@vegastack/design` and `@vegastack/design-tokens` export ignored `dist/*` files.
  `gates:ship` had already run the lint/build chain, but clean preflight had not; `pnpm pack` therefore
  made installable-looking tarballs whose exported JS and type files were absent.
- **Now:** `verify-shadcn-consume` owns the prerequisite. It builds tokens then design, runs
  `pnpm pack --json`, and rejects any archive missing a declared export or bin target before starting
  a consumer. The structured report records both package builds and validated archive file counts.
- **Rule:** never add a publish lifecycle build to hide this. Release must continue publishing the
  exact artifact built and validated by the hosted producer; local consume performs its own explicit
  diagnostic build.

---

## Historical completed release evidence — verified 2026-07-26

> Superseded boundary evidence: this records the former broad-root Access topology. As of
> 2026-07-28 every non-registry route is public and only `/r/*` is private. Do not use the old 302
> result or a cutover phase as a current deploy expectation.

- npm: `@vegastack/design@0.2.0`, `@vegastack/design-tokens@0.2.0` (from 0.1.1 / 0.1.0).
- `deploy-curated`: `Verified OK` (cosign, before deploying) then `Uploaded 1477 of 1477 assets`.
- `verify-protected-boundary` against `https://design.vegastack.com`: `/` and `/docs/*` return **302**
  to Cloudflare Access, and every `/r/*` path rejects anonymous while accepting the service token.
  **302 is the correct pre-cutover state, not a failure** — the public-docs cutover is separate.
- Independently confirmed by hand: `/` → 302 to `peerxp.cloudflareaccess.com`, `/r/registry.json` → 403.
- Billed minutes for the publish run: **0** hosted minutes on the mac minis; only `package-build`,
  `publish`, `sign-curated`, `deploy-curated` and one boundary probe are hosted.

## 16. A successful upload can still end in a failed deployment workflow

Run `30309811715` uploaded the signed production artifact successfully, then failed only in the
final boundary probe because the repository still expected `/internal/*` to be SSO-only after the
operator had intentionally made the whole non-registry site public. The recovery is to align the
verifier with the approved boundary, not to roll Cloudflare back: remove the obsolete cutover phase,
assert public/noindex/no-store on every exported internal derivative, keep anonymous `/r/*`
fail-closed, and validate a representative registry item's exact workspace version, hash, and signed
manifest entry. Treat `deploy-curated` success and final workflow success as separate evidence; the
terminal summary must carry the structured probe state/count and exact registry version.

Two recovery-specific follow-ons:

- An unlisted route named in an otherwise public guide is still discoverable: it is copied into
  search/LLM corpora by design. Keep public policy prose path-agnostic and let the existing metadata
  gate reject route literals; never add a prose allowlist that weakens the exclusion.
- A lone browser timeout in a cold full sweep is neither a reason to waive the lane nor proof of a
  component defect. Re-run that exact engine/test repeatedly, then the complete suite on the warm
  tree. In this incident the test passed 6/6 targeted attempts and all 4,408 runnable tests passed in
  the complete rerun, so no assertion or timeout budget was weakened. The ship ladder's docs
  warm-up finishes before every browser lane. `verify-gate-schedule.mjs` enforces that barrier in
  component, push, and ship.

After publishing, `pnpm release:state` verifies both exact public versions. A later docs-only push is
`clean-noop`; a registry-only release is `published`. Both keep hosted npm jobs skipped.

## 17. Reporter-visible Vitest skips are not automatically acceptable

- **Symptom:** every browser test command and all 108/864 contracts passed, but final evidence
  integrity refused the receipt because Firefox reported five skipped Dropzone paste definitions.
- **Cause:** Vitest's pre-run list omitted those environment-specific `test.skipIf` definitions while
  its reporter kept them visible. The first repair incorrectly treated any reporter-only skip inside
  an expected file/engine as an exclusion, which could hide an arbitrarily disabled regression test.
- **Now:** exactly five file/engine/test identities are approved for the
  `synthetic-clipboard-files` capability. Their capability probe and `pasteTest` declaration are
  source-bound, their direct top-level registrations are verified, the runtime report persists the
  exact exclusion manifest, and receipt freeze rebuilds it independently. Every applicable identity
  must occur exactly once as reporter-excluded or independently listed and passed. Missing one or all
  identities fails; zero exclusions alone does not prove capability recovery. Arbitrary, renamed,
  removed, extra, stale, partial-file, and cross-file skips fail.
- **Rule:** inspect `runtimeExclusions`, not only `results.skipped`. Never add a broad pattern or
  relabel a new skip as environmental to get a receipt; review and mutation-test a new exact
  capability authority first.

## 18. Receipt-first means the classifier must load before install

- **Symptom:** PR run `30535403126` failed in `receipt-guard` with
  `ERR_MODULE_NOT_FOUND: Cannot find package 'typescript'`; `verify` correctly never started.
- **Cause:** dependency-aware smoke selection was imported from the parser-backed local gate module,
  but the seconds-long guard deliberately performs no `pnpm install`.
- **Now:** the guard uses a dependency-free classifier authority. The generated Vitest oracle is
  independently bound to complete source bytes plus file type/mode/symlink metadata, contract
  authority, and pinned toolchain; stale, malformed, or conflicting evidence widens. The installed
  local gate retains its parser-backed comparison as the independent oracle.
- **Rule:** do not add dependency setup to make this pass. Run `node tooling/verify-classify-change.mjs`;
  its clean-clone fixture has no `node_modules` and exercises both empty and stale registry ranges.
  Run `node tooling/verify-classifier-smoke.mjs` for malformed/conflicting shadow mutations. If
  `smoke=true`, its structured scope and reason must describe the effective widening—never “0 test
  files” after route, metadata, binary, or global logic widened the lane to all. If `smoke=false`,
  scope must be `none`. The verifier must clean its full scratch clone even when an assertion throws;
  persistent minis cannot absorb hundreds of megabytes per lint run.

## The one thing still open

**The forced-colors focus assertion cannot fail.** Chromium paints its own ≥2px ring in that mode and
forced-colors repaints borders, so both branches of `hasOutline || hasTextEntryTint` are always true —
deleting the design system's focus ring leaves all 864 checks green. Pre-existing, reproduced against
the spec before the 2026-07-25 rewrite. Fixing it changes what 192 checks assert, so it is scoped
separately. **Until then it is not coverage.** Evidence: `docs/ledger/bugs.md`, 2026-07-25.

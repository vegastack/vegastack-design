# Toast consolidation — retire `sonner`, complete `toast`

**Status:** APPROVED by MK 2026-09-22 and implemented in full · **Author:** Claude (Opus 5)
**Authority:** MK, 2026-09-22 — retire sonner outright, add what Base UI supports and what sonner
had that is worth keeping, remove sonner everywhere including blocks, make the toast page show every
capability. _"Don't overdo, do as necessary clean implementation."_ · _"Just don't complicate the
red tape… one simple gate. SIMPLICITY IS IMPORTANT."_

This reverses part of Batch 4 of the shadcn reset and is a new MK decision on the register
(AGENTS.md § Escalation).

---

## 1. What is true today

| Claim                                       | Evidence                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Upstream ships **both** engines             | `vendor/shadcn/4.21.0/ui/toast.tsx` (Base UI) and `.../ui/sonner.tsx`                                              |
| Both ship here deliberately                 | **OVL-10** resolved **shadcn**                                                                                     |
| **Toast is already the default**            | `registry/ui/provider.tsx:15` and `apps/docs/components/provider.tsx:25` both mount `<Toaster />` from `toast.tsx` |
| **Sonner is mounted nowhere** as app chrome | only its own docs preview mounts it                                                                                |
| The only real call site                     | `registry/blocks/dashboard-01/components/data-table.tsx:44`, two `toast.promise(…)` at `:225`/`:249`               |

**This was already done once, in this direction.** Commit `d5e2de2b3` _"feat(ui)!: toasts on Base UI
Toast; delete sonner (#41)"_ removed sonner and renamed the item `sonner` → `toast`. The reset
(`119cba1fd`, Batch 4) brought it back because OVL-10 resolved **shadcn**. That pre-reset
`toast.tsx` already implemented all three gaps MK picked:

```
119cba1fd^:packages/ui/registry/ui/toast.tsx        (891 lines; today's file is 275)
  :283  ToastPosition = top-start | top-center | top-end | bottom-*   ← position
  :688  ToastPositioner        :698  ToastArrow                       ← anchored
  :301  "fixed z-60 ..."                                              ← above the scrim
  :170  custom: (...)  — custom body inside a real toast              ← the one sonner carry-over
```

So this is a **recovery, not an invention**, and only those four parts come back.

## 2. The one gate change

`migrated()` in `tooling/upstream/lib.mjs` derives the enforced set from `vendor/…/ui/*.tsx` and
does not subtract retirements, so retiring an upstream-backed name makes two existing rules
contradict: rule 6 says the file must be absent, rules 1–4 say it must be present. The ten names in
`retired.json` today are all ones **we** invented, so upstream ships no file for them and they never
hit that contradiction. Sonner is the first upstream-backed retirement.

**Fix, in full:**

1. Rename `packages/ui/upstream/retired.json` → **`excluded.json`**, same shape, same ten names.
   One list, one meaning: _this name does not ship here, whatever upstream does._ It covers both
   cases MK named — components we retired onto an upstream replacement, and components upstream
   ships that we do not want.
2. Add one line to `migrated()` so it subtracts that list.

Rule 6 in `verify-parity.mjs` is unchanged and remains the only rule: an excluded name has no file
in `registry/ui/` and no patch. `retired()` has exactly one reader (`verify-parity.mjs`), so the
rename is mechanical. `migrated.json`'s `exempt` record is untouched.

**No second record, no decision-ID cross-check, no extra assertions.** The backstop already exists
and is free: `component-contracts.json`'s `expectedCounts` is reconciled live inside `design:verify`
by `verify-component-contracts.mjs`, so a component that disappears without its count moving fails
anyway — and unlike the `migrated.json` array this replaces, adding a name here is an _addition_
alongside four visible deletions, not a one-line omission that hides.

## 3. Decision register — three rows

> **COL-23 was added during implementation**, at MK's instruction ("toast font color should be
> muted? if it just contains the primary then it should be default color right?"). It is not in
> the approved plan above; it is recorded here because the register, the patch header and the
> component all carry it.

| ID         | Resolve  | Row                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **COL-23** | **ours** | A toast's FIRST text line carries the default ink, whatever part renders it. Base UI renders `Toast.Title` as `null` when a toast has no title, so upstream's flat `text-muted-foreground` painted a description-only toast's ONLY line — its primary message — in the secondary ink. `first:text-popover-foreground` restores the default ink exactly when the description leads. Hierarchy, not contrast: `muted-foreground` on `popover` passes AA unaided (contrast-check, 444/444), and it matches sonner, whose `[data-title]` is `color: inherit`. |

| ID         | Resolve           | Row                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OVL-10** | **shadcn → ours** | A flip, not a new row. The row's "What we do" column already reads _"Toast on Base UI Toast (not sonner)"_, so flipping makes it self-consistent in one edit and retires the "both ship" reading. Dated MK 2026-09-22.                                                                                                                                |
| **OVL-15** | **ours**          | Toast extends upstream's file with three things: a `position` prop (six logical values, `start`/`end` not left/right so RTL mirrors without a second vocabulary, default `bottom-end`), the anchored `ToastPositioner` + `ToastArrow` parts Base UI ships and upstream wraps neither of, and a `z-60` band so a toast fired over a Dialog is visible. |

One ID, three hunks — which is how `sonner.patch` is already written. **OVL-15 does not re-open
OVL-2**: everything else stays `z-50`, only toast leaves the band, and `z-60` is plain Tailwind, so
no `--z-*` token returns (verified: no z-index lint rule exists post-reset).

**Deliberately not doing:** sonner's `richColors` (tinting the whole surface per type). A11Y-13
needs a measured `-text` ink on every tinted status surface, and COL-12 already gives each type its
own ink on the `popover` ground — that is a measurement exercise, not a clean implementation of
this one.

## 4. Work

**WP1 — toast features.** `registry/ui/toast.tsx` + `patches/toast.patch`. Port from `119cba1fd^`:
the `toastViewportVariants` CVA with six positions and the `--toast-dir` growth sign; `position` on
`Toaster`/`ToastViewport` with swipe direction derived from it; `ToastPositioner` + `ToastArrow`;
`z-60`; and `toast.custom()` via a per-toast `data.render`, so a custom body keeps stacking,
swipe-dismiss, `Escape` and the live region. Everything already there stays: the A11Y-9 tab-order
fix, COL-12 inks, OVL-13 theme scope, FOC-1/6. Patch header gains `OVL-15`; `exception-map.json`
assigns it to `toast`.

_Kept as-is:_ Base UI's `close(id?)` closes the frontmost toast where sonner's `toast.dismiss()`
closed all — documented on the page rather than papered over with a divergent API.

**WP2 — remove sonner.** Delete `registry/ui/sonner.tsx`, `sonner.test.tsx`, `patches/sonner.patch`,
the `registry.json` item, `public/r/sonner.json`, `apps/docs/components/ui/sonner.tsx`,
`preview/sonner.tsx` + its barrel export, `content/docs/components/sonner.mdx` + its `meta.json`
entry, and the `api-props.ts:64` type import. Drop the `sonner` dependency from
`packages/ui/package.json` and `apps/docs/package.json`. Add `sonner` to `excluded.json` and make
the § 2 rename and one-line change.

**WP3 — migrate the block.** `dashboard-01/components/data-table.tsx`'s two `toast.promise(…)` calls
move onto our manager; the block gains `@vegastack/toast` in `registryDependencies`, loses `sonner`
from `dependencies`, and its `component-contracts.json` dependency-role entry (~line 24212) is
replaced. Blocks are **not** under byte parity (verified — `verify-parity.mjs` has no `blocks`
handling), so no patch is needed.

**WP4 — docs and records.** `toast.mdx` gains `### Position`, `### Anchored`, `### Custom` and
`### Update` examples with live `<ComponentPreview>`s and matching preview exports; upstream's own
sections stay matched occurrence-by-occurrence, the new ones are additions. Its `Deviations` section
gains OVL-15; the Do/Don't line about not mounting both engines goes; the modal-scrim accessibility
bullet is rewritten, and `test/stacking.browser.test.tsx` flips from measuring "behind the scrim" to
asserting "above it". `AGENTS.md`: drop `sonner` from § Sanctioned dependency exceptions, correct
`next-themes` from "read in exactly two registry items" to `provider` only, update the OVL-10
sentence and the § Repo map filename. `docs/MIGRATING-SHADCN-RESET.md` gains a `sonner → toast` prop
map. `pnpm design:derived` regenerates the matrix, § Numbers (registry items **690 → 689**,
components **110 → 109**) and the contract SHA. One changeset, `⚠️` marker — breaking for anyone who
ran `shadcn add @vegastack/sonner`.

## 5. Verification

`pnpm check:component toast` while iterating on WP1. `pnpm upstream:check` + `pnpm upstream:selftest`
after WP2 (where the gate's claim changes). `pnpm verify` before the PR. The geometry lane covers
the new positions; toast's axe coverage stays at zero suppressions.

## 6. Risks

1. **Breaking for consumers.** Anyone who installed `@vegastack/sonner` keeps their copy — it is
   copy-in — but loses updates and the registry item. The MIGRATING entry and the `⚠️` changeset are
   the available mitigation.
2. **Re-divergence from upstream.** `toast` goes from fully upstream-backed to carrying a larger
   patch, so the next CLI bump has more to reconcile. Every hunk is prior art MK approved once.
3. **A later upstream pull rewrites `ui/sonner.tsx`.** Harmless: it lands in `vendor/` only, and
   rule 6 keeps it out of `registry/ui/`.

---

## 7. What actually shipped (2026-09-22)

Deviations from the plan above, and the things it did not anticipate:

- **COL-23 is a third register row**, added mid-implementation at MK's instruction (§ 3).
- **The gate rename reached further than `verify-parity.mjs`.** `retired()` had one reader as the
  plan said, but `migrated()` in `lib.mjs` and `checkTree`'s own local set in `verify-parity.mjs`
  are two separate derivations of the same idea, so the subtraction went in both.
- **Five surfaces the plan missed**, each found by a gate rather than by reading:
  `packages/ui/src/provider/toaster.tsx` (a byte-exact mirror of the registry source,
  `sync-toaster-mirror.mjs`); `packages/ui/vitest.config.ts`'s Vite pre-bundle list, which named
  `sonner` and would have broken the browser lanes on the next clean install;
  `exception-map.json`'s A11Y-3/A11Y-4 assignments; the hard-coded `Overlays` roster and count
  inside `verify-component-contracts.mjs`; and a dead `/docs/components/sonner` link in a historical
  `/CHANGELOG.md` entry, which the docs link checker caught.
- **`docs/MIGRATING-SHADCN-RESET.md` was NOT given a sonner prop map**, contrary to WP4. That file
  points at `guides/migrating-shadcn-reset.mdx`, which is an upgrade path **from 0.4.x** — and a
  0.4.x consumer never had sonner, since it was deleted pre-reset and reinstated by it. Putting a
  0.12.0 retirement in a 0.4.x guide would be false. The guide's two now-wrong claims were corrected
  instead, and the migration map lives in the changeset, which is the repo's stated mechanism for a
  per-version breaking change.
- **`toast.custom()` is `data.render`, not a manager method.** Wrapping the exported manager in
  `Object.assign` would have given `toast` a method that `createToastManager()` does not have — an
  asymmetry worse than the ergonomics it buys. The capability is identical; the spelling is
  `toast.add({ data: { render } })`.
- **The unit lane cannot measure any of this.** `registry/ui/*.test.tsx` runs without compiled CSS,
  so the new tests there assert the classes the variants emit, and the rendered proofs live where
  real tokens exist: the `z-60` band and its `elementFromPoint` hit test in
  `test/stacking.browser.test.tsx`, the COL-23 inks in `test/contrast.browser.test.tsx`.
- **One known-foreign failure remains** in `pnpm lint`: `tooling/test/registry-integrity.test.mjs`
  asserts `git diff --quiet -- apps/docs/public/r/button.json`, and that file is dirty because
  another session has `packages/ui/registry/ui/button.tsx` uncommitted. Regenerating the registry
  propagated their source hash into the generated item. Nothing to do with this work.

## 8. Adversarial review round (2026-09-22, after implementation)

Run under the `review` skill, scoped to this round's changes. Full record:
`docs/ledger/codex-rounds.md`; the root cause of the one real defect: `docs/ledger/bugs.md`.

**One medium, fixed at the root.** The Anchored preview only looked right because it passed
`className="relative inset-auto"` to cancel the corner-stack recipe — an undocumented footgun that
byte parity, design-lint and the CSS-less unit lane all structurally cannot see. The stack recipe
moved out of `toastVariants`' base into its `anchor` variant (`TOAST_STACK`) with a third value
`none`, and `Toast` now resolves that from `ToastAnchoredContext`, which `ToastPositioner` provides.
An anchored composition therefore cannot be built wrong and needs no className. Mutation-checked: a
`Toast` that ignores the context lands 27px off its anchor and the new test goes red.

**Five low, all the same class: prose asserting a renamed or deleted thing in the present tense.**
`design.md` (truth hierarchy #4), `README.md` and — worst — `skills/internal/review/SKILL.md`, the
document an agent loads to learn this gate, all still named `retired.json`. `exception-map.json`'s
`_note` and `tooling/design-lint.mjs` both still claimed byte parity holds `sonner` to an ICO-8
hunk; in the first case a correction had been APPENDED while the false sentence stayed, so the file
contradicted itself. **Appending a correction is not a correction.**

**One finding raised and withdrawn.** The anchored preview measured as unanchored — until the probe
accounted for floating-ui positioning asynchronously. Dropped per the skill's § 7, but it is what
surfaced the medium above.

**Verified rather than assumed this round:** both `excluded.json` subtraction points are
load-bearing (removing either turns a gate red); `registry:build` is idempotent across consecutive
runs; the four new preview fixtures genuinely mount in the geometry lane, which fails vacuous
selection; and `data-position` is captured by the contract extractor, so it reaches the generated
Anatomy without being hand-written.

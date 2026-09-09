# Fix-round ledger — review findings routed to owning batches (orchestrator-maintained)

Findings from post-merge / background reviews that were NOT fixed in the originating PR. Each line names the owner; the owner's brief must include it; the consolidated end round re-verifies every line.

## From Codex review of F1 (#55, merged 9c33dfaf)

- [T2 #38] `ComboboxChipRemove` (`combobox.tsx:839`): hover ink tint but no active step → the Chip primitive's remove `IconButton` supplies hover + pressed via the recipes. FilterChip's selected remove action likewise (`fillInteractive.foreground`).
- [P1 #45] `date-picker.tsx:317`: selected day keeps `bg-primary` on hover with no selected-active override → selected day uses F2's `solid` recipe incl. `fillInteractive.primary` pressed rung.
- [N1 #43] `segmented.tsx:48` and `tabs.tsx:221`: selected items exclude hover/active via `not-data-pressed:*` / `not-data-[active]` → the `selectedChip` recipe must give selected items a hover (surface-2 → surface-3 step) and a pressed rung; probe `active-same-as-hover` must be 0 on segmented/tabs/toggle-group.
- [Fo1 #39] `number-field.tsx:144` hand-writes the hover/active recipe → use `surfaceInteractive`; `apps/docs/components/preview/auto-save-input.tsx:166` legacy wash → recipe.
- [T2 #38] `pagination.tsx:102` hand-writes the recipe → `IconButton`/recipe.
- [Do1-b #48] docs chrome: `home-footer.tsx:40`, `home-system-trace.tsx:277` legacy washes without pressed state → recipes.
- [G1-b #49] lint rule: a `hover:bg-*` (or `hover:` ink tint) on an interactive element without a sanctioned `active:` rung in the same literal (or via the recipes) fails closed — extends `no-hover-fill-literal`; negative fixture. Also: the 320 px contract check must re-resolve the fixture locator (relative-time re-renders → `Element is not attached to the DOM` on Linux).
- [F1-docfix, now] `theming.mdx:63`, `colors.mdx:171` teach the deleted `--alpha-surface-subtle`; `design.md` §Surfaces "solid" border (now a derived alpha), "seven-token ramp" (omits `subtle-active`; `colors.mdx:72` says six), secondary "card fill + border" (it is `surface-1`, transparent base border), off-track `track` (deleted); `contrast-check.mjs:60` gates `media-scrim` at 3:1 only — require 4.5:1 for `media-foreground` on `media-scrim` if labels are permitted, else narrow the token contract to `media-scrim-strong` for text; `foundations.tsx:242` `SurfaceLadder` specimen labels opaque rungs as `--alpha-hover`/`--alpha-pressed` — render real `foreground` alpha washes over ≥2 host surfaces.
- [Needs MK #1] bordered controls hover by fill (shipped) vs P1's border-hover rule — unresolved; F2 proceeds with fill.

## From Codex review of Do1-a (#54) — routed items

- [F2 #33] Button API table: `variant`/`size` lack `@default` + description (CVA-derived) → JSDoc them on `ButtonProps`.
- [G1-b #49] contract lane probes `[data-vrt-preview].first()` only → probe every contract-listed fixture (or an explicit fixture id); the 24px-target defects on timeline/data-grid/text-edit hero fixtures (bugs.md) must then be fixed by T1/M2/C1.
- [Do1-b #48] remove the two transitional bridges: `AutoTypeTable: ApiTable` MDX-map alias and the slug-inferred `registry` frontmatter; make component frontmatter required; delete `RegistryInstallCallout` if #54's fix did not already.

## From Codex review of I1 (#57) — routed items

- [#58] icon gallery route segment (DC-16).
- [D3 #51] `motion` 13: factory uses `MotionConfig`/`useReducedMotion` only (the undocumented `useReducedMotionConfig` is being removed by the I1 fix) — re-verify after the major.
- [Needs MK #3/#5] measured thresholds (lines 12,951 vs <12,000; −1.56 MiB vs ≥2 MiB); upstream 467 icons vs pinned 439.

## From N1 (#43) implementer notes

- [pixel review, wave 4] N1 chip track = `surface-1` (the rail rung), selected chip = `surface-3`: in light the selected chip is one step darker than its track (per F1 "selected = pressed rung"). Eyes on tabs pill/chip, segmented, toggle-group in the wave-4 capture.
- [end round] `scroll-area.tsx` `useScrollable` duplicates T1's `useOverflow` (kept local to avoid `@vegastack/tooltip` behind every ScrollArea). Consolidate: move `useOverflow` to its own registry hook (`use-overflow`) with no tooltip dependency; ScrollArea, MessageScroller, Board, sidebar-rail, Table, ComparisonMatrix, Terminal, TruncatedText consume it.

## From F2 (#60) implementer notes

- [runner, DONE 14:35] boxes replayed a stale Turbopack cache (`apps/docs/.next`) written before a rebase → `remote-gates-v3.sh` now removes `apps/docs/.next`, `apps/docs/out`, and `.turbo` after the remote checkout.
- [G1-b #49] `packages/ui/test/` is outside the `@vegastack/ui` tsconfig `include` → add it and fix the ~12 surfaced errors (Needs MK #10 — recommend proceed).
- [G1-b #49] the `relative-time` target-floor race (probe measures a rect, then hit-tests; the self-rescheduling fixture re-renders in between) — harden the probe (`bugs.md`, 2026-09-08).
- [tooling/end round] `probe-states.mjs` presses menu/popover triggers, whose backdrop swallows later hovers → re-measure SP-04 rows with a hover-only pass before "fixing" split-button/popover/sheet/dialog triggers.
- [end round] `paginationLinkVariants` keeps a size key `icon` (sizes an `<a>` tile) — deliberate, not missed work.
- [G1-b #49 if MK approves #11] AGENTS.md hover-fill sentence wording.

## From T1 (#61) implementer notes

- [G1-b #49] the scoped contract lane (`contracts-run.mjs` `TITLE_SUFFIXES`) excludes any test whose title is not one of the two generated suffixes → T1's three named table-family tests run only in the full sweep. Extend the scoped lane to include named tests for routes in scope (and keep the expected-count maths honest; T1 added `FIXED_TEST_COUNT` for the full sweep).
- [Needs MK #8] T1 LOC reduction 249 vs ≥300 — recommendation: accept (the remainder is documentation and new behaviour; the shared-Cell option is two different hook contracts).

## From T2 (#63) implementer notes

- [G1-b #49] `verify-component-contracts.mjs` hard-codes the inventory count → derive from `registry.json` (Needs MK #17).
- [end round] T2 touched `board`/`sortable-list`/`dropzone` for the `getLiveRegionProps` → `Announcer` API move (P1 owns those files — P1's rebase must keep T2's change).

## From the orchestrator's throughput analysis (17:55 IST, 2026-09-08)

- [G1-b #49, needs MK] the scope classifier treats every regenerated surface (catalog, matrix, integrity manifest, §Numbers, changelog page) as global, so a rebase that changes nothing but generated files forces the full 110-route contract sweep (~10 min idle, ~25 min under load). Proposal: classify regenerated-only diffs by their AUTHORITY inputs (a diff whose non-generated files are ledgers/changelog only is non-visual → scoped lane), with a negative fixture proving a real component change still goes global.
- [G1-b #49, needs MK] a receipt carry for rebases whose diff vs the receipted tree is empty outside generated + ledger files (same shape as `gate-receipt-carry.mjs` for version bumps, same `receipt-guard` re-derivation from git).
- [runner, DONE] one browser lane per box; two lanes per box measured 2x slower per run and 60% unit-lane failure under load.

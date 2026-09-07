# 04 — Cross-cutting consistency (Phase 3)

**Method:** a Node scan over the 110 canonical component sources (`packages/ui/registry/ui/*.tsx`,
tests excluded) for the patterns the nine batches kept meeting, plus the same-role comparisons
each batch recorded. Counts below are from that scan on 2026-09-07; they are the "before" numbers
each fix batch should drive to zero (or to the stated allowlist).

## 1 · The consolidation map

Every duplicate the batches found, collapsed to the single primitive that replaces it. This is the
skeleton of the fix batches in `99-change-list.md`.

| new shared thing                                                                        | replaces                                                                                                                                                                                                                        | evidence                                        |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Surface ladder tokens** `surface-1/2/3`, `--alpha-hover/pressed`, alpha borders (P1)  | `secondary` = `muted` = `accent` (identical), `card` darker than page, `sidebar-*` second palette, 9× `hover:bg-accent` + 21× `hover:bg-muted` + 2× `hover:bg-sidebar-accent` that are invisible on card                        | 01-system S-01 · B1 · B6-01 · `03-proposals` P1 |
| **Button `variant × tone`** (P2)                                                        | 11 Button variants incl. `success`/`warning`/`glass`, per-consumer colour overrides                                                                                                                                             | B1 · `03-proposals` P2 · D16                    |
| **`Chip`** primitive                                                                    | `Tag`, `FilterChip`, `ComboboxChip`, `Badge bordered`, ChipInput's chip                                                                                                                                                         | B5-03                                           |
| **`IconButton` everywhere** (+ `shape="round"`)                                         | 18 hand-rolled `<button>` icon controls in 11 files (alert, banner, attachment, data-grid ×2, data-list ×5, filter-bar, onboarding ×2, pagination ×2, password, tag ×2, dialog close); 48× `rounded-full` overrides in 22 files | B3-05 · B4-07 · B6-05 · B7-06 · B8-08           |
| **`selectedChip` recipe**                                                               | Tabs `pill`, Tabs `chip`, Segmented, Toggle pressed, ToggleGroup pressed                                                                                                                                                        | B6-02 · D20                                     |
| **`floating-surface` plumbing** (one `FloatingContent` + `FLOATING` constants)          | 7 copies across popover, dropdown, context-menu, select, combobox, hover-card, tooltip, navigation-menu                                                                                                                         | B3                                              |
| **Panel-search recipe**                                                                 | Command search, Combobox panel input, EmojiPicker boxed `Input`, ShortcutOverlay filter                                                                                                                                         | B3 · B8-04 · B9-11                              |
| **`media-player-controls`** item + `useMediaShortcuts`                                  | `MediaPlayerControls` inside audio-player (1,432 lines) consumed by video-player; shortcuts implemented twice                                                                                                                   | B4-02                                           |
| **`Slider` `variant`/`orientation`/`thumb` props**                                      | 76 descendant overrides in audio-player (`[&_[data-slot=slider-*]]`)                                                                                                                                                            | B4-05                                           |
| **`data-table-parts`**                                                                  | DataList / DataGrid sort header, selection, skeleton, empty row                                                                                                                                                                 | B5-02                                           |
| **`prose` recipe**                                                                      | MarkdownView components map, TextEdit `[&_h1]` selectors (69 descendant rules)                                                                                                                                                  | B4-09                                           |
| **`use-announcer`**                                                                     | 3 hand-rolled `{text, seq}` announcers (chip-input, data-grid, editable-cell) + the copies inside `use-drag-reorder` and `use-file-drop`; 24 `role="status"` in 18 files, 13 `aria-live` in 12                                  | B5-05 · B8-05                                   |
| **`use-media-query`** (+ `usePrefersReducedMotion`, `useIsMobile`)                      | 6 `matchMedia` subscriptions in 4 files + `use-mobile` + `use-platform`'s touch query                                                                                                                                           | B9-03                                           |
| **`mergeRefs` in `@vegastack/design`**                                                  | 10 inline `typeof ref === "function"` merges in 9 files, plus the export hiding in `use-animation-replay`                                                                                                                       | B9-03                                           |
| **`use-inline-edit`**                                                                   | FieldInline and EditableCell state machines                                                                                                                                                                                     | B9-06                                           |
| **`drag-item` classes**                                                                 | identical 6-utility drop-edge/dim/pending recipe in Board and SortableList                                                                                                                                                      | B8-05                                           |
| **`motion-dock` utility pair**                                                          | ActionBar and MessageScrollerButton enter/exit recipes (and their inverted timings)                                                                                                                                             | B8-11 · B9-08                                   |
| **`--media-scrim` / `--media-foreground` tokens**                                       | `primary`-based overlay chrome that inverts in dark                                                                                                                                                                             | B4-01                                           |
| **`createAnimatedIcon` factory**                                                        | 439 copies of the icon controller (79k lines)                                                                                                                                                                                   | B9-01                                           |
| **`geo-data` lib item**                                                                 | datasets embedded in country-select / region-select                                                                                                                                                                             | B8-02 · D27                                     |
| **`--layout-*` tokens** (`header-height`, `sidebar-width-mobile`, `overlay-max-height`) | `h-14`, `18rem` fallback, 7× `max-h-[calc(100dvh-var(--spacing)*64)]` in 6 files                                                                                                                                                | B6-08 · B8-06 · B9-11                           |

## 2 · Numbers (before)

| pattern                                                               |          files |           hits | disposition                                                                                                                                                             |
| --------------------------------------------------------------------- | -------------: | -------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size="default"` at call sites / cva size keys named `default`        |         3 / 31 |        10 / 31 | rename to `md` (B1-05); the cva keys are the real work                                                                                                                  |
| `motion-reduce:` utilities                                            |             11 |             17 | **all redundant** — `base.css:82-90` already zeroes every animation/transition under reduced motion with the one sanctioned `!important`; delete and add a lint ban     |
| raw numeric `size-N` / `h-N` / `w-N`                                  |             50 |            182 | top offenders `h-4` 14, `size-4` 11, `h-5` 10, `size-2` 9, `h-6` 8; move to `--icon-*` / `--size-*`; allowlist `h-px`, `w-0`, `min-w-0`, `h-0.5` hairlines, `w-full`    |
| fixed widths `w-56…w-80`                                              |              5 |              8 | date-picker, emoji-picker, hover-card, onboarding-checklist, popover: `w-full` or a `--panel-width-*` token                                                             |
| physical `ml/mr/pl/pr`                                                |              9 |             32 | logical `ms/me/ps/pe`; lint rule missing                                                                                                                                |
| physical positional `left-N`/`right-N`                                |              8 |             15 | `start-`/`end-` (sheet sides are the one legitimate physical use)                                                                                                       |
| `text-left`/`text-right`                                              |              5 |              5 | `text-start`/`text-end`                                                                                                                                                 |
| `outline-none`                                                        |             16 |             35 | keep on non-focusable popup containers; **remove on text-entry controls** (input, textarea, number-field, otp-input, text-edit, attachment trigger) per B1-01           |
| focus outline restated (`focus-visible:outline…`)                     |              5 |              7 | delete (global rule)                                                                                                                                                    |
| `ring-N` box-shadow rings                                             |              6 |             10 | media focus ring (B4-03, D17), avatar/switch/date-picker/bubble — each becomes a border or the standard outline                                                         |
| `text-xs` (11px) on non-mono                                          |              4 |              7 | `text-sm` (12px); `text-xs` stays mono-only                                                                                                                             |
| `hover:bg-accent` / `hover:bg-muted` / `hover:bg-secondary` / sidebar | 7 / 14 / 1 / 1 | 9 / 21 / 1 / 2 | one `hover:bg-surface-2` (P1)                                                                                                                                           |
| `bg-muted` as a fill                                                  |             40 |             87 | audited per-use in P1 migration: wash → `surface-2`, chip/track → `surface-3`                                                                                           |
| `shadow-*` other than `shadow-overlay`                                |              2 |              7 | button `cta` glow + field — delete (flat doctrine)                                                                                                                      |
| descendant overrides `[&_…]` / `[&>…]`                                |        42 / 11 |       373 / 32 | audio-player 76, text-edit 69, bubble 25, field 24, combobox 21 — each above 20 is a missing prop                                                                       |
| `"use client"`                                                        |      84 of 110 |              — | 12 carry the directive with no hook or handler (avatar, button, collapsible, field, progress, resizable, scroll-area, separator, slider, switch, tabs, toggle) — see §5 |
| `role="alert"`                                                        |              3 |              6 | alert, field, field-inline → `status` policy (B7-02)                                                                                                                    |
| longest files                                                         |              — |              — | audio-player 1,432 · data-grid 1,263 · sidebar 867 · combobox 848 · date-picker 825 · emoji-picker 705 (300 lines are data) · data-list 693 · filter-bar-managed 692    |

## 3 · Spacing rules

Observed inner-gap spectrum: `gap-1` 92 · `gap-2` 104 · `gap-1.5` 31 · `gap-0.5` 12 · `gap-3` 14 ·
`gap-4` 23 · `gap-6` 1 · `gap-8` 1. Padding: `px-2` 37 · `px-3` 35 · `px-4` 9 · `py-1` 33 ·
`py-1.5` 20 · `py-2` 17 · `py-3` 7.

The system already lives on a 4/8/12/16 ladder; the 31 `gap-1.5` and 20 `py-1.5` are the tell of
hand-tuning. Proposed doctrine (design.md §Spacing amendment):

- **Inline gap** between an icon and its label: `gap-1.5` at `sm`, `gap-2` at `md`+ — the only
  sanctioned 6px.
- **Control padding** is derived, never chosen: horizontal `px-2` (xs/sm), `px-3` (md), `px-4` (lg);
  vertical comes from `h-(--size-*)` with `items-center`, so `py-*` on a control is a smell.
- **Container padding tiers:** `p-2` compact (menus, popovers' lists), `p-3` dense card/`sm`,
  `p-4` default card, `p-6` modal (B3 decision: 24px dialogs, 16px popovers).
- **Stack gaps:** `gap-1` within a text stack (title/description), `gap-2` between controls in a
  row, `gap-3`/`gap-4` between blocks, `gap-6` between sections. Nothing else.

## 4 · Type roles

`text-base` (14) 89 hits · `text-sm` (12) 58 · `text-label` 63 · `text-label-sm` 37 · `font-medium` 42. The 42 `font-medium` are mostly re-stating what `text-label*` already carries; after B7-05 (Item
title 14/500) the rule is: **`text-label*` is the only way to get 500**, `font-medium` on a body
class is banned by lint.

## 5 · Server-safe audit

84 of 110 files are client. Twelve carry `"use client"` without any hook, handler or browser API in
the file (avatar, button, collapsible, field, progress, resizable, scroll-area, separator, slider,
switch, tabs, toggle). Base UI primitives are already client modules, so a wrapper that only
composes them can stay server-safe — **but** a `"use client"` module turns _every_ export into a
client reference, so `buttonVariants` imported into a server component is a runtime error, not a
style nit. `verify-rsc-safety.mjs` checks the hook → directive direction only. Add the converse:
a directive with nothing client-side in the file fails, with an allowlist for the two known
exceptions (Base UI `render` wrappers that pass callbacks).

## 6 · Same-role comparisons (summary of the per-batch verdicts)

- **Hover** is invisible on every card-coloured surface in light; the one real hover step hides in
  `sidebar-accent`. P1.
- **Focus** has three grammars: global 2px outline, text-entry border tint (`outline-none`), media
  box-shadow ring. Doctrine keeps two (outline; border tint for text entry **with** a forced-colours
  fallback). D17.
- **Selected** has four looks (raised chip, `bg-foreground/10` toggle, primary fill, accent wash).
  One raised-chip recipe for segmented controls, `primary` fill for the calendar day, `surface-3`
  for list selection.
- **Dismiss/close** has five icon-button implementations; one `IconButton ghost xs`.
- **Live regions**: 24 `role="status"`, 3 seq announcers, 6 `role="alert"`; one hook, one policy.
- **Motion**: 45 `duration-fast` vs 12 `duration-base` vs 2 `duration-slow` — the system is
  already "fast by default"; the two `slow` are the inverted exits (B8-11/B9-08). Overlay enter/exit
  per B3 decision; docked controls 150/100; no scale on bars; icon swaps instant (B8-08).
- **Empty/loading/error**: Empty and Skeleton are consistent; `Progress` indeterminate renders
  full (B7), DataGrid hides columns silently (B5-04), Board/Sortable pending pulse is fine.

## 7 · Lint rules to add (hand-off to the tooling batch)

1. `no-physical-direction`: `ml|mr|pl|pr|left-|right-|text-left|text-right` outside an allowlist
   (`sheet` sides, `rtl:` variants).
2. `no-raw-size`: numeric `size-|h-|w-` outside the hairline allowlist.
3. `no-motion-reduce`: the global rule owns it.
4. `no-restated-focus`: `focus-visible:outline*` outside `input`-class files.
5. `no-font-medium-on-body`: `font-medium` only inside `text-label*` definitions.
6. `no-hover-fill-literal`: `hover:bg-(accent|muted|secondary|sidebar-accent)` → `surface-2`.
7. `no-inline-ref-merge`: `typeof ref === "function"` → `mergeRefs`.
8. `no-status-seq`: `seq: prev.seq + 1` → `useAnnouncer`.
9. `max-descendant-overrides`: warn above 20 `[&_` per file.
10. `client-directive-needed`: converse of RSC safety (§5).
11. `no-viewport-magic`: `100dvh-var(--spacing)*N` → `--layout-overlay-max-height`.
12. `no-trailing-space-in-class`: catches `"… "` literals (password-input, others).

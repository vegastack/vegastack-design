---
title: "P1 · Pickers and drag: DatePicker layout, shared searchable select + geo-data, drag-item recipe, Board/Dropzone fixes"
labels: [audit-2026-09, components, forms]
---

## Context

Audit 2026-09-07, `02-batch-08-pickers-drag.md` B8-02, B8-03, B8-05, B8-06, B8-07, B8-12.
Decisions: D25 (react-day-picker sanctioned — written into AGENTS.md by **D1**), D27 (shared
searchable select + `geo-data` lib item). Depends on F1 (hover/pressed on cards and days), F2
(`icon-md` day buttons), O1 (`panelSearch` recipe for EmojiPicker), M2 (ActionBar toolbar/motion).

## Problem

- `date-picker.tsx:555` `w-56` and `:761` `w-72` — the only fixed-width form controls in the
  system (wider than a 320px content area); `:146` caption `px-7` hand-tuned clearance; `:307`
  day buttons use `buttonVariants({ size: "icon" })`; the "v9" comment at `:30` is stale (v10).
- `country-select.tsx:330-380` and `region-select.tsx:140-230` build the same Select-shaped
  Combobox; `region-select-data.ts` is 50 KB / 1,389 lines inside a component file, the country
  list 20 KB inside `country-select.tsx`; `region-select.json` is 67 KB per consumer.
  `region-select.tsx:218-225` toggles selection in item `onClick` with the root `onValueChange`
  deliberately unwired, so keyboard and pointer selection follow two code paths.
- `board.tsx:448-455` and `sortable-list.tsx:177-188` carry the identical six-utility drop-edge /
  dim / pending recipe.
- `board.tsx:490` `cursor-grab` even when `pointerDisabled` (mobile / `dragDisabled`); `:491`
  invisible `hover:bg-accent`; `:400` `max-h-[calc(100dvh-var(--spacing)*64)]`.
- `dropzone.tsx:134-135` tints only a descendant `[data-slot=empty]`; a non-Empty child shows no
  drag-over state.
- Board/SortableList/Dropzone have two previews each; no keyboard-move or locked-lane fixture in
  the contract lane.

## Do

1. DatePicker: triggers `w-full` (consumers constrain via parent; docs examples updated), caption
   as a `grid-cols-[auto_1fr_auto]` with no padding hack, day buttons `icon-md`, selected day uses
   the F2 `solid` recipe; fix the version comment.
2. `searchable-select.tsx` (registry item): Combobox preset with the Select-shaped trigger,
   `panelSearch` input, check on the selected row, `w-(--anchor-width)` panel, optional clear `X`
   on the trigger; selection via Base UI `value`/`onValueChange` only. `CountrySelect` and
   `RegionSelect` become thin wrappers.
3. `geo-data` registry item (`registry:lib`): `COUNTRIES`, `REGIONS`, `getCountryByCode`,
   `getRegions(country)`; both selects declare it in `registryDependencies`; datasets removed
   from component files. `verify-registry-deps` covers the new type.
4. `drag-item.tsx` next to `use-drag-reorder`: exported `dragItemClasses` (or a `DragItem` slot
   component) with the drop-edge hairlines, lift dim and pending pulse; Board and SortableList
   consume it.
5. Board: `cursor-grab` only when `!pointerDisabled && !readOnly`; hover via F1; `columnMaxHeight`
   prop (CSS length, default `--layout-overlay-max-height`-style token).
6. Dropzone: the surface itself carries `data-dragging:outline-2 outline-primary/…` (and
   destructive for invalid) inside its `rounded-lg`; `Empty bordered` reads it via
   `group-data-dragging/dropzone`.
7. Fixtures: Board keyboard move + locked lane, SortableList menu path, Dropzone dragging state
   (static `data-dragging` prop for the lane).
8. Doctrine: `design.md` §Form controls — no fixed-width controls; §Drag — one item recipe.

## Acceptance

- `wc -c apps/docs/public/r/region-select.json` < 8 KB; `geo-data.json` carries the data once.
- Keyboard Enter and pointer click select the same region through one code path (unit test).
- 320px capture of the range picker fits the content area.
- `probe-states.mjs --routes board,sortable-list,dropzone,date-picker,country-select,region-select`
  clean; `pnpm gates:component` for all six + emoji-picker.

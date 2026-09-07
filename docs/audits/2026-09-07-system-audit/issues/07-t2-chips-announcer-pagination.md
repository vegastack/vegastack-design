---
title: "T2 · One Chip primitive, one announcer hook, pagination landmark, filter fixes"
labels: [audit-2026-09, components, data, a11y]
---

## Context

Audit 2026-09-07, `02-batch-05-data.md` B5-03, B5-05, B5-06, B5-08, B5-14; `04-cross-cutting.md`
§1 (announcer copies). Depends on F1 (hover/pressed on chips) and F2 (`IconButton` for the pager
and chip remove control).

## Problem

- Four chip recipes: `Tag` (`tag-group.tsx:82-120`), `FilterChip` (`filter-bar.tsx:197-274`),
  `ComboboxChip`+`ComboboxChipRemove` (`combobox.tsx:795-847`), `Badge bordered`, plus ChipInput's
  chip. Their remove buttons differ: `Tag` `::before` hit area, `FilterChip` a real 24px box with
  margin arithmetic, `ComboboxChipRemove` a bare 16px box with **no hit-area expansion** (WCAG
  2.5.8 miss the contract lane has not caught).
- Live-region announcer hand-rolled three times (`editable-cell.tsx:216-226`,
  `chip-input.tsx:195-206`, `data-grid.tsx:655-661`) and again inside `use-drag-reorder.ts` and
  `use-file-drop.ts`; 24 `role="status"` nodes in 18 files.
- `pagination.tsx:51-57` hard-codes `role="navigation" aria-label="pagination"` → axe
  `landmark-unique` with two on a page; `PaginationPager` uses raw `<button>`s (`:341-364`).
- `comparison-matrix.tsx:98,207` tints the promoted plan with `info`.
- `filter-bar.tsx:133` corrupted JSDoc default.

## Do

1. `chip.tsx` (registry item `chip`): `hue`, `size: sm | md`, `active`, `onRemove` → a real
   24px remove `IconButton size="xs"`; `Tag`, `FilterChip`, `ComboboxChip`, ChipInput chips compose
   it via `render`; `Badge bordered` stays a badge. Contract lane: target-size probe on the
   `comboboxMultiple` fixture.
2. `use-announcer.ts` (registry hook): `const { announce, Announcer } = useAnnouncer()`; the five
   copies use it (editable-cell, chip-input, data-grid, use-drag-reorder, use-file-drop; CopyButton
   too). One `role="status" aria-live="polite" aria-atomic` node per component.
3. Pagination: `<nav aria-label={label ?? "Pagination"}>` with no explicit role; docs name each
   instance; `PaginationPager` composes `IconButton variant="ghost" size="sm"`.
4. ComparisonMatrix promoted column → `surface-2`/`primary` alpha (F1); fix the FilterBar JSDoc;
   add previews/tests for property-list, comparison-matrix, tag-group per B5-14.
5. Doctrine: `design.md` §Chips (one primitive, remove control 24px), §Live regions (one hook).

## Acceptance

- `grep -rn "seq: prev.seq + 1" packages/ui/registry/ui` → 0; `role="status"` count ≤ 1 per
  component that announces.
- axe on the pagination page: no `landmark-unique`; contract-lane target-size check passes on
  combobox chips.
- `probe-states.mjs --routes tag-group,filter-bar,combobox,chip-input,pagination` shows hover and
  pressed on every chip and pager control.
- `pnpm gates:component chip tag-group filter-bar filter-bar-managed combobox chip-input pagination
editable-cell data-grid comparison-matrix`.

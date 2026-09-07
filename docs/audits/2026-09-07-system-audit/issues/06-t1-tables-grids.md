---
title: "T1 · Tables and grids: focusable region, wrapping default, shared table parts, honest mobile"
labels: [audit-2026-09, components, data, a11y]
---

## Context

Audit 2026-09-07, `02-batch-05-data.md` B5-01, B5-02, B5-04, B5-07, B5-09…B5-13; `07-state-probe.md`
SP-03 (clipped focus on cells), SP-05 (chart focus). Decision D18: cells **wrap by default**,
`nowrap` opt-in per column (numeric/mono stay nowrap). Depends on F1 (surface ladder for
row/header hover).

## Problem

- `table.tsx:82-92` scroll container has no `tabIndex`/name → axe `scrollable-region-focusable`
  on the Table page and the dashboard block; a wide table cannot be scrolled by keyboard.
  ComparisonMatrix (`comparison-matrix.tsx:75-81`) and Terminal already do it right.
- `data-list.tsx` (692 lines) and `data-grid.tsx` (1,262) share **no** parts: sort header
  (`data-list.tsx:496-525` / `data-grid.tsx:984-1007`), selection maths (`:388-417` / `:789-805`),
  skeleton rows (`:536-559` / `:1093-1111`), empty row (`:560-580` / `:1112-1132`), `alignClass`,
  toolbar/footer slots.
- `data-grid.tsx:149` `mobile` defaults to `"hidden"`: at 320px only "Name" survives, no hint —
  against `design.md` "data is never silently lost".
- `table.tsx:226,255` `whitespace-nowrap` on every head/cell.
- `data-grid.tsx:1033` always renders the Columns picker; `table.tsx:35,42` two ways to reach the
  container; `TableRow` hover tints header rows (`:194`); `property-list.tsx:55` fixed 112px label
  track; `chart.tsx:194,320` 11px ticks/tooltip; the roving `data-grid-cell` focus ring is clipped
  by `table-container`; recharts `accessibilityLayer` svg has no visible focus.

## Do

1. Table container: `role="region"`, `tabIndex=0` **only when scrollable** (measure on mount +
   resize; share the `useOverflow` hook from TruncatedText), `aria-label` from the caption or a
   prop, inset focus ring (`focus-visible:-outline-offset-2`). DataList/DataGrid inherit.
2. Default wrap (`overflow-wrap: anywhere` on body cells, min column widths); `nowrap` per column
   via `DataListColumn.nowrap` / `DataGridColumn.nowrap`, default `true` for `align="end"` numeric
   and `mono` columns.
3. `data-table-parts.tsx` (internal): `SortHeaderButton`, `SelectionCell`, `SelectAllHead`,
   `SkeletonRows`, `EmptyRow`, `useRowSelection`, `alignClass` — used by both; DataList stays
   presentational, DataGrid keeps its engines (TanStack, virtual).
4. DataGrid `mobile` default `"merge"` (secondary columns stack into the primary cell) + a
   "N columns hidden" toolbar hint whenever revelation dropped anything; `columnPicker` prop
   (default `true`) rendered in the toolbar trailing slot.
5. Header rows do not take the row hover; keep `containerProps` only; PropertyList label track
   `minmax(calc(var(--spacing)*20),max-content)` + `@container` stack below `@xs`; chart ticks
   `text-sm`, numerals `text-code-sm`; chart container `[&_svg:focus-visible]` inset outline; cell
   focus ring inset.
6. Contract lane: a wide-table fixture (keyboard scroll), a long-cell fixture (wrap), a 320px
   DataGrid fixture asserting no data loss.
7. Doctrine: `design.md` §Tables (wrap default, named scroll regions), §DataGrid (merge, hint).

## Acceptance

- axe: no `scrollable-region-focusable` on table, data-list, data-grid, dashboard-01 routes.
- `wc -l data-list.tsx data-grid.tsx` down by ≥300 lines combined; both consume `data-table-parts`.
- 320px capture of `dataGridEditable` shows Stage and Amount merged into the Name cell or a hint.
- `probe-states.mjs --routes table,data-list,data-grid,chart,property-list` → 0 `focus-clipped`,
  0 `focus-none` on svg.
- `pnpm gates:component table data-list data-grid property-list chart comparison-matrix`.

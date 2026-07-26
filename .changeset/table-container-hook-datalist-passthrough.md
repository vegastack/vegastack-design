---
"@vegastack/ui": minor
---

Give `Table` a styling hook for its scroll container, and let `DataList` pass the whole Table
surface through.

- `Table` gains `containerClassName` and `containerProps` (including `ref`), both forwarded to the
  existing `data-slot="table-container"` element that owns `overflow-x-auto`. Sticky headers,
  fixed-height viewports, and virtualizers finally have somewhere to attach — the `<table>` itself
  cannot own a scroll viewport.
- `DataListProps` now extends `Omit<TableProps, "children">` instead of the raw `<table>` props, so
  `grid`, `headerTone`, `density`, and the new container hooks type-check on `DataList` (they always
  reached `Table` at runtime; TypeScript rejected them).
- `DataListColumn` gains `cellClassName?: (row, index) => string | undefined` — a per-cell class
  hook merged after the per-column `className`.
- A column `render` now receives an optional third argument, `DataListCellContext`
  (`{ rowId, columnKey, selected }`). Existing two-argument render functions are unaffected.

All additive; no behaviour or visual change for existing consumers.

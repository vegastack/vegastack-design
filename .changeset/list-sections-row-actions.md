---
"@vegastack/ui": minor
---

🔧 **DataList** gains collapsible `sections` (with `getRowSection` and `groupState`/`defaultGroupState`/`onGroupStateChange`) and a `rowActionsColumn` helper: one ⋯ menu per row, named `Actions for {row}`, with link actions, destructive ink, disabled actions that stay reachable and read their reason, and a single-icon shortcut. The parts behind them — `SectionRow`, `SectionToggle`, `GroupState`, `RowAction`, `RowActionsMenu`, `RowActionMenuItems` — are exported from `data-table-parts`. **DataGrid**'s group header now uses the same toggle: its count reads in muted tabular numerals without parentheses ("Open 2", heard as "Open, 2 rows").
[docs](https://design.vegastack.com/docs/components/data-list) · [docs](https://design.vegastack.com/docs/components/data-grid)

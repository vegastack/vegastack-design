---
"@vegastack/ui": minor
---

⚠️ **Table cells wrap by default.** Every head and cell carried `whitespace-nowrap`, so one long
value forced the whole table to scroll instead of wrapping at a word boundary. Body cells now use
`overflow-wrap: anywhere` over a `--table-cell-min-width` floor, and scrolling is reserved for
tables that are genuinely wide. Two column shapes opt back out automatically — `align="end"` figures
and the new `mono` columns — and `DataListColumn.nowrap` / `DataGridColumn.nowrap` override the
inference either way. A layout that relied on single-line cells should set `nowrap: true` (or
`whitespace-nowrap` on a raw `TableCell`). Two further breaks land with it: `DataGrid`'s `mobile`
posture now defaults to `"merge"` rather than `"hidden"`, so overflow columns stack into the primary
cell instead of disappearing — `mobile: "hidden"` is still available, and when it drops anything the
toolbar states "N columns hidden"; and `Table`'s `containerClassName` is removed, because it did
exactly what `containerProps.className` does.
[docs](https://design.vegastack.com/docs/components/table)

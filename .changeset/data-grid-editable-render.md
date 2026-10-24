---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **DataGrid**: an `editable` column with a `render` keeps it as the cell's display while not editing (a `FieldCellDisplay`'s tags, chips or avatars), instead of the value as plain text; and a `custom` editor's `render` now receives the `row` with `value`, `commit` and `cancel` (the new `DataGridEditor<T>` type). [docs](https://design.vegastack.com/docs/components/data-grid)

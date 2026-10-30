---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **Grid cell editors that sit on the cell** (`field-cell`, `data-grid`): with `FieldCellEditor variant="cell"`, long text edits in place on the cell's own surface instead of a second popover that missed the cell; a person is the chosen people as removable chips over the people list, which leaves them out; a date and a date-time's date take the inline picker (`FieldInput` takes `variant="cell"` for it). `DataGrid`'s fill handle now sits under frozen cells, so it no longer draws over a frozen column when the grid scrolls sideways.

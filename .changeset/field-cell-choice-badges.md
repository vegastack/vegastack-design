---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **FieldCellDisplay**, **FieldCellEditor**, **FieldInput**, **DataGrid**: a choice value is drawn as a `Badge` filled in its option's hue — no outlined pill — in a cell, a phone card, the editor's list and a form trigger, through the new exported `FieldChoiceBadge` (`hue` + Badge's props), still two then "+N" with every name on hover and keyboard focus. A choice cell's editor no longer puts a field with a pill and a chevron inside the cell: the cell keeps its badges where they were, and the option list opens under it at once with the search field first, each option a badge with a check on the chosen ones and "Add “…”" when `onCreateOption` is given. A single choice commits on the pick; a multiple choice now toggles with the list open (it used to commit and close on the first pick) and commits on Tab, on Enter with no option highlighted, or when the list closes; Escape cancels. `DataGrid` no longer shows the fill handle on a cell being edited. [docs](https://design.vegastack.com/docs/components/field-cell)

---
"@vegastack/ui": patch
---

🐛 Grid rows, single choices and the summary row. `FieldCellDisplay variant="cell"` lays every value out on the 20px text line (`h-5`): a choice chip's 24px target, an avatar or a link made a cell 36px, which with the row's 1px rule grew a `DataGrid` `short` row to 37px whenever such a column scrolled into view, so rows changed height while scrolling sideways (most visibly when zoomed in). A single choice can now be cleared: _Clear selection_ ends its list in a cell, and the field takes a clear control. `GridSummaryCell` fills its cell edge to edge with a square hover wash and no border, the summary row has no fill, the Σ is fainter at rest and always starts the cell, a chosen function reads "⌄ Max 5,400" in the column's alignment, and choosing _None_ no longer leaves "Summarize" showing until another cell is clicked.

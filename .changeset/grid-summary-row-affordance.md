---
"@vegastack/ui": patch
---

🔧 `DataGrid`'s summary row reads as a row of controls instead of an empty row. It sits on a `bg-muted` band, like a group row. Each `GridSummaryCell` picker now spans its column, so hovering anywhere in the cell washes it and a click there opens the picker. An unsummarised cell shows a Σ at rest and adds "Summarize" and its chevron on hover or focus (always on a touch screen). A chosen function shows its name, its value and the chevron ("Max 5,400 ⌄"), aligned with the column.

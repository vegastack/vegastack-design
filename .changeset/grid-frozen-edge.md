---
"@vegastack/ui": patch
---

🐛 **DataGrid**: once the grid scrolls sideways, the frozen columns' edge shows a soft 4px shadow from the header through the summary row (light theme). The old per-cell shadow never painted: a table that collapses its borders draws no outer shadow on its cells. In dark theme there is no shadow; the frozen edge's `columnDividers` line brightens instead. The frozen edge's divider now also runs through the summary row.

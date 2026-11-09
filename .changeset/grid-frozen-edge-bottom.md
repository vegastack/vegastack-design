---
"@vegastack/ui": patch
---

🐛 **DataGrid**: the frozen edge's scroll shadow ends at the summary row when the grid is scrolled to its end, instead of running down the `endSpacer` band below it. The strip now sits in the scrolled content, sticky at the frozen columns' end, and is exactly as tall as the table.

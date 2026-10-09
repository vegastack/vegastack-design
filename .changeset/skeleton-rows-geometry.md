---
"@vegastack/ui": patch
---

🐛 `SkeletonRows` (the `DataList` and `DataGrid` loading rows) sizes each placeholder bar from its column's `minWidth` budget and follows the column's alignment, with an icon-sized square for a narrow ⋯ column, so a loading table's columns settle where the loaded table's do instead of jumping when the rows arrive.

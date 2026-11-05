---
"@vegastack/ui": patch
---

🐛 Pickers and the grid's summary row: `DateTimePicker` marks the chosen time with a check instead of a `primary` fill, and a chosen day in any popover calendar keeps its `primary-foreground` label on hover in the dark theme. A `FieldChoiceBadge` keeps its hue inside a highlighted Select, Combobox or Command row (`data-icon-tone`). In `DataGrid`, the summary row keeps one height before and after its picker mounts, and choosing a function there no longer scrolls the rows. `DataGrid`'s `short` rows are 36px (`h-9`, `py-1.5` cells) instead of the list's 32px compact step; `medium` (40px) and `tall` (80px) are unchanged. A filled `FieldCellDisplay variant="cell"` is now as tall as an empty one: its `TruncatedText` keeps the 24px target but lays out on the text line, so every row of a fixed-height grid is the same height.

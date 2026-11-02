---
"@vegastack/ui": patch
---

🐛 Table grid QA (Regent, 2 November). `DataGrid fill` re-measures when a banner or filter row above the grid comes or goes (it watched only the grid's own wrapper, which does not resize), so the viewport and its horizontal scroll bar return to the bottom. The docked selection bar no longer lifts a filling grid: its room is a band after the last row, inside the scroll, instead of an in-flow spacer that `fill` subtracted from the viewport (`DataList` and a grid that does not fill keep `SelectionBarSpacer`). A date cell's calendar opens from the first render and closing it with no day cancels the edit, so the floating editor and the page lock go with it (a double-click's second press no longer closes it, pressing the chosen day keeps it, and the × clears). Currency and percent cell editors are the plain editor Number has (no group border, steppers or symbol; a percent is typed as points). `DatePicker` gains `open` and `onOpenChange(open, details)`.

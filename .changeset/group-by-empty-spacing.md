---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **Display's Group by spacing**: a `flush` `SortableList` with no rows draws its footer as the list's first row — no top margin, padding, border or gutters — so an empty `GroupByPicker`'s "+ Group by" sits on the menu's inset under its heading like the rows around it. `DisplayMenu`'s Group by heading keeps a 4px step from the row above it.

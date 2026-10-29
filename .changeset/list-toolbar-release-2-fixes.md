---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **List toolbar fixes**: `DisplayMenu`'s Columns/Fields drill-in scrolls inside the menu (a 24-field table no longer runs off the screen). `ViewTabs` folded on a phone merges its `+` and the view's ⋯ into one ⋯, and `ListToolbar` now counts those buttons and keeps a folded tab dropdown at a readable width, so the view name no longer collapses to "All re…". `SortMenu` fields take `fixedDirection` (`"asc"`, `"desc"` or `"none"`) for a field the list sorts only one way: the direction shows beside the name and the direction group hides while it is chosen.

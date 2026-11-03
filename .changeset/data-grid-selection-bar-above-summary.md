---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **The selection bar paints above the grid.** `DataGrid` rendered its selection `ActionBar` inside the stacking context it creates for its sticky layers, so the summary row (`z-20`) and frozen columns (`z-30`) drew over the bar (`z-10`) wherever they met, as with 152 rows selected. The isolation now sits on `data-grid-viewport-frame`, round the layers it holds, and the bar, its end band and spacer, the `inert` exit and the `--dock-inset-bottom` docking are unchanged; dialogs and popovers opened from the bar still paint above it.

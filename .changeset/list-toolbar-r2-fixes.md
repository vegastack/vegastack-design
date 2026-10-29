---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **Segmented controls, popup search rows and empty lists**: a joined outline `ToggleGroup` (`spacing={0}`) keeps a pressed item's whole outline at every position — each item draws its four borders and overlaps its neighbour by a pixel, and the pressed one sits on top (Display's Row height, two or three options). `PanelSearch`'s hairline is a divider in the default `border` colour in every state; its field is caret-only. A `DataList` with no rows never says "N columns hidden" or how its rows are sorted.

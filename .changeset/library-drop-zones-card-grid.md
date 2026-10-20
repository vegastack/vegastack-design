---
"@vegastack/ui": patch
---

🔧 **DataList**, **SortableList**: a `DataList` list row that takes drops (`canDropOnRow`) takes them in its middle half only — its top and bottom quarters never nest, so a drag aimed between two rows can't land inside one (a grid card still takes a drop anywhere); `SortableList` `columns="cards"` lays a grid on `DataList`'s dense card grid, column for column and 12px apart, and a grid's gap no longer shrinks when a tile holds a small (`xs`/`sm`) control.

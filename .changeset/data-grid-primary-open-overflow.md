---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **DataGrid** keeps a long primary value readable beside the row's Open button. The button and an editable value sat side by side as inline boxes, so a value long enough to fill the column overflowed the cell by the button's width, and the cell's ellipsis then replaced the whole value — its ref or leading content included — with a lone "…". The button and the value now share one flex row (`data-grid-cell-lead`), the value takes the width that is left, and a long value ends in its own ellipsis. [docs](https://design.vegastack.com/docs/components/data-grid)

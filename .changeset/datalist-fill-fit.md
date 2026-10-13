---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **DataList** and **DataGrid**: fill and fit columns. The first column takes the width the others leave, wraps anywhere and (DataList) clamps a plain value at two lines with the full value in its tooltip; every other column is sized to its content on one line, and headers never break inside a word. One long unbroken value no longer squeezes every cell and header ("Prod" / "ucts"): the squeeze releases only the first column, then DataList merges another column, and only when nothing is left to merge does it strain (`data-strained`) the rest. `columnCellClass`, `headerCellClass` and `SortableHead` take a `fill` role, `isNowrapColumn` defaults non-first columns to one line (`nowrap: false` lets one wrap between words), and `revealColumns` takes `extraOverflow`. **BreadcrumbTrail**'s current step truncates with its full name in a tooltip on hover and focus; **PageHeader**'s title breaks an unbroken token anywhere, clamped or not.
[docs](https://design.vegastack.com/docs/components/data-list)

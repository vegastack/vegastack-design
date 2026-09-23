---
"@vegastack/ui": minor
---

🧩 DataList never forces a horizontal scroll, and the new DataListPager pages it.

- DataList columns take the same responsive posture as DataGrid — `minWidth` (default 120) and `mobile: "visible" | "hidden" | "merge"` (default `"merge"`) — now declared once on the shared column layout. In a narrow container, overflow columns stack into the first cell, `hidden` columns are dropped and counted in a line the table is described by, and `visible` columns never hide. See [Fitting the width](/docs/components/data-list).
- A merged value always wraps and wears its own column's face, so a `mono` or end-aligned first column no longer pins the stack to one line. If the table still overflows after that — a long unbroken value, a one-line mono id — it is squeezed (`data-squeezed`) and every cell may break rather than scroll.
- When the sorted column is merged or hidden, a "Sorted by …" line under the table states the order its header can no longer show. DataGrid does the same in its toolbar, describes the grid by both lines, and now gives merged values their header as a screen-reader prefix.
- DataList always renders one `data-list-root` stack, so its status lines never land in your own grid or flex container.
- Sortable headers use the plain header's `text-sm font-medium` and foreground ink in DataList and DataGrid. A selected row is `bg-muted/50`, so a `secondary` Badge on it stays visible.
- New [DataListPager](/docs/components/data-list-pager) for DataList's `footer` slot: a controlled range summary ("1–15 of 40"), a rows-per-page Select (15 / 30 / 50 by default), and windowed Pagination that hides on a single page. The page list narrows with the pager's width (`data-layout`: full, compact, minimal), so it fits any container of 200px or more. A `NaN`, `undefined` or negative `total` reads as 0, and a `pageSize` of 0 or less shows the first `pageSizes` entry instead of adding a bogus option.

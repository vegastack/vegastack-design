---
"@vegastack/ui": minor
---

🧩 DataList never forces a horizontal scroll, and the new DataListPager pages it.

- DataList columns take the same responsive posture as DataGrid — `minWidth` (default 120) and `mobile: "visible" | "hidden" | "merge"` (default `"merge"`) — now declared once on the shared column layout. In a narrow container, overflow columns stack into the first cell, `hidden` columns are dropped and counted in a line the table is described by, and `visible` columns never hide. See [Fitting the width](/docs/components/data-list).
- New [DataListPager](/docs/components/data-list-pager) for DataList's `footer` slot: a controlled range summary ("1–15 of 40"), a rows-per-page Select (15 / 30 / 50 by default), and windowed Pagination that hides on a single page.

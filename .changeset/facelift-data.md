---
"@vegastack/ui": minor
---

🐛 Tables and pagers read and tab the way they should: headers in the sans face, no tab stop per timestamp, pagination links that are links, and pager controls that are buttons.

- **DataList** and **DataGrid**: a `mono` column's header is in the sans face — `mono` styles body cells only, for codes and IDs (DS-01) — and clipped text or a `RelativeTime` in a cell is no longer a tab stop (DS-68). `headerCellClass` is exported from the shared table parts. [docs](https://design.vegastack.com/docs/components/data-list)
- **Pagination**: `PaginationLink` is a real `<a>` wearing the button recipe, so it keeps the link role (A11Y-23); the landmark is named "Pagination" (`label`) and the ellipsis copy is `morePagesLabel` (VOI-1). [docs](https://design.vegastack.com/docs/components/pagination)
- **DataListPager**: page controls are buttons with `aria-current="page"` on the current page; `onPageSizeChange` is optional, and without it there is no rows-per-page chooser (DS-27, DS-71). [docs](https://design.vegastack.com/docs/components/data-list-pager)
- **TruncatedText**: `IconText`'s label slot is `icon-text-label`, and `TableCellText mono` is `text-sm`. [docs](https://design.vegastack.com/docs/components/truncated-text)
- **useDragReorder** (and **SortableList**, **Board**): a handle that mounts after its row still owns the pointer drag (DS-70). [docs](https://design.vegastack.com/docs/components/sortable-list)
- Migration: a test that asserts `role="button"` on a pagination link, `font-mono` on a mono column's header, a timestamp in a table as a tab stop, `text-xs` on `TableCellText mono`, or the `icon-text-sm font-medium` slot now sees the new output; a DataListPager page control is a `<button>`, not an `<a>`.

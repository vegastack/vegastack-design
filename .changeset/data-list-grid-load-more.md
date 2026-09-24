---
"@vegastack/ui": minor
---

🔧 **DataList** and **DataGrid** page keyset lists with the shared LoadMore footer. DataList gains `loadMore` (the footer sits above `footer`, the loaded rows stay while the next batch loads, and the table reports `aria-rowcount="-1"` while more rows exist). DataGrid's footer is now LoadMore too: an outline button instead of a ghost one, Try again after `loadMore.error`, and no "All rows loaded" caption unless you pass `loadMore.endLabel`. `DataGridLoadMore` is a deprecated alias of `LoadMoreState`.
[docs](https://design.vegastack.com/docs/components/data-list) · [docs](https://design.vegastack.com/docs/components/data-grid)

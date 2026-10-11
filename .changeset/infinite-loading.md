---
"@vegastack/ui": patch
---

🔧 **LoadMore**: keyset lists load on scroll — no Load more button anywhere. A sentinel at the list's end fetches the next cursor page as it nears its scroll container's edge, skeleton rows hold the new rows' place while it loads, and one page is requested at a time. `onLoadMore`/`hasMore`/`loading`/`error` keep their meaning; `skeleton` and `rootMargin` are new and `label` is deprecated. A failed page still shows its error with Try again. `DataList` and `DataGrid` append skeleton rows to the table body, board lanes show skeleton cards, `SearchableSelect` pages inside its option list with skeleton options, `VersionList` pages on scroll, `RecordListMore` loads the next batch on scroll instead of a Show more button, `CommentList` loads older comments on scroll instead of Load earlier, `ActivityFeed` shows skeleton rows instead of a busy button, and `useAsyncSearch`'s `loadMore.loading` is now true only for a next page.
[docs](https://design.vegastack.com/docs/components/load-more)

---
"@vegastack/ui": minor
---

🔧 **SearchableSelect** searches on the server and picks several values: `remote` stops local filtering, `onSearchChange`/`loading`/`error`/`onRetry`/`loadMore` take `useAsyncSearch` as-is (with "Searching…" announced through the panel's own status region and the Load more footer under the rows), `leadingItems` stay first and unfiltered, `multiple` makes the value an array (`{a}, {b}` or `{n} selected`), `itemToDescription` and `itemToDisabledReason` add a described second line, `groupBy` adds headings and `renderTriggerValue` rewrites the trigger text.
[docs](https://design.vegastack.com/docs/components/searchable-select)

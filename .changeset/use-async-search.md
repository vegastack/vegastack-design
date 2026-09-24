---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🧩 **useAsyncSearch** — a new hook for server search over a cursor-paged list: the query updates as you type and the request waits for `TIMINGS.searchDebounceMs` (a new 300 ms timing in `@vegastack/design`), a newer request aborts the last and late responses are dropped, `loadMore` pages with the returned cursor, and a failure keeps the loaded items with a retry. Documented in the [components guide](https://design.vegastack.com/docs/guides/components).

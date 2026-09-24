---
"@vegastack/ui": minor
---

🔧 **SearchInput** and **FilterBar** send a settled query. SearchInput gains `onValueCommitted`, which fires after `debounceMs` of quiet (default `TIMINGS.searchDebounceMs`, 300 ms) and at once on Enter and on clear, while `onValueChange` keeps the field instant; FilterBar's `search` passes both through. FilterBar gains `searchPlacement="start"` for search-first lists, its chips now read "Label: value" with the colon the docs always promised, and `children` is gone from its type (it was silently dropped).
[docs](https://design.vegastack.com/docs/components/search-input) · [docs](https://design.vegastack.com/docs/components/filter-bar)

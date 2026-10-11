---
"@vegastack/ui": patch
---

🔧 **FilterBarFacet, SearchableSelect**: a `FilterBarFacet` with 7 or fewer options no longer shows a search box (server-searched `remote` lists always do). The new `searchable` prop overrides it on both components; `SearchableSelect` still defaults to showing search, so nothing changes unless you opt in.
[docs](https://design.vegastack.com/docs/components/filter-bar)

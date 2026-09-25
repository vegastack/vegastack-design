---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 SearchableSelect (and so FilterBarFacet): a remote search that is `loading` with no rows yet shows five Skeleton rows the height of real options (two lines with `itemToSecondaryLabel`) instead of a blank panel; with rows already shown they stay and a small spinner marks the fetch.

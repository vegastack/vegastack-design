---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **CommandSearch** (new): the search palette, results first. `CommandSearch` (a `CommandDialog` + non-filtering `Command`) with `pending` and `preview`; `CommandSearchInput` runs a thin progress bar under the input while `pending`; `CommandSearchScopes` keeps the scope chips on one line — what does not fit (or past `maxVisible`) goes into a `More ▾` menu, with "Include archived" (`includeArchived`, `onIncludeArchivedChange`); `CommandSearchResults` caps the results at `min(60dvh, 520px)`, dims and marks them busy while `pending`, and shows `preview` beside them from 1280px; `CommandSearchSections` renders Recent · Create · Places in that order. Pair with `useAsyncSearch`, which drops out-of-order answers. The `command-search-01` block now builds on it (its palette is renamed `SearchPalette`, and its `search` call gets `{ includeArchived }`). [docs](https://design.vegastack.com/docs/components/command-search)

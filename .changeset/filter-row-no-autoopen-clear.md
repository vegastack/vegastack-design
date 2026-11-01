---
"@vegastack/ui": minor
---

⚠ `FilterRow`: nothing opens by itself and chips carry no ×. Opening the toolbar's filter row focuses its first control instead of opening `+ Filter`; a filter added from `+ Filter` mounts closed (`FilterRowChip.defaultEditorOpen` and `FilterChip.defaultEditorOpen` are removed). `ListFacet`, `PeopleFacet` and `DateRangeFilter` lose their × and their `removable` / `onRemove` / `removeLabel` props; each clears from its own dropdown ("Clear Status" at the foot of the list, while set), and a row chip's popover ends with its Clear option. `Clear` now matches `+ Filter` exactly (with an icon), shows while a filter differs from the defaults (`activeCount`), and closes the toolbar's filter row (new `closeFilterRow` on the toolbar context). `SearchableSelect` gains `clearOption`, an in-list clear row.

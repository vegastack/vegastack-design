---
"@vegastack/ui": patch
"@vegastack/design": patch
"@vegastack/design-tokens": patch
---

🔧 Every empty list, grid, table and board lane renders the design-system `Empty` with an icon: an Inbox icon and "Nothing here" by default. Change the copy with the new `empty` prop (`{ icon, title, description, action }`) on DataList, on a DataList section and on a Board column; `emptyState` still replaces it outright, and the new `DataListEmptyState` is the same state outside a DataList. `NoResultsEmpty` takes an `icon`. Board lanes keep their `columnWidth` however many lanes are collapsed, instead of stretching into the space a collapsed lane frees. `base.css` renders text-entry controls at 16px or more on touch pointers so iOS Safari never zooms into a focused field; the install docs and consume guide add the viewport's `maximumScale: 1`.

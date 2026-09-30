---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `DataList` passes `selectionSecondaryActions` and `selectionMoreLabel` to its selection bar's `ActionBar` (as `secondaryActions` and `moreLabel`). `BreadcrumbTrail` takes `renderCurrent` to render the current step's content, and a step's `itemProps` spread onto its `BreadcrumbItem` (`data-*` attributes, `onDragOver`/`onDrop`).

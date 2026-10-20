---
"@vegastack/ui": patch
---

🔧 **DataList**, **ActionBar**, **PageHeader**: `DataList` `onReorderRow` / `canReorderRow` drag list rows to a place between others — a drop on a row's top or bottom edge lands before or after it under a 2px drop-indicator seam (`data-drop-edge`), while a folder row's middle still takes `onDropInto` (`useDragInto` gains `reorder`, `onReorder` and `canReorder`); `ActionBar` `end` closes the set after `secondaryActions`, so the selection bar's Clear no longer sits between the primary action and the secondary ones; `PageHeader`'s actions wrap, end-aligned, instead of running off a phone screen.

---
"@vegastack/ui": patch
---

🐛 `SortableList` (and every `useDragReorder` item): dragging a row by its handle no longer drags a picture of half the page. The browser sizes its drag image from the row plus every descendant's box, and a `Checkbox` or `Switch` without a `name` keeps its hidden input fixed at the viewport's top-left — so a row with a "Required" checkbox dragged everything between the page corner and the row. The drag image is now a copy of the row alone, held under the pointer where it was grabbed. Keyboard move mode, touch long-press, drop indicators and announcements are unchanged.

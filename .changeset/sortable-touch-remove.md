---
"@vegastack/ui": patch
---

🔧 `SortableList`: touch long-press reordering (the Board's model — a 250ms hold that moves under 8px lifts the row or tile; the page doesn't scroll under it and the long-press menu is suppressed) for lists and grids, beside the handle's pointer drag and keyboard move mode. The Move up / down / to top / to bottom menu items are gone. New `onRemove` puts a small × (`Remove {label}`) in each unlocked row's corner, shown on hover or focus and always on touch; `getItemActions` still gives a ⋯ menu for more actions, and a row with no actions has no menu. Grid: `columns` (2–6) fixes the tiles per row, and `tile="bare"` drops the tile frame so an `Attachment` inside is the one frame. A locked row's reason is now the row's description.

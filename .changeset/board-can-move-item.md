---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `board`: new `canMoveItem(item)` prop locks single cards — a view-only record on an editable board. A card it answers `false` for cannot be picked up by pointer, touch or Space, keeps the default cursor (no `cursor-grab`), carries `data-move-locked` and drops the "Draggable card" role description; it still focuses, opens, keeps its ⋯ actions, and other cards move around it. The docs gain a "Locked cards" example.

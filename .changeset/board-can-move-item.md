---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `board` and `data-list`: new `canMoveItem` prop locks single items — a view-only record in an editable view. On `Board`, `canMoveItem(item)` returning `false` means the card cannot be picked up by pointer, touch or Space, keeps the default cursor (no `cursor-grab`), carries `data-move-locked` and drops the "Draggable card" role description; it still focuses, opens, keeps its ⋯ actions, and other cards move around it. On `DataList`, `canMoveItem(row)` makes that row (and grid card) no drag source with `data-move-locked`, leaves it out of a dragged selection, keeps it openable and a drop target, and passes through to the board view. The docs gain a "Locked cards" board example and a locked row in the drag-into example.

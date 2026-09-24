---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🔧 `sortable-list` keeps a locked row in the list: a row with `disabled: true` now shows a spacer the size of the handle (`data-slot="sortable-list-handle-spacer"`) and KEEPS its row menu with the Move items disabled, where it used to lose both. New props: `lockedReason` (the accessible description of a locked row's disabled Move items), `renderActions` (inline actions before the row menu), `actionsLabel` (the menu trigger's name) and `layout="grid"` (auto-fill image tiles with the handle and actions over the tile's top corners). The row menu trigger is now named "Actions for {label}" by default, where it was "Move {label}". `use-drag-reorder` gains `columns` (a number or `"auto"`, measured from where items wrap) so ↑/↓ in keyboard move mode step a whole row when a horizontal axis wraps into a grid, and `drag-item` draws the left and right drop-edge hairlines a horizontal axis reports. The component roster in the shipped `vegastack-design-system` skill describes the new surface.

---
"@vegastack/ui": minor
---

New `use-list-nav` registry hook — roving-tabindex keyboard navigation for a list or grid of
focusable items. One Tab stop per collection, RTL-aware ArrowLeft/Right (direction read live from
the container), ArrowUp/Down by row via `columns`, and Home/End jumps scoped by
`homeEndScope: "collection" | "row"` (default `"collection"`, matching the shipped pickers). A
`shouldHandle` predicate suppresses navigation while an overlay above the list owns the arrow keys.
Extracts the block color-picker and emoji-picker each hand-rolled; they adopt it in a follow-up.

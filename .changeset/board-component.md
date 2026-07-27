---
"@vegastack/ui": minor
---

New `board` component — kanban columns over the `use-drag-reorder` seam with the reference
implementation's content/chrome split: the host renders card content only and owns the move command
(`onMove`, promise-refusable with pending shimmer and announced snap-back); the board owns column
shells, counts, `Empty bordered` drop targets, collapsed read-only lanes, drag + keyboard models,
and the lossless per-card "Move to…" menu with visible lock reasons. Below 768px pointer drag
disables outright — the keyboard move mode and the menu are the only, lossless paths. Cards form
one roving tab stop (↑/↓ within a column, RTL-aware ←/→ across at a clamped index, M opens the
menu, Enter activates, Space lifts). A dragged card gains no shadow — flat by doctrine. Selected
for cross-engine smoke.

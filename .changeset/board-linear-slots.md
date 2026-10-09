---
"@vegastack/ui": patch
---

🧩 **BoardCard** gains quieter Linear-style slots — `eyebrow`, `aside`, `chips`, `alert`, `footnote` and `titleWeight` (normal by default beside a `status` control) — and exports `BoardCardChip`, a thin bordered pill with no fill that renders as a menu trigger through `render`. **Board** takes a column `icon`, `addPlacement="header"` (the add button as an icon beside the lane's ⋯) and `trailing` content after the last lane; cards sit on a slightly raised surface. **DataList** passes them through: a section's `icon` and `actions`, `addPlacement` and `boardTrailing`.
[docs](https://design.vegastack.com/docs/components/board-card)

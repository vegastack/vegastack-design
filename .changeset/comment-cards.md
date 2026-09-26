---
"@vegastack/ui": patch
---

🔧 Comments: each posted comment sits in its own card (the composer's `bg-muted/30` surface, `border-border`, `rounded-xl`), and so do the deleted placeholder and edit mode; the border never changes on hover or focus. The add-reaction and ⋯ buttons are identical ghost `icon-sm` buttons at the card's top-right, both shown on hover or focus-within (kept while their popup is open, always on touch). The ⋯ menu is sized to its content with muted Link, Pencil and destructive Trash2 icons. `ReactionAdd` gains a `size` prop (`icon-xs` default, `icon-sm`).

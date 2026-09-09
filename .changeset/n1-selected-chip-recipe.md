---
"@vegastack/design": minor
---

📦 Exports `selectedChipVariants` — the one "raised chip on a muted track" recipe, shared by Tabs
`pill`/`chip`, `Segmented`, and pressed `Toggle`/`ToggleGroup`, which had drifted into four
different selected looks (`bg-background`, `bg-secondary` plus a hairline, `bg-foreground/10`). The
track is `surface-1`; the chip is the pressed/selected rung in its alpha form
(`bg-foreground/(--alpha-ink-tint)`), which is what lets a SELECTED chip keep stepping — it
strengthens on hover and drops back to the resting tint on press. Ships as `track`, `item`, and two
state literals: `pressed` (Base UI `data-pressed`) and `active` (Base UI `data-active`).
[docs](https://design.vegastack.com/docs/components/tabs)

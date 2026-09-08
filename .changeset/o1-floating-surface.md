---
"@vegastack/ui": minor
---

🧩 **`floating-surface`** — the shared floating-overlay module every anchored overlay now
composes: one `Portal → Positioner → Popup (→ Viewport)` composer, one theme-scope hand-off across
the portal boundary, one arrow, and four painted surfaces (`panel` at the 16px tier, `menu` at list
density, `tooltip` as the inverted ink chip, `navigation` for the morphing mega-menu). It also owns
`menuItemVariants` — the one list-item recipe behind menu items, select options, combobox options and
command rows — and `PanelSearchFrame`, the in-panel search row.
[docs](https://design.vegastack.com/docs/components/floating-surface)

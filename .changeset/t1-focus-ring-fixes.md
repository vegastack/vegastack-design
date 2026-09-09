---
"@vegastack/ui": minor
---

🐛 **Two focus rings that never painted.** Charts were focusable with no visible ring — recharts'
`accessibilityLayer` makes the plot `<svg>` a tab stop, and `ChartContainer`'s own
`.recharts-surface` outline reset then poisoned `--tw-outline-style` on the very element that takes
focus, so even the global `:focus-visible` rule resolved to `outline-style: none`. The reset is now
scoped to `:not(:focus-visible)`. And the `DataGrid` roving cell's ring was clipped, because the
cell lives inside the table's scroll viewport, which clips its overflow — it is now inset.
`PropertyList` values stop truncating for the same reason: the `overflow: hidden` that `truncate`
implies was clipping the focus ring of any link inside a value.
[docs](https://design.vegastack.com/docs/components/chart)

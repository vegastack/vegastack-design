---
---

🐛 **The surface-ladder specimen showed the wrong swatches** — the "alpha twins" panel
labelled two swatches `--alpha-hover` / `--alpha-pressed` while painting the opaque `surface-2` /
`surface-3` rungs, so it demonstrated the opposite of the twins' claim. It now paints the real
`foreground` composites over three hosts (page, card, well) in both themes, with the opaque rung
beside each wash for comparison.
[docs](https://design.vegastack.com/docs/foundations/colors) ·
[`65975e1`](https://github.com/VegaStack/vegastack-design/commit/65975e1)

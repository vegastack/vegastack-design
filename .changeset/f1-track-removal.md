---
"@vegastack/design-tokens": minor
---

🗑 **`track` is removed.** The slider rail, progress track, skeleton and every well are
`surface-1`; the switch off-track is `surface-3`, the pressed rung. Three alpha roles are removed
with it, because the ladder is now the one hover mechanism and nothing references them:
`--alpha-fill-hover` (the secondary button's `/80` opacity dim), `--alpha-input-hover` (the dark-only
input hover wash) and `--alpha-surface-subtle` (the outline button's hover tint, now `--alpha-hover`
in the family's own hue).
[docs](https://design.vegastack.com/docs/foundations/colors) ·
[`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

---
"@vegastack/design-tokens": minor
---

⚠️ **Surface tokens are now one ladder.** `surface-1` / `surface-2` / `surface-3` — the
rest-fill/well, hover and pressed/selected rungs — arrive with the theme-invariant alpha twins
`--alpha-hover` (7%) and `--alpha-pressed` (10%). `secondary`, `muted` and `accent` were a single
OKLCH value under three names, so no hover or pressed state could be seen on a card. They are now
**aliases** of ladder rungs and have no independent values: `secondary` = `muted` = `surface-1`,
`accent` = `sidebar-accent` = `surface-2`, `sidebar` = `card`, `sidebar-border` = `border`,
`sidebar-ring` = `ring`. Existing `bg-muted` / `bg-accent` / `bg-sidebar-*` utilities keep compiling
and keep their rest appearance; only `accent` moves (one rung darker, because it is the hover rung).
Name the rung in new code.
[docs](https://design.vegastack.com/docs/foundations/colors) ·
[`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

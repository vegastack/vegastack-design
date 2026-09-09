---
"@vegastack/design-tokens": minor
---

⚠️ **`border` and `input` are translucent.** `border` is derived as `foreground` at
`--alpha-border` (8% light / 14% dark) so one hairline reads on the page, on a card, inside a well
and on a dark band. Anything that assumed an opaque border value should read the variable instead.
[docs](https://design.vegastack.com/docs/foundations/colors)

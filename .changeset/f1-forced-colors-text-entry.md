---
"@vegastack/design-tokens": minor
---

🐛 **Text-entry focus under forced colours** — Input, Textarea, NumberField, OTPInput and
TextEdit signal focus with a border tint and `outline-none`. Windows High Contrast replaces
`border-color` outright, so a focused field showed no indicator at all. The token layer now paints a
real `2px` outline under `forced-colors: active`, once, for every text-entry control.
[docs](https://design.vegastack.com/docs/foundations/colors) ·
[`273a602`](https://github.com/VegaStack/vegastack-design/commit/273a602)

---
"@vegastack/ui": minor
---

⚠️ **Button is two axes, not fifteen variants.** `variant` is now the SHAPE — `solid` ·
`soft` · `outline` · `ghost` · `link` · `cta` — and the new `tone` prop is the HUE — `neutral`
(default) · `destructive` · `success` · `warning` · `info`. Every recipe is written once as ten class
strings and reads the hue from `--btn-*` custom properties, so all thirty cells share one
hover/pressed grammar. Rename map: `default` → `solid`, `secondary` → `soft`, `destructive` → `soft`

- `tone="destructive"`, `success`/`warning`/`info` → `soft` + the matching tone, `{family}-outline` →
  `outline` + the matching tone; `outline`, `ghost`, `link` and `cta` keep their names. A destructive
  action is **never** a solid red button — `tone="destructive"` with `variant="solid"` does not
  type-check.
  [docs](https://design.vegastack.com/docs/components/button)

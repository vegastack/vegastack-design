---
"@vegastack/ui": minor
---

⚠️ **`disabled` is `aria-disabled`, not the native attribute.** Button, IconButton and
SplitButton keep their pointer events and stay focusable when disabled, so a Tooltip can explain why
the action is unavailable. Base UI still suppresses activation. Code asserting `element.disabled`
should read `aria-disabled` instead.
[docs](https://design.vegastack.com/docs/components/button)

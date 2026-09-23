---
"@vegastack/design-tokens": patch
---

📚 The reduced-motion comment in `base.css` now states the `!important` rule precisely: the reset is the only hand-written `!important` in the token CSS, and Tailwind's `!` modifier in component class strings is a separate, counted allowance in `design-lint`.

No token value, selector or rule changed — this is a documentation correction inside the shipped stylesheet.

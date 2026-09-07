---
"@vegastack/design": minor
"@vegastack/ui": minor
---

Animated icons: one factory, 439 data modules.

`@vegastack/design` gains the `@vegastack/design/create-animated-icon` subpath exporting
`createAnimatedIcon`, which owns the animation controls, the reduced-motion gate, the imperative
`startAnimation`/`stopAnimation` handle and the multi-input trigger rules that used to be duplicated
into every mirrored icon. `motion` becomes an optional peer dependency — only an animated icon pulls
it in, so `Icon`/`BrandIcon` consumers are unaffected. The icon host is now an `inline-flex` `<span>`
rather than a block-level `<div>`, and `AnimatedIconComponent` types it as `HTMLSpanElement`.

`@vegastack/ui`'s 439 registry icon items are regenerated as data modules (79,078 lines → 12,823).
Public icon names, the `size` prop and the handle API are unchanged; eight icons drop a `@deprecated`
handle alias that upstream naming quirks had left behind.

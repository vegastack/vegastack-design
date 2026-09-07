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

Reduced motion is a live subscription to `(prefers-reduced-motion: reduce)` rather than either of
Motion's hooks, both of which read a module singleton once at first import and never update, so a
mounted icon now settles the moment the preference is turned on. It is also honoured at all on the
un-configured tree: `useReducedMotionConfig()` returns `false` whenever the context says
`reducedMotion: "never"`, which is Motion's **default**, so previously an application that mounted no
`<MotionConfig>` ignored the preference entirely. `<MotionConfig reducedMotion="always">` can add
reduction on top; the override is one-way, since an explicit `"never"` cannot be told apart from no
provider at all.

`@vegastack/ui`'s 439 registry icon items are regenerated as data modules (79,078 lines → 12,951).
Public icon names, the `size` prop and the handle API are unchanged. Seven icons drop a
`@deprecated` handle alias that upstream naming quirks had left behind. `chevron-first` is a rename
rather than an alias removal — upstream copy-pasted its `displayName` from another icon, so the
primary interface was `ChevronsDownUpIconHandle` with `ChevronFirstIconHandle` as its `@deprecated`
alias; the exported component symbol is authoritative, so the surviving name is
`ChevronFirstIconHandle` and `ChevronsDownUpIconHandle` is gone.

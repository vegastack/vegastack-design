---
"@vegastack/design": minor
"@vegastack/ui": minor
---

🔧 **Animated icons** — the host element is now an `inline-flex` `<span>` rather than a
block-level `<div>`, so an icon placed in a line of text no longer breaks the line box, and
`AnimatedIconComponent` types its host as `HTMLSpanElement`. Reduced motion is now a live
subscription to `(prefers-reduced-motion: reduce)`, so turning the preference on settles every
mounted icon immediately instead of only affecting icons mounted afterwards. Motion's own hooks
cannot do this: in 12.42.2 `useReducedMotion()` is `useState(prefersReducedMotion.current)` — a
one-shot read of a module singleton captured at first import, with a standing `TODO` about not
updating — and `useReducedMotionConfig()` layers `<MotionConfig>` on that same one-shot value. Worse,
the OS preference was never consulted at all unless the application happened to mount a
`<MotionConfig>`: `useReducedMotionConfig()` returns `false` outright when the context says
`reducedMotion: "never"`, and `"never"` is precisely Motion's **default** context value. The factory
now treats the preference as the base value and lets `<MotionConfig reducedMotion="always">` add
reduction on top; the override is one-way, because an explicit `reducedMotion="never"` is
byte-identical to no provider at all and honouring it would switch reduced motion off for everyone
who configured nothing. Public icon names, the `size` prop and the `startAnimation`/`stopAnimation`
handle are unchanged.
[docs](https://design.vegastack.com/docs/foundations/icons) ·
[`cb20de9`](https://github.com/VegaStack/vegastack-design/commit/cb20de9)

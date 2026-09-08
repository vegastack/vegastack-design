---
"@vegastack/design-tokens": minor
---

🐛 **The `prefers-reduced-motion: reduce` reset zeroes delays too.** It gains
`animation-delay: 0s !important` and `transition-delay: 0s !important`. Zeroing duration alone left a
staggered entrance sequencing over its real-time delay window, which is motion; with the delay zeroed
the whole sequence lands at once, and no component needs a `motion-reduce:` restatement of its own.
[docs](https://design.vegastack.com/docs/foundations/motion)

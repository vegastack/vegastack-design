---
"@vegastack/design-tokens": minor
---

Adds `--duration-indeterminate` (1200ms) and the `motion-indeterminate` utility — the one
sanctioned looping animation, the sweeping segment of an indeterminate `Progress`. Its keyframes
open and close on the same resting frame, so the global `prefers-reduced-motion` reset leaves a
static 35% segment rather than a bar that reads as complete.

Extends the `prefers-reduced-motion: reduce` reset with `animation-delay: 0s !important` and
`transition-delay: 0s !important`. Zeroing duration alone left a staggered entrance sequencing over
its real-time delay window, which is motion; with the delay zeroed the whole sequence lands at once,
and no component needs a `motion-reduce:` restatement of its own.

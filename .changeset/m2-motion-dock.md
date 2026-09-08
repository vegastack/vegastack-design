---
"@vegastack/design-tokens": patch
---

Adds the `motion-dock-in` / `motion-dock-out` utilities — the docked-control enter/exit pair for a
control that stays mounted at a viewport edge and flips `data-active` (a bottom action bar, a
floating scroll-to-edge button). 150ms in on `ease-emphasized`, 100ms out on `ease-exit`, translate
and fade, **no scale**: an exit is never slower than its enter.

The pair owns the timing, the fade and the parked `pointer-events: none`; the travel distance stays
at the call site as ordinary `translate-*` utilities, because it is per-dock geometry and a
`translate` declaration inside the utility would clobber a horizontally-centred bar's composed
transform.

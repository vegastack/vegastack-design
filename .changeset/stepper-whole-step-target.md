---
"@vegastack/ui": patch
---

🔧 **Stepper**: a navigable step is now one target — node and label together — so the circle is as clickable as the text and the hover fill covers both. Clearer states: the current step alone is the solid primary circle with a medium-weight label (its bold width reserved, so nothing shifts), a completed step is a check on a muted primary tint with its connector in the same tone, upcoming stays an outline. An overflowing horizontal rail scrolls the current step into view. The non-interactive step box is `data-slot="stepper-item"`; the `stepper-node-rail` wrapper is gone. No prop changes; `MultiStepForm` picks this up as is.
[docs](https://design.vegastack.com/docs/components/stepper)

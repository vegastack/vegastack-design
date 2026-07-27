---
"@vegastack/ui": minor
---

Remove the `active:translate-y-px` press nudge from `buttonVariants`. Pressed feedback across
Button and every component composing it (IconButton, SplitButton, toolbars, pickers) is now
colour-only via the existing `active:bg-*` states — no press motion anywhere in the system. The
motion foundations doctrine is updated to match.

---
"@vegastack/ui": minor
---

🐛 **The video overlay's seek rail rests at its own thickness and thickens on engagement
again.** Its `h-1` tied on specificity with the shared track's `h-1.5`, so Tailwind's sort order
picked the default 6px rail and the hover/focus thickening had nothing to thicken from.
[docs](https://design.vegastack.com/docs/components/slider)

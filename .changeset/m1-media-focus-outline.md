---
"@vegastack/ui": minor
---

🔧 **Media controls keep the system's focus outline.** The `ring-2 ring-ring/50` glow that
media invented for itself, and the forced-colours carve-out beside it, are gone; the standard 2px
`:focus-visible` outline applies, inset with `-outline-offset-2` so an `overflow-hidden` frame
cannot clip it. `tabIndex={0}` now appears only on genuinely scrollable regions.
[docs](https://design.vegastack.com/docs/components/video-player)

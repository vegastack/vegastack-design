---
"@vegastack/ui": minor
---

🐛 **Keep Dropzone drag feedback inside narrow WebKit viewports.** The drag-state stroke now sits
one stroke-width inside the surface and uses explicit border-box sizing. This avoids WebKit counting
the stroke's two edges as horizontal scroll overflow at 320px while preserving the design system's
independent focus-visible outline.
[docs](https://design.vegastack.com/docs/components/dropzone)

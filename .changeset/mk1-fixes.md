---
"@vegastack/ui": minor
---

🐛 **ParticleField froze the brand colour of the theme it mounted in.** The ink was read once, into
a `const`, inside an effect keyed on nothing the theme touches — so a light-mounted field kept the
light `--brand` after a toggle to dark until something forced a remount. It now reads the canvas's
own resolved `color` per frame, and the single static reduced-motion frame repaints on a theme
change too.
[docs](https://design.vegastack.com/docs/components/particle-field)

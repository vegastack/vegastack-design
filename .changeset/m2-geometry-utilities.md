---
---

🐛 **Fixed** — the geometry contract lane (`packages/ui/test/geometry.css`) imported the token theme
and base layers but never `utilities.css`, so every `@utility` in the system — `scroll-fade-*`,
`scrollbar-thin`, `motion-pop-in`, the new `motion-dock-*` pair — compiled to nothing and all 523
fixtures were measured against a layout no user ever sees. A custom utility with no definition is an
empty rule, not an error, so the gap only ever made the contracts weaker. The lane now imports the
same layer production does.

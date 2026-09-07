---
"@vegastack/design": minor
---

Exports the two hover/pressed recipes so no component writes a `hover:bg-*` literal:
`surfaceInteractive` (`hover:bg-surface-2 active:bg-surface-3`) for a control on a known ladder
surface, and `fillInteractive.<tone>` (`hover:bg-<tone>/(--alpha-hover)
active:bg-<tone>/(--alpha-pressed)`) for one on an unknown backdrop or hovering in its own hue,
plus the `FillTone` type.

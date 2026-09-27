---
"@vegastack/ui": patch
---

🐛 Inline-edit fields paint no fill: `EditableCell` values and the ghost `Input` (a dialog's title) no longer tint on hover — at rest, on hover and while editing they are transparent, and the text cursor is the affordance. Keyboard focus on a resting `EditableCell` keeps the system focus tint. Text alignment and hit areas are unchanged; picker pills and menus keep their button hover.

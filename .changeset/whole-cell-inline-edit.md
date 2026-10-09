---
"@vegastack/ui": patch
---

🧩 Whole-cell inline editing: `InlineEditTrigger` (in `editable-cell`) makes a list cell's whole value — icon and text — the button that opens an app-owned status, priority or assignee editor, with no border at rest and the properties-panel tint on hover, focus and while open. `EditableCell`'s `date` and `select` editors use the same tint (no hover border, the select trigger is ghost) and fill a `cell` variant. `BoardCard` gains `renderField` to make its assignee, due and priority fields editable the same way. `IconGlyph` without a hue now takes the sidebar nav icon ink instead of full foreground.

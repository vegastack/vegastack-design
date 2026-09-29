---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 New `TemplateEditor`: a plain-paragraph editor for text with spec placeholders. Typing `@` or `{{` opens a searchable list of `tokens`; the picked one becomes an inline chip that deletes as one unit and is stored as `{{id}}`. The value is plain text (paragraphs joined by a blank line) and round-trips exactly; unknown ids and `invalidTokenIds` render in the destructive style. Sized and bordered like `Textarea`, with its focus border.

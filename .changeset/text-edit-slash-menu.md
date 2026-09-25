---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 TextEdit has no toolbar: type `/` for a slash menu (headings, lists, task list, quote, code block, divider, link) and select text for a bubble menu (bold, italic, strikethrough, inline code, link). `slashCommands` limits the menu — `TEXT_EDIT_SLASH_COMMANDS` is the full set, `TEXT_EDIT_COMPACT_SLASH_COMMANDS` the comment-sized one. Hover and focus tint the surface, and every change leaves through one `onCommit` path; the `toolbar`, `variant`, `onSave`, `onCancel`, `saveLabel` and `cancelLabel` props are removed. Blank lines round-trip in markdown. Input gains `variant="ghost"` (borderless, tinted on hover and focus) and `size="lg"` (heading type) for a title field, and `InputGroupInput` accepts Input's props. EditableCell `variant="heading"` has no box padding, so a title is edited exactly where it renders. PropertyRow top-aligns its label on the value's first line. Prose list markers inherit the item's colour and use proportional figures, so lists read exactly like body text.

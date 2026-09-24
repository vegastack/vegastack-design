---
"@vegastack/ui": minor
---

🔧 **TextEdit** edits Markdown: `format="markdown"` makes `value`, `onValueChange` and `onSubmit` carry Markdown instead of HTML (through Tiptap's own `@tiptap/markdown`, a new dependency of the item), and loading a document never fires `onValueChange`. New `readOnly` (no toolbar, `aria-readonly`) and `disabled` (no toolbar, dimmed, `aria-disabled`) props; `editable` is deprecated — `editable={false}` means `readOnly`.
[docs](https://design.vegastack.com/docs/components/text-edit)

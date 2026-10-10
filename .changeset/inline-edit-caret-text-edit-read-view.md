---
"@vegastack/ui": patch
---

🐛 **EditableCell**, **useInlineEdit**, **TextEdit** and **MarkdownView** — clicking a value to edit it puts the caret where you clicked (a keyboard open puts it at the end) instead of selecting the whole value; `useInlineEdit`'s `start` takes the opening pointer event for this. A `TextEdit` with `citation` shows its read view whenever it is not being edited: a preloaded editor waits for a click instead of swapping in on mount, and the read view comes back once focus leaves the editor and its menus and panels (after the blur commit, never while an upload is in flight), so `[[n]]` markers read as citations again. `MarkdownView` also recognises a marker the editor's Markdown escaped (`\[\[n\]\]`).
[docs](https://design.vegastack.com/docs/components/text-edit)

---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 TextEdit is Notion-style: no border, ground or focus ring, and no view mode — it rests looking exactly like `MarkdownView`; click anywhere and type. The Save/Cancel buttons are gone: leaving the editor calls the new `onCommit(value)` when the document changed, Escape reverts and calls `onRevert()`, Cmd/Ctrl+Enter calls `onSubmit` (or commits), and `autosave` commits after an idle gap. The formatting toolbar is a compact row under the text, shown only while focused (minimal included). `onSave`/`onCancel` still work as aliases; `variant`, `saveLabel` and `cancelLabel` are ignored. The `prose` recipe is now the app's body text: `text-sm`, body family and `foreground` ink for paragraphs, lists, list markers, links, quotes and table cells (no relaxed leading, no muted markers), headings on the app scale (`#` text-lg, `##` text-base, the rest body size, all `font-heading`), and only inline code and code blocks in mono — identical in MarkdownView and TextEdit.

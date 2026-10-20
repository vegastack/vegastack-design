---
"@vegastack/ui": patch
---

🐛 **TextEdit**, **MarkdownView**: an image's caption is its Markdown title (`![alt](src "caption")`) — the toolbar's **Caption** edits it, `TextEdit` shows it under the image and `MarkdownView` renders a `figure` with a `figcaption` (no tooltip); Notion paste maps its to-do lists to checklists and its callouts (`figure.callout`, `aside`, and Markdown's `<aside>`) to callouts; the editor hands Tiptap stable `editorProps`, so inserting a callout or a code block no longer logs React's "flushSync was called from inside a lifecycle method" (and the view is no longer re-propped on every render).

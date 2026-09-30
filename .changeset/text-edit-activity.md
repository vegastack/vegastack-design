---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 `TextEdit` keeps what you typed when it is hidden and shown again (React's `<Activity>`), and image uploads still insert afterwards. It no longer offers block commands (headings, lists, quote, callout, toggle, code block, table, divider) or "Turn into" while the cursor is in a table cell. `MarkdownView` renders `<br>`, `<br/>` and `<br />` inside table cells as line breaks; other raw HTML still shows as text. A `FolderTree` folder with `hasChildren: false` is a leaf: a spacer in place of its disclosure, `data-leaf` on the row, and → does nothing on it.

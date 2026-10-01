---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 TextEdit menus and callouts. The slash menu has one active item that the pointer and ↑/↓ share (pointer cursor on items), scrolls it into view inside the list only, and lists commands in one canonical order wherever a subset is passed (comments and full editors match). The selection, link and image menus open just above the caret or selection without page scroll jumps. Callouts render as `Alert`s in the editor and in `MarkdownView` and gain GitHub's `[!IMPORTANT]` and `[!CAUTION]`; the tone icon opens a menu. Inline code in prose is tinted orange (`tag-orange-text` on `tag-orange-subtle`).

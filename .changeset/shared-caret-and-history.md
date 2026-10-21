---
"@vegastack/ui": patch
---

🐛 **TextEdit**: a key acts at the caret the reader sees. ProseMirror read a caret the browser had just moved (a click, an arrow key) only on `selectionchange`, which the browser queues behind input already waiting, so Enter, Backspace or a shortcut pressed right after a click acted at the selection from before. In a shared page opened a moment ago, that was the document's start: Enter split the first line and what followed was typed into it, and it was saved that way. Every key now reads a pending caret first. New `TextEditHandle.clearHistory()` for a shared document: the host calls it when it replaced the text under the reader (a version restored), so ⌘Z doesn't undo the reader's earlier changes onto the new text and splice the old text into it letter by letter.

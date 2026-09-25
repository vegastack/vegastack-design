---
"@vegastack/ui": patch
---

🔧 Editing a comment uses the composer's compact box with icon buttons: a round ↑ Save (disabled while the text is empty or unchanged) and a ghost × Cancel, each with a tooltip; Cmd/Ctrl+Enter saves and Escape cancels. TextEdit's tests now cover every markdown element's round-trip (headings, strike, inline code, code blocks, quotes, dividers, task and nested lists, blank lines), commit on blur and unmount, Escape revert, autosave, slash-menu keys, undo/redo, paste and bubble-menu links.

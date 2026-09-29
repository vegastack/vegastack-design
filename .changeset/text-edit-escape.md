---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 `TextEdit` no longer erases saved text on Escape in a document that saves as you type. A new `escapeBehavior` prop — `"revert"` (restore the document as focus found it, blur, `onRevert`) or `"blur"` (keep the text, commit, blur) — defaults to `"blur"` whenever `autosave` is set and to `"revert"` otherwise. `handleRef` gains `markSaved()`, which advances the baseline Escape reverts to (and a commit compares against) after a host's own acknowledged save.

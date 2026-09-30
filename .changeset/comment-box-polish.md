---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Comment boxes and code blocks. A code block's language label and Copy button get their own room above the code (`codeBlockControlsPadClassName`) instead of covering the first line, in `CodeBlock` and in `TextEdit`. `TextEdit` takes `slashHint` (default on); comment boxes turn it off, so "Add a comment…" and "Write a reply…" stay while focused instead of "Type / for commands". A press on a `TextEdit` box's padding before its editor has loaded now focuses the read view, so text typed while the editor loads is kept and replayed with the caret at its end.

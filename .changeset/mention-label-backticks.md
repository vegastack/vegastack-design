---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **text-edit-grammar**: `escapeMentionLabel` (and so `mentionMarkdown` and every mention `TextEdit` writes) now escapes a backtick in a mention's label too. A bare backtick in one label could pair with one in another label, or in the text, into a code span, which Markdown reads before links, so the mentions it crossed rendered as code. `parseMentionLink` reads the escaped label back unchanged. Image alt text keeps its own escaping. [docs](https://design.vegastack.com/docs/components/markdown-view)

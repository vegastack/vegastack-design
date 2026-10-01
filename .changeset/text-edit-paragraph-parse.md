---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 TextEdit type-checks against Tiptap 3.31.4: the paragraph parser no longer calls `Paragraph.config.parseMarkdown` (whose `this` type changed), it builds the paragraph itself.

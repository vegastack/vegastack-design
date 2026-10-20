---
"@vegastack/ui": patch
---

🐛 **TextEdit** and **MarkdownView**: section marks are a flat partition. A marked `#`–`###` heading's bar now stops at the next `#`–`###` heading of any level, instead of running on through its sub-headings; a `####` and deeper stays a block of its section. `sectionHeading(level)` (exported from `markdown-view`) is the shared rule.

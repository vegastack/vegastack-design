---
"@vegastack/ui": patch
---

⚠️ **TextEdit** Markdown output changes once for existing documents (derived copies are rewritten on their next save): text is escaped only where Markdown would read it as syntax (`snake_case`, `R&D` and `a * b` stay as typed; `1. ` at the start of a paragraph is `1\. `); a hard break is `\` and a newline, or `<br>` in a heading or a table cell; a table cell's leading and trailing `<br>` are dropped; a link with a space in its address is written `<…>`. Parsing no longer loses text: an indented code fence is a code block, `Hi. there` is a sentence, a less-indented ordered item stays, `&amp;` in a link is `&`, and raw HTML is text in the browser as it is on a server. `MarkdownView` reads `<br>` as a line break everywhere, not only in a table cell.
[docs](https://design.vegastack.com/docs/guides/markdown)

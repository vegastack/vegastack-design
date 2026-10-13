---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **TextEdit**: its document lives in three server-safe registry libs, so a server reads and writes exactly what the editor does. `text-edit-grammar` holds VegaStack Markdown's constructs as plain strings (`parseMentionLink`, `mentionMarkdown`, `MENTION_LINK_SQL`, `headingIds`, `parseImageAlt`, `imageMarkdown`, `parseCodeFenceInfo` — moved here from `MarkdownView` and `CodeBlock`); `text-edit-schema` every node, mark and attribute with its Markdown rules (`textEditExtensions()`, `textEditSchema()`), with a stable `blockId` on every heading, paragraph, list item, toggle, callout, table and code block that Markdown never carries; `text-edit-markdown` the conversion (`markdownToDoc`, `docToMarkdown`, `normalizeMarkdown`, `docToText`) and the editor's `VegaStackMarkdown` extension. Each `TextEdit` parses with its own `marked`, and a megabyte of Markdown parses in well under a second (it took over twenty). A round-trip corpus checks every construct in Node and in Chromium against the same output. Tiptap moves to 3.31.4.
[docs](https://design.vegastack.com/docs/guides/markdown)

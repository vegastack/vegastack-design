---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **TextEdit** highlights text: the bubble menu's **Highlight**, <kbd>Mod</kbd> <kbd>Shift</kbd> <kbd>H</kbd> or typing `==text==`. VegaStack Markdown stores it as `==text==`, with an optional colour right after it (`==text=={green}`: yellow, green, blue, purple, pink or red — every colour reads, renders and round-trips; the editor makes yellow). **MarkdownView** renders it as `<mark data-color>` on the colour's `tag-*-subtle` fill (the prose recipe's new `mark` rule, kept in print), and `typedFirstLine` and the new `highlightText` read it as plain text. `text-edit-grammar` adds `readHighlight`, `highlightMarkdown`, `HIGHLIGHT_COLORS` and `HIGHLIGHT_SUFFIX_SQL`. A literal `==` run that could open or close a highlight is now written `\=\=`. [docs](https://design.vegastack.com/docs/guides/markdown)

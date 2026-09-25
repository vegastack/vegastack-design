---
"@vegastack/ui": patch
---

🔧 TextEdit's markdown output is clean: blank lines typed with Enter no longer serialize as `&nbsp;` between extra blank lines — empty paragraphs collapse, so paragraphs are separated by one blank line and the output reloads to itself. Blank lines inside fenced code are kept. Input no longer exports `inputVariants` (nothing used it, and its fixed heights broke the data-table squeeze census).

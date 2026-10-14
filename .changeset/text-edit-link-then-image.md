---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **text-edit-markdown** / **TextEdit**: a link (or any other span) followed by an image on the same line — `See [docs](/d) ![shot](/s.png)` — no longer fails to parse ("Empty text nodes are not allowed"); the image is lifted to its own block as anywhere else. Corpus case `regressions/link-then-image`.
[docs](https://design.vegastack.com/docs/guides/markdown)

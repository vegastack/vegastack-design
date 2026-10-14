---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **text-edit-markdown** / **TextEdit**: inline code inside a link, bold, italic or strikethrough (``[`code`](/x)``, ``**`code`**``) no longer throws on parse — the code mark now combines with other marks. Link titles are kept for inline and reference-style links (`[text][ref]` + `[ref]: url "Title"`), written back as inline links with their title; corpus cases for both.
[docs](https://design.vegastack.com/docs/guides/markdown)

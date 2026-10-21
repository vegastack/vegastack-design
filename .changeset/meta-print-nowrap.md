---
"@vegastack/ui": patch
---

🐛 **DocumentLayout**: a `DocumentLayoutMeta` line prints (a public page's "Approved version · date" belongs on paper; hide a line with your own print rules where it doesn't), and a `DocumentLayoutMetaItem` keeps its words on one line, so "From meeting" and its date never wrap beside a long meeting name; the `DocumentLayoutMetaLink` truncates instead.

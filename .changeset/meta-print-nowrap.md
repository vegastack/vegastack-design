---
"@vegastack/ui": patch
---

🐛 **DocumentLayout**: a `DocumentLayoutMeta` line prints (a public page's "Approved version · date" belongs on paper; hide a line with your own print rules where it doesn't), and `DocumentLayoutMetaItem` takes `nowrap`: a fact built around a `DocumentLayoutMetaLink` keeps its words on one line ("From meeting" and its date never wrap beside a long meeting name) while the link truncates. Plain facts still wrap.

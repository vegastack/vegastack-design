---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **MarkdownView**'s find tint is a plain hoisted style instead of Tailwind `::highlight()` variants, so a consuming app's Tailwind build no longer warns "'highlight' is not recognized as a valid pseudo-element" (Turbopack's "1 Issue" badge). The matches paint exactly as before. [docs](https://design.vegastack.com/docs/components/markdown-view)

---
"@vegastack/ui": minor
"@vegastack/design-tokens": minor
"@vegastack/design": minor
---

🧩 A page title is 26/600 (TYP-21). `@vegastack/design-tokens` adds the one named type step, `--text-page-title` (26px, 32px leading, −0.04em), read as `text-page-title`; `PageHeader`'s title wears it with `font-semibold` in place of `text-2xl`. `cn` teaches tailwind-merge the name as a font size, so `cn("text-page-title", "text-foreground")` keeps both. Every other size stays stock.

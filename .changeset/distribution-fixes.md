---
"@vegastack/ui": patch
---

🐛 Board type-checks in apps without `@types/node`: its dev-only lane-name warning declares the `process.env.NODE_ENV` it reads. The sortable-list page quotes `Actions for {label}` as code, and scroll-area documents its props in a table, so the public docs build and export pass again.

---
"@vegastack/ui": patch
---

🐛 **RecordChip** — the development-only "`value` is ignored with `person`" warning now fires from a module-level helper instead of reassigning a module variable during render, so the component passes React's `react-hooks/globals` lint rule in consuming apps. Behaviour is unchanged: one warning per page load, none in production. [docs](https://design.vegastack.com/docs/components/record-chip)

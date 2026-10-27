---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 A **DataList** `numeric` column (a date, a count) keeps its whole width on a narrow list's `line` meta line, like an end-aligned or `mono` one: the text values beside it truncate first, so "1w ago" never clips to "w ag". [docs](https://design.vegastack.com/docs/components/data-list)

---
"@vegastack/ui": minor
---

⚠️ **`Pagination` no longer hard-codes its accessible name.** It renders a plain `<nav>`
(no `role="navigation"`) and `aria-label` defaults to "Pagination". A page with more than one pager
must name each one — two identically named landmarks are an axe `landmark-unique` failure.
[docs](https://design.vegastack.com/docs/components/pagination)

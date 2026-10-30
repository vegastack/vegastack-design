---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **FilterRow marks AI-set facets by label** (`filter-row`): `aiFacets` lists the pinned facets the last AI filter run set — each leads with the ✦ until the member changes it, which `onAiFacetEdit` reports — so a list passes the run's labels once instead of wiring every facet.

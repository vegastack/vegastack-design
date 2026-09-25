---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🔧 **Last facelift gaps** — `DataList` (and `DataGrid`) reserve the first column and every `mobile: "visible"` column before fitting the rest, so a trailing Status or actions column no longer leaves a narrow table squeezed while an earlier column that should fold stays. `tabsListVariants` and `tabsTriggerVariants` draw horizontal tabs — the list height and the line indicator — whenever the `group/tabs` ancestor is not vertical, so route tabs need no `data-orientation` at all, and a scrolling route list keeps its indicator inside the scroll box. `SearchableSelect`'s in-panel search keeps its own name inside a `Field` instead of taking the Field label, and `searchLabel` is now optional (default "Search"). [docs](https://design.vegastack.com/docs/components/data-list)

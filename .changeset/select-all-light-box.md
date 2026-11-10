---
"@vegastack/ui": patch
---

🔧 **SearchableSelect** `selectAll`: the select-all row's box is now a drawn, decorative mark in `Checkbox`'s look (a `border-input` square, `primary` fill with a check when all are selected, a minus when some are) instead of a `Checkbox`, so `searchable-select` no longer imports the checkbox engine into every picker's first load. Behaviour, `aria-selected` and `data-state` are unchanged.
[docs](https://design.vegastack.com/docs/components/searchable-select)

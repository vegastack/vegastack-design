---
"@vegastack/ui": patch
---

🔧 **SearchableSelect** `selectAll` (with `multiple`): a first "select all" row, `selectAll.label(total)`, whose checkbox is checked, mixed or empty with the selection. Choosing it (click, Enter or Space) selects every enabled option or clears them all, through `onValueChange`; it is an `option` with `aria-selected`, first in arrow order, and hidden while the search field has text. Without `multiple` it is ignored with a development warning.
[docs](https://design.vegastack.com/docs/components/searchable-select)

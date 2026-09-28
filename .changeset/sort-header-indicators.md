---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 DataList and DataGrid sort headers follow the standard indicator pattern: the sorted column's ↑/↓ always shows at foreground strength; other sortable columns keep their ⇅ transparent (space reserved, so labels never shift) and fade it in muted on header hover (fine pointers only) or keyboard focus, so touch shows only the active arrow; unsortable columns show nothing. Each sort button is now named `Sort by <column>` alongside the header's `aria-sort`.

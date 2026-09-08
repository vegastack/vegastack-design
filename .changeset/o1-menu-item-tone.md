---
"@vegastack/ui": minor
---

⚠️ **Menu items take `tone`, not `variant`.** `DropdownMenuItem`, `ContextMenuItem` and
their checkbox/radio siblings use `tone="destructive"`, matching Button's tone axis. The state
attribute moves with the prop: items expose `data-tone`, not `data-variant`.
[docs](https://design.vegastack.com/docs/components/dropdown-menu)

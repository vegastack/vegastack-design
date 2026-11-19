---
"@vegastack/ui": patch
---

🐛 `ListToolbar`'s row is one height again: its `primary` and `state` slots hold the button they are given to the row's height (32px; 28px with `size="compact"`), so the primary stands as tall as the search field and the icon tools. The primary is documented as a default `<Button>` (it was `size="sm"`, 28px, four pixels short of everything beside it); `size="sm"` only in a compact toolbar. The filter row stays the 28px tier at every width.

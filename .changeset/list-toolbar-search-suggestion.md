---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **ListToolbar search suggestion**: `search.suggestion` offers one action under the toolbar's search once the query reads as a phrase (`minWords`, default 3) — a page's plain-language filter. Nothing runs while typing; Enter still searches, ↓ then Enter (or a click) picks the row and hands `onSelect` the query, and Escape hides it until the query changes. `opensFilter` opens the filter row once `onSelect` settles. The field becomes a `combobox` pointing at a `SuggestionMenu` listbox.

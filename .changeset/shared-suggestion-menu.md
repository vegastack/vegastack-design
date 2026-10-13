---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **TemplateEditor** and **TextEdit**: the `@` / `{{` placeholder picker and the slash and mention menus are now one shared `SuggestionMenu` (`@vegastack/suggestion-menu`, installed with either editor). Rows look exactly like `ComboboxItem`'s — the `accent` highlight on hover and arrows (visible in dark mode), the same padding, radius, gap, icon sizing and muted trailing text — with group headings, a `status` for empty, loading and error, a flip above the caret, and the textbox's `aria-activedescendant` on the active row. Escape in TemplateEditor's picker no longer reaches a host (a dialog stays open). TemplateEditor adds `singleLine` (Enter inserts nothing, pasted line breaks become spaces) and `replacements` (`[{ from: "*", to: "×" }]`, applied as you type) for formulas.
[docs](https://design.vegastack.com/docs/components/template-editor)

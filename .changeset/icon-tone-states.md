---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 StatusIcon and PriorityIcon keep their semantic colour on hover, focus and highlight inside dropdown, context-menu, menubar, select, combobox, command, sidebar, navigation-menu, toggle, button and item rows: both icons carry `data-icon-tone`, and the rows' muted-icon default and state recolours skip it. Add `data-icon-tone` to any other semantic-coloured icon to get the same behaviour.

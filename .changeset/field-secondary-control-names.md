---
"@vegastack/ui": patch
---

🐛 Inside a `Field`, a **Combobox**'s "Show suggestions" toggle keeps its own name instead of taking the Field's label, so the input is the one element the Field names.

- Since 0.18.0 the toggle answered to the field's name too: a screen reader heard a second button with the label, and a `getByLabel` query found two elements. [docs](https://design.vegastack.com/docs/components/combobox)

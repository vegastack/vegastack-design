---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **FieldCellEditor**: Enter, F2 or a click on a long-text cell that holds a value opens the editor with the caret at the end of the text, nothing selected, so writing goes on from it; typing on the cell still replaces the value with the typed key. **TextEdit**: with a query, the `@` menu's kind groups sit by their best match on the name — the whole name, then its start, then a word's start, then anywhere — and only then in `order`, so "@Arc" lists the customer named "Arcadia Architects" ahead of tasks that only mention it; each group keeps its results in the order the search returns them. [docs](https://design.vegastack.com/docs/components/field-cell)

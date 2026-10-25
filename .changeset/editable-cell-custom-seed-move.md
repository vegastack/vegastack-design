---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **EditableCell**, **DataGrid**, **FieldCellEditor**: a `custom` editor now receives the `seed` (the key that opened it by type-to-edit, which was lost) and `commit(next, move?)`, where `move` (`down`, `up`, `right`, `left` — the new `EditableCellMove` type) steps the grid on through `onNavigate`. `FieldCellEditor` follows the spreadsheet keys — Enter commits and moves down, Shift+Enter up, Tab right, Shift+Tab left (after a date-time's own controls), Escape cancels, and IME composition never commits — through `onCommit(value, move)`, and starts from `seed`: it replaces a text, URL, email, phone or number value and opens a choice, person or link picker searching for it (the new `defaultSearch` on `SearchableSelect`, `PeoplePicker` and `FieldInput`). **ViewTabs**: a cut view name shows in full in a tooltip on its tab and the narrow select's trigger, and the select's list wraps it. [docs](https://design.vegastack.com/docs/components/field-cell)

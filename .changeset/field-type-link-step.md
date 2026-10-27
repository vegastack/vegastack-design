---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **FieldTypeLinkStep** (new): the "Links to" step of `FieldTypePicker`, rendered from its `renderStep` for the link type. `kinds` (`FieldLinkKind[]` — `{ id, label, icon?, group?, description?, keywords?, disabledReason?, table? }`) list in their groups (`groupOrder`), each with one line on what a link to it does; a kind marked `table` (Rows) asks which table (`tables`, `FieldLinkTable[]`; `tablesLoading`) in a third view and retitles the picker's step header through `controls.setTitle` (`tableTitle`, "Which table's rows?"). The choice comes back through `onSelect` as `{ kind, table? }` (`FieldLinkChoice`); `value` checks the current one. Backspace in an empty search goes up one view. **DataGrid**: with `phoneLayout="cards"`, a `summaryRow` shows above the cards as one read-only line — its `label`, then "Column · Function result" for each summarised column, wrapping on a narrow screen (no change for grids without one). [docs](https://design.vegastack.com/docs/components/field-type-link-step)

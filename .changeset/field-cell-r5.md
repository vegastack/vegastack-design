---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **FieldCell** (new, Regent R5): one display and one editor per field type — `FieldCellDisplay` (text, long text, number, currency, percent, date, date-time, single and multiple choice as coloured tags with "+N", checkbox that toggles in place, person, link as `InlineChip`s in their four states, file as kind tiles, URL / email / phone as links out, calculated with its missing inputs, auto-number, created/updated; `filling` and `recalculating` states), `FieldCellEditor` (for `EditableCell`'s `custom` slot; commits a typed value, Enter / Escape, pickers commit on choosing) and `FieldInput` (the same editors as form controls: `NumberField` for numbers so a comma-decimal locale reads "1,5" as 1.5, `DatePicker` and a time field, `SearchableSelect` with `onCreateOption`, `PeoplePicker`, an async record search, checked URL / email / phone fields, the `TextEdit` editor for long text). Locale and time zone come from the reader. [docs](https://design.vegastack.com/docs/components/field-cell)

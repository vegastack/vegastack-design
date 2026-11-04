---
"@vegastack/ui": minor
---

🔧 **`ChipInput`, `FieldCellDisplay`, `FieldProperty`, `EditableCell` and `DataGrid` columns gain small props.** `ChipInput`'s `validate` may return a string: the entry is invalid, still added and marked, and the string is the message announced, shown under the box and read with the chip. `true`, `null` and `undefined` are valid; `false` keeps today's wording, so boolean validators work unchanged. `FieldCellDisplay` and `FieldProperty` take `mark` (`FieldCellMark`: `content`, `label`, `side`): a 12px adornment at either end of a displayed value with its own accessible name, shown on hover, keyboard focus and tap, and no tab stop in a grid. `readOnlyHint` on `FieldProperty`, `EditableCell`, `EditableCellRest` and a `DataGrid` column is for a value normally filled by something else: a click opens nothing and there is no text cursor, while a double-click still opens the editor and the keyboard is unchanged.

---
"@vegastack/ui": minor
"@vegastack/design": minor
---

🧩 **New: `FloatingCellEditor`, `DropdownMenuInput` / `DropdownMenuSwitchItem` / `DropdownMenuAtPoint` (item `dropdown-menu-form`), `OptionListEditor`.** `FloatingCellEditor` opens a grid cell's editor over the cell, with the page locked behind it and pinch-zoom still passing; `DataGrid` takes `editing="floating"` to use it for its `custom` editors. The dropdown-menu form parts hold a small form in a menu: an input that keeps its keys, a switch row with a hint, and a menu that opens at a point. `OptionListEditor` edits a choice field's options as rows (hue, name, remove, add). `FieldTypeIcon`, `FIELD_TYPE_ICONS` and `FIELD_TYPE_LABELS` in `field-cell` give every field type one icon and one name. Additive — nothing changes until a consumer opts in.

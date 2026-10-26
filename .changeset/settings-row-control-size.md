---
"@vegastack/ui": patch
---

🔧 **SettingsRow** `controlSize` (`sm` 160px · `md` 256px · `lg` 320px · `auto`): every row's control shares one measure and one right edge once the row is side by side; the slot's first child fills it and a trailing status icon keeps its size. Left unset, a row holding a field control (input, input group, textarea, select, combobox, date or people picker) takes `md`, and a switch, button or read-only value keeps its own width — so a width class on a control inside a row (`w-64`, `@sm/settings-row:w-72`) is no longer needed and is overridden; delete it. New **SettingsMatrix** (`columns`, `rows: [{ label, description, values, onChange(column, checked), disabled }]`, `label`): settings × channels with the column names once in a sticky header and each switch named by its row and column; below 28rem the switches stack under their label with the column name beside each. [docs](https://design.vegastack.com/docs/components/settings-row)

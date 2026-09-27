---
"@vegastack/ui": patch
"@vegastack/design": patch
"@vegastack/design-tokens": patch
---

🐛 Text fields show focus as a subtle darker border that eases in (150ms), with no grey fill and no darker rectangle inside input groups. `base.css` again leaves text inputs and textareas out of the background tint and drops the field-group tint that stacked a square inner rectangle over the group. `Input`, `Textarea`, `InputGroup` (and so `NumberField`, `ChipInput`, `Combobox`, `Command`, `SearchInput`, `PasswordInput`, `AutoSaveInput` and the popup search rows), `ComboboxChips`, `PanelSearch`, the `Questionnaire` answer field and the `InputOTP` active slot take `border-ring/40`. An invalid field keeps its destructive border while focused. Buttons, rows, tabs, menu items and chips keep the tint. `TextEdit` gains `variant="document" | "boxed"` and `children`. `document` (the default) stays caret-only. `boxed` draws a bordered box whose border darkens on focus, and the comment composer now uses it. The ghost `Input` has no focus fill. `design-lint`'s `no-focus-border` allows the text-entry border only in those components, and the geometry sweep checks the new contract.

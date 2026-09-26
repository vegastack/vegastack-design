---
"@vegastack/ui": patch
"@vegastack/design": patch
"@vegastack/design-tokens": patch
---

🔧 A border never changes colour on focus or while active (FOC-14). Every control keeps its resting `border-border`/`border-input` in every state, and the focus cue is `base.css`'s background tint everywhere — text entry included. A bordered field group (`InputGroup`, `NumberField`, `ChipInput`, `ComboboxChips`, `PanelSearch`, now all `data-field-group`) wears the tint on the group; `TextEdit` stays caret-only, and the comment composer box no longer re-borders when active. `Input`, `Textarea`, `NativeSelect`, `Select`, `Combobox`, `InputOTP` (the active slot takes the tint), `Questionnaire`, `DatePicker` and `SearchableSelect` ghost triggers, and `MediaPlayerControls`' seek thumb lose their focus border; the ghost `Select` no longer re-borders while open. The invalid state keeps its destructive border in every state, focused or not (the `not-focus:` guards are gone from `Button`, `Badge`, `Toggle`, `Checkbox`, `RadioGroup`, `Switch` and the fields). `design-lint` gains `no-focus-border`, and the geometry focus sweep fails any control whose border colour moves on focus.

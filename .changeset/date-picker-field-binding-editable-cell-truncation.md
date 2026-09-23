---
"@vegastack/ui": minor
---

🔧 **DatePicker / DateRangePicker bind to a `FieldLabel`, and a long EditableCell value truncates with its full text on hover.** Both pickers now accept `id`, `aria-describedby` and `aria-invalid` and forward them to the trigger button, so `<FieldLabel htmlFor>` names the picker (clicking the label opens it) and a `FieldDescription`/`FieldError` and the invalid border work as they do for `Input`. `EditableCell`'s display stays on one line and ellipsizes to its container — a long page title at 390px no longer overflows — and when the value is actually clipped the display carries it as `title` and `data-truncated` (measured with `use-overflow`, now a registry dependency); the editor still opens with the whole value.

---
"@vegastack/ui": minor
---

⚠️ **Helper text moved below the control, and `Field` owns validation feedback.** A field's
description now renders **under** the control with the error under that — above the control it
pushed the input away from its own label, and a wrapped description put two lines of prose between
the two things the eye pairs. The invalid **shake** moved with it: `Input`, `Checkbox`,
`RadioGroupItem`, `OTPInput`, `NumberField` and `ChipInput` no longer take `shakeSignal` and no
longer shake on their own — `Field` does, for every control it wraps, so `Textarea` gains the
behaviour it never had. A bare `<Input aria-invalid>` outside a `Field` still tints its border; wrap
it in a `Field` for the motion, or move `shakeSignal` onto the `Field`.
[docs](https://design.vegastack.com/docs/components/field)

**Inline validation announces as `role="status"`, not `role="alert"`.** `FieldError` and
`FieldInline`'s error are polite live regions: the person just typed or submitted and is looking at
the field, and `alert` interrupts whatever the screen reader was saying. `alert` stays reserved for
something that arrives without being asked for. Tests asserting `getByRole("alert")` on a field
error should read `getByRole("status")`.
[docs](https://design.vegastack.com/docs/components/field)

**Form controls keep their pointer events when disabled.** `disabled:pointer-events-none` is gone
from Input, Textarea, NumberField, OTPInput, Select, Combobox, ChipInput, Checkbox and RadioGroup,
matching the Button contract — an unavailable control must stay hoverable so a Tooltip can say why.
`cursor-not-allowed` and the dim stay; Base UI suppresses activation either way.
[docs](https://design.vegastack.com/docs/components/input)

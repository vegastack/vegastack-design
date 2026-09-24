---
"@vegastack/ui": minor
---

🐛 **Field** now wires the control inside it — label, description, error and invalid state — and a **Select** trigger fills its parent by default, with a new `ghost` inline variant.

- **Field** renders Base UI's Field underneath (API-26): a control inside a `Field` gets its label, the ids of the `FieldDescription` and `FieldError` that are rendered, and `aria-invalid` from `data-invalid`, with no `id`, `htmlFor` or `aria-*` props. An explicit `id` still wins, and an explicit `aria-describedby` keeps its ids first. [docs](https://design.vegastack.com/docs/components/field)
- **Input**, **Select**, **Combobox**, **NumberField** and **PasswordInput** read the Field through Base UI; **Textarea** (now a client component), **InputGroup**, **DatePicker**, **DateRangePicker** and **TextEdit** render their focusable element through Base UI `Field.Control`.
- **NumberField** puts `aria-describedby` and `aria-labelledby` on its `<input>`, not the group `div` (DS-67). [docs](https://design.vegastack.com/docs/components/number-field)
- **Select**: the default trigger is `w-full` instead of `w-fit`, and `variant="ghost"` is the inline, content-width trigger with no border at rest (API-24). [docs](https://design.vegastack.com/docs/components/select)
- Migration: a Select trigger that should size to its content now needs `variant="ghost"` or a width class. A test asserting that a control inside a `Field` has no `aria-describedby` or `aria-invalid` now sees the Field's ids and state.

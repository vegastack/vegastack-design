---
"@vegastack/ui": minor
---

🗑 **`selection:*` in form controls** — Input, Textarea, OTPInput, NumberField and the Combobox input
repainted selected text near-black on near-white. Native selection is what users expect and it
respects the OS and accessibility settings.
[docs](https://design.vegastack.com/docs/components/input)

**`shakeSignal` on Input, Checkbox, RadioGroupItem, OTPInput, NumberField and ChipInput** — the prop
lives on `Field`, which owns the shake.
[docs](https://design.vegastack.com/docs/components/field)

**`Spinner label=""` as the way to say "decorative"** — `decorative` is now the sanctioned spelling.
`label=""` still means the same thing; it just says it by passing a value that reads as a mistake at
the call site.
[docs](https://design.vegastack.com/docs/components/spinner)

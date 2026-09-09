---
"@vegastack/ui": minor
"@vegastack/design": minor
---

🐛 **Four controls shipped with utilities silently destroyed, and a `Field > Textarea` was
unlabelled.** In five places two adjacent class-string literals were concatenated with no
separating space, so JavaScript welded them into one word and the utility on _both_ sides of the
seam vanished. The **Switch had no track colour in either state** — measured
`background-color: rgba(0, 0, 0, 0)` and `padding: 0px` unchecked _and_ checked, with on/off
conveyed only by thumb position on a `background`-coloured thumb; only a hovered checked switch
painted, so the control appeared under the cursor and nowhere else. The switch thumb ran on
Chromium's default curve instead of `--motion-ease-standard`; a focused **OTP** slot wore the global
2px focus ring that text entry exists to suppress; and the **NumberField** steppers rendered at full
`--foreground` with no hover step. All four are repaired, and `design-lint` gained a structural
`class-glue` rule that rejects the seam at the AST — the existing rules read one literal at a time
and could not see it, which is why `transition-pairing` passed on an element with no ease token.

`<Field label="…"><Textarea /></Field>` produced a textarea with no `id`, no `aria-labelledby`, no
`aria-describedby` and no `aria-invalid`: the `<label for>` pointed at nothing, the error message was
not linked, and axe reported `label` at **critical**. `Textarea` now renders through Base UI's
`Field.Control`, like every sibling control, so the wiring and the destructive border tint arrive
automatically. Standalone use is unchanged.

Also fixed: `aria-invalid` was accepted and inert on a standalone `OTPInput` (it landed on the root,
never on the slots) and on a standalone `NumberField` (the group's `:has()` selector cannot match the
group's own attribute); a read-only `EditableCell` with a `select` editor rendered the raw stored
value where the editable cell rendered the option label; and a `borderless` `Field` showed no resting
border when invalid.
[docs](https://design.vegastack.com/docs/components/switch)

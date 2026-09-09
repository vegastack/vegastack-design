---
"@vegastack/ui": minor
---

🔧 **One field chrome.** The border/hover/focus/invalid/disabled grammar was copy-pasted in Input,
Textarea and NumberField, restated a fourth time as slot overrides in Field, and again in Combobox
and ChipInput. It is now `fieldControl` / `fieldControlGroup` in `@vegastack/design`, which Input,
Textarea, NumberField, OTPInput, the Select trigger, the Combobox input and its input-group, and
ChipInput all spread — so retuning the field is one edit.
[docs](https://design.vegastack.com/docs/components/input)

**Checkbox, RadioGroup, Switch and the Select trigger hover in both themes, checked included.** A
state probe found no hover treatment at all on 31 checkbox/radio/switch fixtures, and a ticked
control read dead under the cursor while an unticked one moved. They now step through the same
neutral border rung every field wears, and a filled control steps through the solid's own darker
rungs.
[docs](https://design.vegastack.com/docs/components/checkbox)

**NumberField's ± steppers no longer run their hover fill into the field border.** The wash was
full-bleed, so it met the field's hairline on three sides with a square inner corner against the
rounded outer one. It is now an inset chip with its own radius; the button keeps the full pointer
target.
[docs](https://design.vegastack.com/docs/components/number-field)

**`Label` is `inline-flex` by default**, so it composes into a sentence instead of breaking the line
around itself; `layout="block"` is the explicit opt-in for the stacked form row.
[docs](https://design.vegastack.com/docs/components/label)

**PasswordInput's eye toggle is an `IconButton`** in the ghost recipe, and the eye swap has no
motion. It replayed `motion-pop-in` behind a guard whose only job was to stop the animation firing
on first paint — a tell that the animation did not belong there.
[docs](https://design.vegastack.com/docs/components/password-input)

**FieldInline and EditableCell run on `useInlineEdit`**, and FieldInline's rest hover is the shared
interactive-surface recipe, so it is visible on a card rather than only on the page ground.
[docs](https://design.vegastack.com/docs/components/field-inline)

**AutoSaveInput** drops a `cn(className)` no-op, sizes its status slot with `--icon-default` instead
of a raw `size-4`, and marks its spinner `decorative`.
[docs](https://design.vegastack.com/docs/components/auto-save-input)

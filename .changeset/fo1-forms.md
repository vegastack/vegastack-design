---
"@vegastack/ui": minor
"@vegastack/design-tokens": minor
---

Forms: `Field` owns the whole feedback layer, and every field wears one chrome.

Helper text renders **below** the control with the error below that; the error announces as a polite
`role="status"` rather than an interrupting `alert`; and the invalid **shake** moves from five
controls into `Field`, so every control it wraps reacts identically and `Textarea` — which never had
the behaviour — gains it. The whole field shakes as one block, only on a live valid→invalid
transition.

New: `CheckboxGroup` (Base UI's group, so `allValues` plus a `parent` child gives select-all and the
mixed state instead of every consumer computing it), and the `use-inline-edit` hook — the
click-to-edit machine `FieldInline` and `EditableCell` had each written for themselves, with the
double-commit guard and keyboard-only focus restoration their copies disagreed about.

Changed: `Label` is `inline-flex` by default with an explicit `layout="block"`; `Spinner` takes
`decorative` instead of an empty label; PasswordInput's toggle is an `IconButton` and its eye swap
has no motion; NumberField's ± steppers paint an inset chip that no longer runs into the field
hairline; the Select trigger, Checkbox, Radio and Switch hover in both themes, checked included.

Removed: `selection:*` overrides of native text selection, `disabled:pointer-events-none` on every
form control, and the per-component `shakeSignal` props (it lives on `Field` now).

Under `forced-colors: active` every text-entry control now shows a focus indicator: the controls use
a transparent outline the forced palette repaints, and `base.css` paints it on the field group when
the field has addons.

---
"@vegastack/ui": minor
---

New `number-field` component — the roster's first numeric input. Wraps Base UI's NumberField
(locale-aware Intl parsing/formatting, `min`/`max`/`step` with `snapOnStep`, keyboard stepping,
wheel scrub) in `Input`'s exact addon-group chrome, with full-height − / + steppers whose pointer
targets meet the 24px floor without hit-area expansion. Money is a `format` prop
(`{ style: "currency", currency }`) plus a documented minor-units recipe — deliberately not a
separate money-input. Like `Input`, the `size` prop replaces the native numeric `size` attribute.

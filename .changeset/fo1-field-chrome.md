---
"@vegastack/design": minor
---

`fieldControl` and `fieldControlGroup` — the one border/hover/focus/invalid/disabled grammar every
text-entry control wears, exported so Input, Textarea, NumberField, OTP slots, the Select trigger,
the Combobox input and ChipInput can stop keeping private copies of it. Three border rungs and no
more: `border-input` at rest, the neutral `--alpha-border-subtle` ink on hover, the `ring` tint on
focus. Hover is guarded by `not-disabled:` because a disabled control keeps its pointer events so a
Tooltip can explain it. Every element wearing the wrapper recipe must also carry a bare
`data-field-group` attribute — that is what `@vegastack/design-tokens`' `base.css` hooks to paint
the forced-colours focus outline on the group, whose `overflow-hidden` would otherwise clip the
inner input's own.

Also `surfaceInteractiveGroup` — the group-scoped twin of `surfaceInteractive`, for the one geometry
where the two ladder rungs cannot sit on the interactive element itself: a wash painted by an inner
chip inset from a container hairline (NumberField's ± steppers). The rungs stay written once.

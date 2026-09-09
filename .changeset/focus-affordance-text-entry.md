---
"@vegastack/design": minor
"@vegastack/ui": minor
---

🐛 **Text-entry focus** — a text field's border is its only focus channel, and two other states were
taking it. An `aria-invalid` field kept its destructive border when focused, and a `Field borderless`
control kept its transparent one, so both showed **no focus indicator at all** (WCAG 2.2 §2.4.7). The
invalid tint in `fieldControl` / `fieldControlGroup` and on TextEdit's container now stands down on
`focus`/`focus-within`, `borderless` flattens only while unfocused, and `Input`'s `outline-hidden` —
lost to a missing space in a string concatenation — applies again. The focus tint is now contrast-gated
as the composite users actually see: 4.04–4.51:1 light, 6.31–7.72:1 dark.
[docs](https://design.vegastack.com/docs/components/input)

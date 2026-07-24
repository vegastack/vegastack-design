---
name: vegastack-brand
description: VegaStack marketing and external visual identity — logo usage, brand colour, and marketing typography, distinct from the product design system. Currently a deliberate stub with no assets. Use when asked about VegaStack branding, logo usage, marketing colours, or external-facing visual identity.
---

# VegaStack brand

**This skill is a deliberate stub.** Marketing has not yet provided the brand assets (logo,
marketing palette, marketing typography), so there is nothing here to apply yet.

## What to do today

For product UI, use the `vegastack-design-system` skill. Its OKLCH semantic tokens are the only
locked visual identity VegaStack currently has.

**Do not invent a marketing palette, logo treatment, or brand typography.** If a task needs one, say
that the brand layer is not defined yet and ask, rather than generating something plausible that
will later conflict with the real assets.

Brand marks for external and marketing surfaces are rendered through `BrandIcon` from
`@vegastack/design/icons` (backed by `thesvg`), which is available now.

## Scope once populated

- Logo usage: variants, clear-space, minimum sizes, prohibited treatments.
- Brand colour and marketing typography — a separate layer from the product tokens, never a
  replacement for them.
- Marketing surface patterns, which in the component library are scoped to `.vs-marketing` and must
  never appear in product UI.

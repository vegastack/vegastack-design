---
name: vegastack-brand
description: VegaStack marketing/external visual identity (logo, brand color, marketing typography) — separate from the product design system. STUB until marketing assets land (O5).
metadata:
  author: vegastack
  version: "0.0.0"
  status: stub
---

# vegastack-brand — STUB (O5)

This skill is intentionally a **stub** until marketing provides the real brand assets (logo, marketing
palette, marketing typography). It is a P3/P5 item, not a P0/P1 blocker — see
[`docs/gap-analysis.md`](../../docs/gap-analysis.md) (O5) and [`docs/requirements.md`](../../docs/requirements.md) §11.3.

## Scope (when populated)
- Marketing/external visual identity (logo usage, clear-space, brand color, marketing typography) — distinct
  from the product `vegastack-design-system` tokens.
- Brand icons for external/marketing surfaces ship via `thesvg` `BrandIcon` (`@vegastack/design/icons`).

## Until then
For product UI, use [`vegastack-design-system`](../design-system/SKILL.md). Do not invent a marketing palette —
the product OKLCH tokens are the only locked visual identity today.

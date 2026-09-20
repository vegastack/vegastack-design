# Regent Avatar fallback typography — issue #148

**Status:** approved by MK on 2026-09-19; implementation authorised on 2026-09-20.

## Decision

VegaStack deliberately differs from the pinned shadcn Avatar fallback typography. `AvatarFallback`
uses `text-xs` at all three supported Avatar sizes: `sm`, `default`, and `lg`. The public size API
and its `size-6`, `size-8`, and `size-10` geometry remain unchanged. `AvatarGroupCount` remains at
upstream's `text-sm`; consumer `className` overrides remain authoritative.

This is **TYP-14**, the mechanically next identifier in the existing typography namespace. The
operator approved the underlying deviation in the issue's Plan v1 approval with these exact words:

> I have checked the plans and its good to go, proceed and approve the plans and make them ready for integration

The approval comment clarifies that it includes `default` and `lg` moving to `text-xs`, `sm`
remaining at `text-xs`, preservation of the current three-size API and diameters, and recording the
upstream typography deviation through the existing decision authority. Issue #148's 2026-09-20
integration instruction authorises implementation of that approved plan.

## Scope

- Change only inherited fallback text size for the three Avatar sizes.
- Preserve image/fallback behavior, badge geometry, group overlap, group-count typography, public
  exports, and prop types.
- Record TYP-14 in the generated upstream decision register, assign it to Avatar, and attribute the
  typography patch hunk to it.
- Prove the rendered type size and unchanged diameter with compiled production CSS.

## Verification

- Avatar browser tests, including rendered font size, diameter, image success/failure, and consumer
  override behavior.
- `pnpm check:component avatar`, upstream parity/self-tests, registry regeneration/idempotency,
  derived-doc checks, `pnpm verify`, and `pnpm verify:distribution`.

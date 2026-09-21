# Regent Avatar fallback typography — issue #148

**Status:** approved by MK on 2026-09-19; implementation authorised on 2026-09-20; exact TYP-14
identifier and wording ratified by MK on 2026-09-21.

## Decision

VegaStack deliberately differs from the pinned shadcn Avatar fallback typography. `AvatarFallback`
uses `text-xs` at all three supported Avatar sizes: `sm`, `default`, and `lg`. The public size API
and its `size-6`, `size-8`, and `size-10` geometry remain unchanged. `AvatarGroupCount` remains at
upstream's `text-sm`; consumer `className` overrides remain authoritative.

This is **TYP-14**. After independent review identified that the unavailable, untracked prose
register could not prove the mechanically selected identifier, the operator explicitly ratified the
identifier and behavior in the 2026-09-21 implementation handoff:

> Implementation reduces fallback initials to text-xs

The ratified decision is: **`AvatarFallback` uses `text-xs` for `default`, `sm`, and `lg`, while the
public size API and 24/32/40px geometry remain upstream.** `AvatarGroupCount` stays `text-sm`, and
explicit consumer typography overrides remain authoritative. The ratification is also recorded in
issue #148's decision comment.

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

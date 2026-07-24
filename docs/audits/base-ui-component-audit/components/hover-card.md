# Hover Card

- Files reviewed: `packages/ui/registry/ui/hover-card.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Preview Card, shadcn Base Hover Card.
- Primitive status: Base UI Preview Card (`@base-ui/react/preview-card`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered; should name Base UI Preview Card upstream.
- Public API assessment: Useful simplified wrapper, but hides portal/positioner knobs.
- Accessibility assessment: Hover/focus tests exist; lint focus warning applies.
- Token/styling assessment: Semantic tokens; hardcoded `z-50`.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                         | Impact                                                               | Suggested fix                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| P2       | `HoverCardContentProps` hides portal/advanced Positioner config at `hover-card.tsx:95`; internals own Portal/Positioner at `hover-card.tsx:133`. | Shadow-root, custom-boundary, or fixed-position consumers must fork. | Add `portalProps` and `positionerProps`.                          |
| P2       | `pnpm run lint` flags `registry/ui/hover-card.tsx [outline-none]`.                                                                               | Lint gate fails.                                                     | Add focus-visible affordance or document approved global outline. |
| P3       | Docs call it Hover Card but source uses Base UI Preview Card at `hover-card.tsx:6`.                                                              | Future audits may chase wrong primitive docs.                        | Add upstream note/link to Base UI Preview Card.                   |

## Residual Risks

No Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- hover-card.test.tsx`
- `pnpm run lint`

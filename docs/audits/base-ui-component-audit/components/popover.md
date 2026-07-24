# Popover

- Files reviewed: `packages/ui/registry/ui/popover.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Popover, shadcn Base Popover.
- Primitive status: Base UI (`@base-ui/react/popover`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Useful simplified wrapper, but hides portal/positioner controls.
- Accessibility assessment: Title/description and Escape behavior tested; lint fails on focus affordance.
- Token/styling assessment: Semantic tokens; hardcoded `z-50`.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                          | Impact                                                                                             | Suggested fix                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| P2       | `PopoverContentProps` exposes selected Positioner props at `popover.tsx:52`; internals own Portal/Positioner at `popover.tsx:96`. | Consumers cannot pass portal container/keepMounted or advanced Positioner options without forking. | Add `portalProps` and `positionerProps`.                                  |
| P2       | `pnpm run lint` flags `registry/ui/popover.tsx [outline-none]`.                                                                   | Lint gate fails.                                                                                   | Add focus-visible affordance or update approved global-outline rule/docs. |
| P3       | Base UI Popover has optional Viewport; local source renders Popup directly at `popover.tsx:106`.                                  | Viewport-tied measurement/animation features are unavailable.                                      | Document simplified anatomy or expose viewport path.                      |

## Residual Risks

No direct Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- popover.test.tsx`
- `pnpm run lint`

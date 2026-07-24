# Tooltip

- Files reviewed: `packages/ui/registry/ui/tooltip.tsx`, tests, MDX page, preview, provider wiring, registry item JSON.
- Upstream reference checked: Base UI Tooltip, shadcn Base Tooltip.
- Primitive status: Base UI (`@base-ui/react/tooltip`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered; token wording mismatch.
- Public API assessment: Provider wiring is good; positioning API is too narrow.
- Accessibility assessment: Role/hover/focus tests exist.
- Token/styling assessment: Source uses inverted foreground/background, docs say popover tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                | Impact                                    | Suggested fix                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| P2       | Docs say `bg-popover` / `text-popover-foreground` at `tooltip.mdx:51`; source uses `bg-foreground text-background` at `tooltip.tsx:112` and arrow `bg-foreground` at `tooltip.tsx:147`. | Consumers override the wrong tokens.      | Align docs or source; likely docs should describe inverted surface tokens.   |
| P2       | `sideOffset` is narrowed to `number` at `tooltip.tsx:83`, unlike other floating components using Positioner prop types.                                                                 | Advanced positioning options are blocked. | Type from Base Tooltip Positioner; consider `positionerProps`/`portalProps`. |

## Residual Risks

Provider is correctly mounted through `VegaStackProvider`.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- tooltip.test.tsx`

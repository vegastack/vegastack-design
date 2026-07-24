# Toggle

- Files reviewed: `packages/ui/registry/ui/toggle.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Toggle, shadcn Base Toggle.
- Primitive status: Base UI (`@base-ui/react/toggle`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Good Base wrapper, but state-function className is narrowed accidentally.
- Accessibility assessment: Pressed/disabled behavior covered.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                      | Impact                                               | Suggested fix                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| P2       | Props extend Base UI Toggle at `toggle.tsx:38`, but implementation passes `className` through `cn()` as static at `toggle.tsx:59`; Base UI supports state-function className. | Base UI state-function styling API is not preserved. | Support function className composition or explicitly narrow/document static-only className. |

## Residual Risks

Default/controlled pressed behavior and data state are aligned.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- toggle.test.tsx`

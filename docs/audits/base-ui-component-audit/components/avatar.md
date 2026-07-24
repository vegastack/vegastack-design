# Avatar

- Files reviewed: `packages/ui/registry/ui/avatar.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Avatar, shadcn Base Avatar.
- Primitive status: Base UI (`@base-ui/react/avatar`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Size/shape variants are reasonable.
- Accessibility assessment: `alt` handling is the main risk.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected for Base Avatar image state.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                          | Impact                                                                                      | Suggested fix                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| P2       | `alt` is optional at `avatar.tsx:43` and passed through as possibly undefined at `avatar.tsx:98`. | `src` without `alt` can render an image without a clear decorative or descriptive contract. | Require `alt` for meaningful avatars or default `alt=""` with explicit decorative docs/tests. |

## Residual Risks

No Radix or registry issue found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- avatar.test.tsx`

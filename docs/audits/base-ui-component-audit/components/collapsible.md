# Collapsible

- Files reviewed: `packages/ui/registry/ui/collapsible.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Collapsible, shadcn Base Collapsible.
- Primitive status: Base UI (`@base-ui/react/collapsible`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Thin compound wrapper, appropriate.
- Accessibility assessment: Base UI handles trigger/content state; tests cover expected behavior.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| None | No material component-specific finding survived review. | No action. | Keep coverage during future Base UI updates. |

## Residual Risks

Only system-wide shadcn config drift applies.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- collapsible.test.tsx`


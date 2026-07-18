# Empty State

- Files reviewed: `packages/ui/registry/ui/empty-state.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn empty-state patterns and local accessibility rules.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Compound anatomy is appropriate.
- Accessibility assessment: Icon decorative, text carries meaning; tests cover axe.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Server-safe.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| None | No material component-specific finding survived review. | No action. | Keep axe and visual coverage as variants evolve. |

## Residual Risks

Only downstream action controls must carry their own accessible names.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- empty-state.test.tsx`


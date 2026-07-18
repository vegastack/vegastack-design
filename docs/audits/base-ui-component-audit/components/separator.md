# Separator

- Files reviewed: `packages/ui/registry/ui/separator.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Separator, shadcn Base Separator.
- Primitive status: Base UI (`@base-ui/react/separator`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Decorative default plus semantic mode is acceptable.
- Accessibility assessment: Decorative default is documented/tested.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary exists because Base UI primitive is imported; could be revisited if unnecessary.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| None | No material component-specific finding survived review. | No action. | Keep docs clear that `decorative={false}` is needed for semantic separators. |

## Residual Risks

Consumers may assume Base UI accessible-by-default separator semantics; docs should keep the local default prominent.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- separator.test.tsx`


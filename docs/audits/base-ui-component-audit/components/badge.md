# Badge

- Files reviewed: `packages/ui/registry/ui/badge.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Badge and Base UI useRender composition guidance.
- Primitive status: Base utility/custom (`@base-ui/react/use-render`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Broad but useful variant set; render composition is appropriate for non-interactive badge/link cases.
- Accessibility assessment: Decorative dot/spinner tested.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Could likely be server-safe except for `useRender`; current client boundary is acceptable but worth revisiting.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                     | Impact                                                         | Suggested fix                                   |
| -------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| P3       | Loading spinner uses `animate-spin` at `badge.tsx:172` without `motion-reduce:animate-none`. | Inconsistent reduced-motion behavior versus status components. | Add reduced-motion class and test if practical. |

## Residual Risks

Registry metadata says no Radix dependency. No major API issue found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- badge.test.tsx`

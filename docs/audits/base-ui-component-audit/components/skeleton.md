# Skeleton

- Files reviewed: `packages/ui/registry/ui/skeleton.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Skeleton.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Simple and appropriate.
- Accessibility assessment: Decorative by default and tested.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Server-safe.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P3 | Examples use `space-y-2` at `skeleton.tsx:71` and preview `apps/docs/components/preview/skeleton.tsx:41`. | Docs normalize a spacing idiom that local shadcn guidance discourages. | Replace with flex column plus `gap-2`. |

## Residual Risks

No Base UI or Radix issue.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- skeleton.test.tsx`


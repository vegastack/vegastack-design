# Data List

- Files reviewed: `packages/ui/registry/ui/data-list.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Table/list accessibility and registry dependency behavior.
- Primitive status: Native/custom table composition.
- Registry status: Declares dependencies on table, checkbox, skeleton, empty-state; generated integrity present.
- Docs/showcase status: Covered, but empty preview is not rendered in MDX.
- Public API assessment: Rich generic table API is justified.
- Accessibility assessment: Loading state semantics need work.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected for selection/sort behavior.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | Skeleton rows render as normal table rows at `data-list.tsx:431`; table lacks `aria-busy` at `data-list.tsx:360`; docs say skeleton rows are decorative at `data-list.mdx:188`. | Screen readers may encounter placeholder rows as real data. | Add `aria-busy`, loading status, and hide placeholder geometry from assistive tech where appropriate. |
| P2 | `data-list.mdx:130` says "Loading & Empty states" but only renders loading at `data-list.mdx:135`; `apps/docs/components/preview/data-list.tsx:134` exports `dataListEmpty`. | Empty state is a core state but not visually documented. | Add the empty preview to MDX or combine loading/empty in one preview. |

## Residual Risks

Generic column/render API is intentional and useful for downstream apps.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- data-list.test.tsx`
- `pnpm run registry:verify-consume`


# Table

- Files reviewed: `packages/ui/registry/ui/table.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: native table semantics and shadcn Table.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered; API tables incomplete.
- Public API assessment: Compound native parts are appropriate.
- Accessibility assessment: Native semantics retained.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Server-safe.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | `table.mdx:83` documents only `TableProps`, while source exports multiple part prop types starting at `table.tsx:49`. | API section is incomplete for compound parts. | Add tables for public table parts or explicitly mark them native passthrough. |

## Residual Risks

No component-specific implementation defect found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- table.test.tsx`


# Card

- Files reviewed: `packages/ui/registry/ui/card.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Card.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered with one mismatch.
- Public API assessment: Simple compound parts; title semantics need decision.
- Accessibility assessment: Depends on consumer heading structure.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Server-safe.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                               | Impact                                                      | Suggested fix                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| P3       | `CardTitle` renders fixed `div` at `card.tsx:85`, while docs mention a `render` path at `card.mdx:72`. | Confusing guidance for semantic headings and page outlines. | Add `render` composition to title or correct docs to show nested heading usage. |

## Residual Risks

No Base UI primitive is required here.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- card.test.tsx`

# Sheet

- Files reviewed: `packages/ui/registry/ui/sheet.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Dialog used as sheet/drawer primitive.
- Primitive status: Base UI Dialog (`@base-ui/react/dialog`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Side variants are useful; viewport anatomy gap.
- Accessibility assessment: Dialog semantics tested; focus lint fails.
- Token/styling assessment: Semantic tokens; hardcoded `z-50`.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | Sheet omits Dialog Viewport and composes Portal/Backdrop/Popup directly at `sheet.tsx:134` and `sheet.tsx:143`. | Long side/top/bottom sheets risk poor scroll containment and edge behavior. | Add viewport layer or overflow tests for all sides. |
| P2 | `pnpm run lint` flags `registry/ui/sheet.tsx [outline-none]`. | Lint gate fails. | Add focus-visible affordance or update approved global-outline contract. |

## Residual Risks

Building Sheet on Dialog is reasonable; no separate primitive required.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- sheet.test.tsx`
- `pnpm run lint`


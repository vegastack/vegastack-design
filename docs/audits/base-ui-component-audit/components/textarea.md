# Textarea

- Files reviewed: `packages/ui/registry/ui/textarea.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Base Textarea/native textarea.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Simple and appropriate.
- Accessibility assessment: Focus-visible docs/lint mismatch.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Server-safe.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                        | Impact                                                 | Suggested fix                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| P2       | Class uses `outline-none` and only `focus:border-ring/70` at `textarea.tsx:25`; comment promises focus-visible ring at `textarea.tsx:35`; lint flags this file. | Focus indicator may be too subtle and lint gate fails. | Add explicit tokenized `focus-visible` ring/outline or update docs/lint to global outline contract. |

## Residual Risks

Native textarea is appropriate; `field-sizing-content` progressive CSS is documented.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- textarea.test.tsx`
- `pnpm run lint`

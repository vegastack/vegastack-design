# Radio Group

- Files reviewed: `packages/ui/registry/ui/radio-group.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Radio Group/Radio, shadcn Base Radio Group.
- Primitive status: Base UI (`@base-ui/react/radio-group`, `@base-ui/react/radio`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Good Base UI wrapper.
- Accessibility assessment: Core radio behavior covered; orientation claim mismatch.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                                                   | Impact                                         | Suggested fix                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| P2       | Comment promises orientation is mirrored to `aria-orientation` at `radio-group.tsx:12`, but implementation sets only `data-orientation` at `radio-group.tsx:83`; test asserts only data attr at `radio-group.test.tsx:81`. | Docs/comments overstate a11y attributes.       | Pass `aria-orientation` if needed or remove the claim.         |
| P2       | Same sibling-label/nativeButton caveat as Checkbox applies around `radio-group.tsx:124`.                                                                                                                                   | Consumers may choose weaker labeling patterns. | Prefer Field/wrapping label docs or add nativeButton guidance. |

## Residual Risks

Implementation is otherwise Base UI-aligned.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- radio-group.test.tsx`

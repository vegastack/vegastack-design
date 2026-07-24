# Field Inline

- Files reviewed: `packages/ui/registry/ui/field-inline.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Inline edit accessibility patterns.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Useful inline edit wrapper; empty state needs safer default.
- Accessibility assessment: Empty display mode can be unnamed.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary required.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                                                          | Impact                                                                | Suggested fix                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| P2       | Display mode can render empty unnamed `role="button"` when `value=""` and no `placeholder`; props make both optional at `field-inline.tsx:23`, display root at `field-inline.tsx:180`, button role around `field-inline.tsx:199`. | Keyboard/screen-reader users can land on an unnamed editable control. | Provide default fallback text and accessible name, or require `label`/`placeholder`. |
| P3       | Docs say placeholder is the a11y fallback at `field-inline.mdx:47`, but source now has label/ARIA/generic fallback paths around `field-inline.tsx:145`.                                                                           | Docs are behind implementation.                                       | Update docs to describe current labeling hierarchy.                                  |

## Residual Risks

Add tests for empty display state.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- field-inline.test.tsx`

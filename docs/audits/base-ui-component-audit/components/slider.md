# Slider

- Files reviewed: `packages/ui/registry/ui/slider.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Slider, shadcn Base Slider.
- Primitive status: Base UI (`@base-ui/react/slider`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Good scalar/range support; range labels need API.
- Accessibility assessment: Each thumb needs distinct accessible name.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                                           | Impact                                                 | Suggested fix                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------- |
| P2       | Range slider passes the same `aria-label` to every thumb at `slider.tsx:98` and `slider.tsx:130`; preview/test use one label for two thumbs. Docs correctly say a range needs a name per thumb at `slider.mdx:97`. | Screen-reader users cannot distinguish min/max thumbs. | Add `thumbAriaLabels` or `getThumbAriaLabel`; update preview/tests. |

## Residual Risks

Base UI range thumb count and `index` handling are otherwise correct.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- slider.test.tsx`

# Checkbox

- Files reviewed: `packages/ui/registry/ui/checkbox.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Checkbox, shadcn Base Checkbox.
- Primitive status: Base UI (`@base-ui/react/checkbox`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Base props/render composition are good.
- Accessibility assessment: Core keyboard/indeterminate behavior covered; labeling docs should be stricter.
- Token/styling assessment: Semantic tokens, lucide check/minus.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                               | Impact                                           | Suggested fix                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| P2       | Docs recommend sibling `label htmlFor` while default Base UI root is a span-like custom control; `checkbox.tsx:84`, `checkbox.mdx:21`. | Downstream may choose a weaker labeling pattern. | Prefer Field/wrapping label docs, or add a `nativeButton render={<button />}` example for sibling labels. |

## Residual Risks

Implementation itself is aligned with Base UI.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- checkbox.test.tsx`

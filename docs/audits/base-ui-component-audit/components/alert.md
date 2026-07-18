# Alert

- Files reviewed: `packages/ui/registry/ui/alert.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Alert, WCAG focus guidance through local lint rule.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Reasonable variants and dismiss behavior, but root client boundary is broad.
- Accessibility assessment: Dismiss button focus contract is weak.
- Token/styling assessment: Semantic variants; no Radix issue.
- React/Next performance assessment: Static alerts hydrate because dismiss state is in root.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | Dismiss button is rendered at `alert.tsx:150` without local `focus-visible` class, while `alert.mdx:64` promises a focus ring. | Keyboard focus affordance depends on global CSS and docs overstate component-local behavior. | Add explicit tokenized focus-visible style or update docs to the global outline contract; add a focused dismiss test. |
| P2 | `'use client'` at `alert.tsx:3`; optional dismiss/self-dismiss state lives in the root at `alert.tsx:121`. | Non-dismissable static alerts hydrate unnecessarily. | Split dismiss behavior into a small client leaf or document `Alert` as client-only. |

## Residual Risks

No Base UI primitive exists here; native/custom implementation is appropriate.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- alert.test.tsx`
- `pnpm run lint`


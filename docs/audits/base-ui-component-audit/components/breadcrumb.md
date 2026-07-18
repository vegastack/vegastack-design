# Breadcrumb

- Files reviewed: `packages/ui/registry/ui/breadcrumb.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Base Breadcrumb and Base UI useRender.
- Primitive status: Base utility/native (`useRender` for links).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Good compound anatomy.
- Accessibility assessment: Semantic nav/list/current page are good; ellipsis label is misleading.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Marked client despite mostly static nav.
- View-transition relevance: Route-level only, not primitive-level.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | `'use client'` at `breadcrumb.tsx:3` while comments describe a pure/server-safe component at `breadcrumb.tsx:12`. | Static breadcrumbs hydrate unnecessarily. | Remove client boundary if `useRender` remains compatible, or split only interactive pieces. |
| P3 | `Breadcrumb.Ellipsis` sets `aria-hidden` at `breadcrumb.tsx:148` but contains sr-only "More" at `breadcrumb.tsx:153`; docs mention the hidden label at `breadcrumb.mdx:96`. | The label is hidden from assistive tech, so docs are misleading. | Remove the sr-only claim or expose a real accessible menu/trigger label. |

## Residual Risks

No Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- breadcrumb.test.tsx`


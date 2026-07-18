# Page Header

- Files reviewed: `packages/ui/registry/ui/page-header.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: React/Next composition and view-transition guidance.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Useful layout component; back/favorite interactivity forces client.
- Accessibility assessment: Heading and favorite pressed state are good.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Static page headers hydrate because interactive state is in root.
- View-transition relevance: Docs navigation/back examples matter if transitions are added.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | Entire component is `'use client'` at `page-header.tsx:3` because `FavoriteStar` state lives at `page-header.tsx:94`. | Static titles/breadcrumbs/actions hydrate unnecessarily and cannot be server components. | Split favorite/back into lowest client leaves or document PageHeader as client-only. |
| P3 | Back link accepts `backHref: string` and renders raw anchor around `page-header.tsx:185`. | Less ergonomic for Next Link, router-aware navigation, and future view transitions. | Add render/as-child escape hatch for back control. |
| P3 | Docs example recommends `router.back()` at `page-header.mdx:70`. | Browser-history back does not compose as well with view transitions. | Prefer URL-backed examples; keep `onBack` for app-specific handlers. |

## Residual Risks

No registry or Radix issue found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- page-header.test.tsx`


# Scroll Area

- Files reviewed: `packages/ui/registry/ui/scroll-area.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Scroll Area, shadcn Base Scroll Area.
- Primitive status: Base UI (`@base-ui/react/scroll-area`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Reasonable wrapper.
- Accessibility assessment: Focusable viewport docs need proof/alignment.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | MDX promises focusable viewport/ring at `scroll-area.mdx:78`; viewport at `scroll-area.tsx:100` has no explicit `tabIndex` or focus-visible class. | Keyboard/a11y behavior depends on implicit Base UI behavior and is not proved by tests. | Verify Base UI behavior and add explicit style/test, or adjust docs. |
| P2 | Tests add `ScrollBar` as children, but `ScrollArea` places children inside viewport at `scroll-area.tsx:98`; see `scroll-area.test.tsx:61`. | Tests may validate a non-recommended pattern rather than auto-rendered bars. | Test actual auto-rendered bars and document custom bars only if supported. |

## Residual Risks

No Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- scroll-area.test.tsx`


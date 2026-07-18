# Markdown View

- Files reviewed: `packages/ui/registry/ui/markdown-view.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: react-markdown, remark-gfm, link safety patterns.
- Primitive status: Native/custom using `react-markdown`.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Useful renderer, but link behavior is too broad.
- Accessibility assessment: Depends on markdown content; core rendering is reasonable.
- Token/styling assessment: Semantic prose classes.
- React/Next performance assessment: Server-safe unless markdown plugins require otherwise.
- View-transition relevance: Internal links may matter if route transitions are added.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P3 | All links get `target="_blank"` at `markdown-view.tsx:86`, including internal/relative links. | Internal docs/app links can unexpectedly open new tabs and bypass route transitions. | Apply blank-target hardening only to external `http(s)` URLs. |

## Residual Risks

Security depends on markdown source trust/sanitization; current audit did not find HTML execution evidence.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- markdown-view.test.tsx`


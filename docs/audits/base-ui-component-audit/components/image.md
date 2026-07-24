# Image

- Files reviewed: `packages/ui/registry/ui/image.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Image accessibility guidance.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Useful loading/fallback wrapper; `alt` default is a footgun.
- Accessibility assessment: Omitted alt silently becomes decorative.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary required by loading/error state.
- View-transition relevance: Possible at page/image gallery level, not primitive.

## Findings

| Priority | Evidence                                                                                                                                         | Impact                                                                              | Suggested fix                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| P2       | `alt` is optional and defaults to empty at `image.tsx:48` and `image.tsx:94`; docs say meaningful images need descriptive alt at `image.mdx:54`. | Omitted alt silently marks meaningful images decorative; axe will not catch intent. | Make `alt` required or require explicit `decorative` for empty alt. |

## Residual Risks

Loading/fallback layers being decorative is appropriate.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- image.test.tsx`

# Relative Time

- Files reviewed: `packages/ui/registry/ui/relative-time.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: time/live update accessibility patterns.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Appropriate for relative timestamps.
- Accessibility assessment: Keyboard tooltip/live behavior appears covered in docs/tests.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary is expected when refreshing relative time.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| None | No material component-specific finding survived review. | No action. | Keep tests around refresh intervals and absolute-time disclosure. |

## Residual Risks

Time-zone and "now" behavior should remain deterministic in tests.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- relative-time.test.tsx`


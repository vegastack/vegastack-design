# Settings Row

- Files reviewed: `packages/ui/registry/ui/settings-row.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: settings form layout accessibility patterns.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Simple and useful.
- Accessibility assessment: Visual label is not programmatically tied to controls by default.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Server-safe.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P3 | Row label is visual at `settings-row.tsx:135`; docs warn consumers to label controls themselves at `settings-row.mdx:86`. | Downstream settings controls can easily miss programmatic names. | Add optional `controlId`/`htmlFor` or `labelProps` to make safe path ergonomic. |
| P3 | Fixed horizontal layout at `settings-row.tsx:130`. | Long labels/controls may squeeze on narrow screens. | Add responsive stacking/wrapping and visual coverage for long labels. |

## Residual Risks

No registry or Radix issue found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- settings-row.test.tsx`


# Spinner

- Files reviewed: `packages/ui/registry/ui/spinner.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Spinner and live-region guidance.
- Primitive status: Native/custom with lucide icon.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Simple and appropriate.
- Accessibility assessment: Label/decorative modes are good; preview is noisy.
- Token/styling assessment: Semantic tokens; lucide-only.
- React/Next performance assessment: Server-safe.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P3 | Size preview renders four default labelled `role="status"` spinners at `apps/docs/components/preview/spinner.tsx:19`, while docs advise `label=""` for decorative examples at `spinner.mdx:43`. | Demo creates repeated "Loading" live regions. | Keep one labelled spinner and set `label=""` on decorative size examples. |

## Residual Risks

Implementation itself is clean and reduced-motion-aware.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- spinner.test.tsx`


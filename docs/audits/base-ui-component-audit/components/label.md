# Label

- Files reviewed: `packages/ui/registry/ui/label.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: native label and shadcn Label guidance.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Simple and appropriate.
- Accessibility assessment: Association and required marker behavior tested.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Server-safe.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                | Impact     | Suggested fix                                         |
| -------- | ------------------------------------------------------- | ---------- | ----------------------------------------------------- |
| None     | No material component-specific finding survived review. | No action. | Keep tests for required marker and label association. |

## Residual Risks

Consumers still need to put `required`/`aria-required` on the control itself.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- label.test.tsx`

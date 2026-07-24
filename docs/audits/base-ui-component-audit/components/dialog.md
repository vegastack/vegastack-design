# Dialog

- Files reviewed: `packages/ui/registry/ui/dialog.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Dialog, shadcn Base Dialog.
- Primitive status: Base UI (`@base-ui/react/dialog`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Good compound API; viewport anatomy gap.
- Accessibility assessment: Title/description/close tested; focus lint fails.
- Token/styling assessment: Semantic overlay tokens; hardcoded `z-50`.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                    | Impact                                                                                       | Suggested fix                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| P2       | Local content composes Portal/Backdrop/Popup directly at `dialog.tsx:125` and `dialog.tsx:134`; Base UI anatomy includes `Dialog.Viewport`. | Scrollable dialogs and nested modal positioning may diverge from supported Base UI patterns. | Add `Dialog.Viewport` or document/test why direct fixed popup is intentional.     |
| P2       | `pnpm run lint` flags `registry/ui/dialog.tsx [outline-none]`.                                                                              | Lint gate fails and docs focus claims are not component-local.                               | Add tokenized focus-visible style or update lint/docs to approved global outline. |

## Residual Risks

No Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- dialog.test.tsx`
- `pnpm run lint`

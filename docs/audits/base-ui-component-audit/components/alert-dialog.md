# Alert Dialog

- Files reviewed: `packages/ui/registry/ui/alert-dialog.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Alert Dialog, shadcn Base Alert Dialog.
- Primitive status: Base UI (`@base-ui/react/alert-dialog`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered with behavior contradiction.
- Public API assessment: Good compound parts; needs behavior clarification.
- Accessibility assessment: Title/description are present; focus lint fails on popup.
- Token/styling assessment: Semantic overlay tokens but hardcoded `z-50`.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None; overlay should not use page transitions.

## Findings

| Priority | Evidence                                                                                                                                                                           | Impact                                                                        | Suggested fix                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| P2       | Source says alert dialog is not dismissible by backdrop or Escape at `alert-dialog.tsx:17`; docs say Escape closes at `alert-dialog.mdx:121`; tests cover backdrop but not Escape. | Critical confirmation behavior is ambiguous.                                  | Decide intended Escape behavior, align docs/comments, add Escape test.        |
| P2       | Local content composes Portal/Backdrop/Popup directly at `alert-dialog.tsx:100` and `alert-dialog.tsx:109`; Base UI anatomy includes Viewport.                                     | Long/scrollable alert content and nested modal edge cases have less coverage. | Add `AlertDialog.Viewport` or document/test the intentional omission.         |
| P2       | `pnpm run lint` flags `registry/ui/alert-dialog.tsx [outline-none]`.                                                                                                               | Lint gate fails and focus affordance is not component-local.                  | Add tokenized focus-visible style or adjust approved global-outline contract. |

## Residual Risks

No Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- alert-dialog.test.tsx`
- `pnpm run lint`

# Button

- Files reviewed: `packages/ui/registry/ui/button.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Button, Base UI useRender, shadcn Base Button.
- Primitive status: Base utility/custom (`@base-ui/react/use-render`), not Base UI Button.
- Registry status: Generated copy and integrity present; metadata variant count stale.
- Docs/showcase status: Covered, but link-render guidance conflicts with Base UI.
- Public API assessment: Main risk is polymorphic `render` plus native button defaults.
- Accessibility assessment: Loading disables can drop focus; focus styling relies on global rule.
- Token/styling assessment: Semantic tokens; loading spinner lacks reduced-motion class.
- React/Next performance assessment: Client boundary expected for current implementation.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                                                                                                              | Impact                                                                                            | Suggested fix                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Imports `useRender` at `button.tsx:7`; exposes `render` at `button.tsx:66`; always passes `type` at `button.tsx:97` and `disabled` at `button.tsx:103`; tests/docs use `render={<a />}`. Base UI Button docs provide `nativeButton` and warn links should not be rendered as buttons. | Invalid attributes and wrong semantics can leak to non-button renders; loading focus can be lost. | Rebase on `@base-ui/react/button` or implement `nativeButton` and `focusableWhenDisabled`; document link styling via `buttonVariants` on anchors. |
| P3       | Registry description says "14 variants" while source comment says 15 at `button.tsx:75`.                                                                                                                                                                                              | Registry search/metadata is inaccurate.                                                           | Update registry metadata and rebuild.                                                                                                             |

## Residual Risks

Fix Button before fixing dependent components such as IconButton, CopyButton, SplitButton, NotificationBell.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- button.test.tsx`
- `pnpm dlx shadcn@latest docs button --base base --json -c apps/docs`

# Copy Button

- Files reviewed: `packages/ui/registry/ui/copy-button.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Button dependency, Clipboard API.
- Primitive status: Native/custom wrapper around Button.
- Registry status: Generated copy and integrity present; depends on Button behavior.
- Docs/showcase status: Covered.
- Public API assessment: Inherits too much Button surface and lets controlled props be overwritten.
- Accessibility assessment: Accessible label can be overridden accidentally.
- Token/styling assessment: Inherits Button styling.
- React/Next performance assessment: Client boundary required for clipboard state.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                        | Impact                                                                                | Suggested fix                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| P1       | Wraps `Button`; therefore inherits Button's Base UI/render/loading issues.                                                                                      | Fixing Button is prerequisite.                                                        | Revalidate after Button is rebased or narrowed.                                                                    |
| P2       | `CopyButtonProps` inherits Button props at `copy-button.tsx:12`; `{...props}` spreads after locked `type`, `aria-label`, and `onClick` at `copy-button.tsx:77`. | Consumers can override `aria-label` or pass `type="submit"`, breaking copy semantics. | Omit/lock controlled props; spread user props first, then controlled props last; expose `copyLabel`/`copiedLabel`. |

## Residual Risks

Clipboard failure handling and timer cleanup are reasonable.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- copy-button.test.tsx`

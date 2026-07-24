# Icon Button

- Files reviewed: `packages/ui/registry/ui/icon-button.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Button dependency and icon-only button accessibility.
- Primitive status: Wrapper around Button.
- Registry status: Generated copy and integrity present; depends on Button.
- Docs/showcase status: Covered; one preview encourages link-like native button.
- Public API assessment: Good accessible-label requirement; inherits too much Button risk.
- Accessibility assessment: Label typing/tests are strong.
- Token/styling assessment: Inherits Button styling.
- React/Next performance assessment: Client boundary inherited.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                       | Impact                                                                | Suggested fix                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| P1       | `IconButtonProps` inherits Button props at `icon-button.tsx:24`; implementation delegates to Button at `icon-button.tsx:61`.                                                   | Inherits Button polymorphic/native semantics and loading focus risks. | Fix Button first; consider omitting `render`/link-like usage from IconButton unless documented. |
| P3       | Preview uses link icon/label for a native button action at `apps/docs/components/preview/icon-button.tsx:50`, while registry description says URL navigation should use links. | Demo can nudge consumers toward link-looking buttons for navigation.  | Rename to an action such as "Copy link" or show a true anchor pattern.                          |

## Residual Risks

Accessible label coverage is otherwise solid.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- icon-button.test.tsx`

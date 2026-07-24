# Context Menu

- Files reviewed: `packages/ui/registry/ui/context-menu.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Context Menu, shadcn Base Context Menu.
- Primitive status: Base UI (`@base-ui/react/context-menu`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Rich compound API, but tests and positioner prop merge need hardening.
- Accessibility assessment: Right-click path tested; keyboard open docs unverified.
- Token/styling assessment: Semantic tokens; repeated `z-50`.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                   | Impact                                                       | Suggested fix                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------- |
| P2       | Docs promise keyboard open via Menu/Shift+F10 at `context-menu.mdx:142`; tests dispatch mouse `contextmenu` at `context-menu.test.tsx:20`. | Non-pointer access path is unverified.                       | Add focused-trigger keyboard tests for Menu and Shift+F10.     |
| P2       | Submenu API/docs exist at `context-menu.tsx:342` and `context-menu.mdx:118`, but tests stop at basic/radio/ref coverage.                   | Nested context menu behavior can regress.                    | Add submenu pointer and keyboard tests.                        |
| P3       | `positionerProps` spread at `context-menu.tsx:137` can overwrite local className.                                                          | Consumer className can remove local z-index/outline classes. | Destructure and merge `positionerProps.className` with `cn()`. |

## Residual Risks

No direct Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- context-menu.test.tsx`

# Dropdown Menu

- Files reviewed: `packages/ui/registry/ui/dropdown-menu.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Menu, shadcn Base Dropdown Menu.
- Primitive status: Base UI (`@base-ui/react/menu`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Strong compound surface; submenu coverage needs tests.
- Accessibility assessment: Basic menu tests pass; submenu keyboard behavior unverified.
- Token/styling assessment: Semantic tokens; repeated `z-50`.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                     | Impact                                                                                            | Suggested fix                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| P2       | Submenu API/docs exist at `dropdown-menu.tsx:328` and `dropdown-menu.mdx:118`, but tests cover only basic item/checkbox/radio behavior through `dropdown-menu.test.tsx:136`. | Roving focus, ArrowRight/Left, nested portal stacking, and submenu close behavior are unverified. | Add submenu keyboard and pointer tests.        |
| P3       | `positionerProps` is spread after local `className` at `dropdown-menu.tsx:130`.                                                                                              | Passing `positionerProps.className` can remove local `z-50 outline-none`.                         | Merge `positionerProps.className` with `cn()`. |

## Residual Risks

Base `nativeButton` props are preserved through forwarding.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- dropdown-menu.test.tsx`

# Password Input

- Files reviewed: `packages/ui/registry/ui/password-input.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: password visibility toggle and live requirement feedback patterns.
- Primitive status: Native/custom wrapper around Input/Button-like control.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered, but one docs statement is wrong.
- Public API assessment: Ergonomic.
- Accessibility assessment: Toggle keyboard behavior is good; requirement status needs live/description semantics.
- Token/styling assessment: Mostly semantic; minor spacing convention issue.
- React/Next performance assessment: Client boundary required.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                       | Impact                                                                    | Suggested fix                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| P2       | Docs say toggle is removed from tab order at `password-input.mdx:48`; source keeps it tabbable at `password-input.tsx:68`; test asserts keyboard reachability at `password-input.test.tsx:58`. | Docs could encourage an inaccessible regression.                          | Update docs to state toggle remains keyboard reachable.                                   |
| P2       | Requirement icons are `aria-hidden` and list text does not expose met/unmet state at `password-input.tsx:91`.                                                                                  | Screen reader users may not know requirements are satisfied as they type. | Add live/atomic status text and associate requirements with input via `aria-describedby`. |
| P3       | Uses `space-y-1` at `password-input.tsx:92`.                                                                                                                                                   | Diverges from local shadcn style preference for flex/grid gaps.           | Replace with `flex flex-col gap-1`.                                                       |

## Residual Risks

Functional API is useful; docs are more wrong than implementation.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- password-input.test.tsx`

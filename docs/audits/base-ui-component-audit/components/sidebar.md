# Sidebar

- Files reviewed: `packages/ui/registry/ui/sidebar.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Sidebar, Base UI useRender, React listener guidance.
- Primitive status: Custom/Base utility (`useRender`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered, but API tables are incomplete.
- Public API assessment: Intentional simplified sidebar, but shortcut and separator need cleanup.
- Accessibility assessment: Group labels are visual only.
- Token/styling assessment: Semantic tokens; hand-rolled separator.
- React/Next performance assessment: Client boundary justified by state/listener.
- View-transition relevance: Future docs navigation may keep sidebar persistent.

## Findings

| Priority | Evidence                                                                                                                        | Impact                                                      | Suggested fix                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| P2       | `SidebarSeparator` hand-rolls `<hr>` at `sidebar.tsx:378` instead of using the design-system `Separator` at `separator.tsx:34`. | Separator behavior/styling can drift.                       | Add registry dependency on `@vegastack/separator` or document exception. |
| P2       | Sidebar docs API tables cover only a subset while source exports many public prop interfaces starting at `sidebar.tsx:42`.      | API section is not complete.                                | Add tables or generated API coverage for all public parts.               |
| P3       | Global Cmd/Ctrl+B listener is always installed at `sidebar.tsx:84`.                                                             | Shortcut conflicts in embedded contexts.                    | Add `keyboardShortcut?: boolean                                          | string` and tests. |
| P3       | Group label is visual `div` at `sidebar.tsx:232`.                                                                               | Screen-reader users may not get grouped navigation context. | Consider heading semantics or `aria-labelledby`.                         |

## Residual Risks

The component intentionally does not mirror full upstream shadcn Sidebar; document that scope.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- sidebar.test.tsx`

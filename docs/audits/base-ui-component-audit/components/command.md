# Command

- Files reviewed: `packages/ui/registry/ui/command.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Command, cmdk docs, shadcn Base docs.
- Primitive status: `cmdk` custom; transitive Radix exception through cmdk.
- Registry status: Generated copy and integrity present; declares `cmdk`.
- Docs/showcase status: Covered, but API tables are incomplete.
- Public API assessment: Wrapper hides important `Command` root props in dialog mode.
- Accessibility assessment: Separator workaround is documented/tested; dialog semantics covered.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                        | Impact                                                                       | Suggested fix                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| P2       | `CommandDialog` wraps an internal `Command` at `command.tsx:115` but exposes only dialog props and `className`; cmdk root props like `loop`, `filter`, `shouldFilter`, `value` are unavailable. | Consumers must fork for common cmdk behavior.                                | Add `commandProps` or let consumers compose `Command` inside dialog content. |
| P2       | API docs only document `CommandDialogProps` at `command.mdx:112` while source exports many part prop types starting at `command.tsx:28`.                                                        | API section is incomplete.                                                   | Add prop tables for public compound parts.                                   |
| P2       | `cmdk` brings transitive Radix (`@radix-ui/react-dialog`).                                                                                                                                      | "Base UI only" is false at dependency graph level unless this is documented. | Document `cmdk` as an approved exception or replace.                         |

## Residual Risks

No direct first-party Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- command.test.tsx`
- `pnpm --filter @vegastack/ui why @radix-ui/react-dialog`

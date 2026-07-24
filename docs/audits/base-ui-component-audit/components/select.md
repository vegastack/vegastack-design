# Select

- Files reviewed: `packages/ui/registry/ui/select.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Select, shadcn Base Select.
- Primitive status: Base UI (`@base-ui/react/select`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered; API tables incomplete.
- Public API assessment: Good root/items usage, but content API lacks some Base UI knobs.
- Accessibility assessment: Open-popup axe coverage exists.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                                       | Impact                                                   | Suggested fix                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| P2       | `SelectContentProps` exposes side/align/offset props at `select.tsx:133`; Positioner does not pass `alignItemWithTrigger` explicitly at `select.tsx:162`; Popup renders children directly at `select.tsx:176`. | Consumers miss useful Base UI positioning/list controls. | Add `alignItemWithTrigger`, `positionerProps`, and decide whether to add `Select.List`. |
| P3       | API docs only render `SelectContentProps` around `select.mdx:117`.                                                                                                                                             | Compound API docs are incomplete.                        | Add tables for root, trigger, value, item, group, label, separator as public parts.     |

## Residual Risks

Base UI `items` usage is aligned; no Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- select.test.tsx`
- `pnpm dlx shadcn@latest docs select --base base --json -c apps/docs`

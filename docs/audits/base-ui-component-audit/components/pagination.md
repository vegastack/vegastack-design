# Pagination

- Files reviewed: `packages/ui/registry/ui/pagination.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Pagination and link disabled semantics.
- Primitive status: Base utility/native (`useRender` for links).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Good compound anatomy, but disabled anchors are unsafe.
- Accessibility assessment: Semantic nav/list/current page are good; ellipsis docs and disabled links need work.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Mostly static but marked client.
- View-transition relevance: Route-level only.

## Findings

| Priority | Evidence                                                                                                                                                            | Impact                                                         | Suggested fix                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| P2       | `'use client'` at `pagination.tsx:3` while comments describe pure/server-safe at `pagination.tsx:13`.                                                               | Static pagination hydrates unnecessarily.                      | Remove client boundary if compatible or split composition helpers.                    |
| P2       | Disabled preview uses `href="#" aria-disabled="true"` at `apps/docs/components/preview/pagination.tsx:76`; component styles `aria-disabled` at `pagination.tsx:84`. | Keyboard activation can still navigate/focus disabled anchors. | Remove `href`, set `tabIndex={-1}`, prevent default, or avoid disabled links in docs. |
| P3       | Ellipsis has `aria-hidden` at `pagination.tsx:200` but contains sr-only text at `pagination.tsx:205`.                                                               | Hidden label is not exposed to assistive tech.                 | Remove hidden-label claim or expose a real accessible control.                        |

## Residual Risks

No Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- pagination.test.tsx`

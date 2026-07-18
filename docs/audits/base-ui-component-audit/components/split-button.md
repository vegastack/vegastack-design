# Split Button

- Files reviewed: `packages/ui/registry/ui/split-button.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Button and Base UI Menu composition.
- Primitive status: Custom composition of Button and DropdownMenu.
- Registry status: Declares Button and DropdownMenu dependencies; generated integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Good no-root composite; empty menu API gap.
- Accessibility assessment: Inherits Button loading/focus risks; menu trigger composition is good.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary required.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P1 | Primary and trigger use Button at `split-button.tsx:133` and `split-button.tsx:150`. | Inherits Button Base UI/render/loading focus issues. | Fix Button first; revalidate split-button loading semantics. |
| P2 | `actions` and `menu` are optional at `split-button.tsx:51` and `split-button.tsx:56`, but trigger/content always render at `split-button.tsx:147`. | Consumer can ship a chevron opening an empty menu. | Require `actions` or `menu` via discriminated union, or disable/hide trigger when no items exist. |

## Residual Risks

The no-root render/asChild exemption is justified for this multi-root composite.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- split-button.test.tsx`


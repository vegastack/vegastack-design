# Switch

- Files reviewed: `packages/ui/registry/ui/switch.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Switch, shadcn Base Switch.
- Primitive status: Base UI (`@base-ui/react/switch`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered with tag mismatch.
- Public API assessment: Good Base UI wrapper.
- Accessibility assessment: Core switch semantics good; docs describe wrong element.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | Source/docs claim `<button role="switch">` at `switch.tsx:77` and `switch.mdx:54`, but test confirms Base UI renders `<span role="switch">` plus hidden input at `switch.test.tsx:92`. | Docs/comments are inaccurate and can mislead a11y expectations. | Correct docs/comments and add nativeButton guidance where sibling labels are used. |

## Residual Risks

Implementation itself is Base UI-aligned.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- switch.test.tsx`


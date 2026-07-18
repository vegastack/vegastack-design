# OTP Input

- Files reviewed: `packages/ui/registry/ui/otp-input.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI OTP Field, shadcn Input OTP divergence.
- Primitive status: Base UI (`@base-ui/react/otp-field`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Good wrapper, but grouped layouts are not supported.
- Accessibility assessment: Focus indicator is too subtle and lint fails.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | Slots suppress outline and only tint border at `otp-input.tsx:74`; docs promise a 2px focus-visible ring at `otp-input.mdx:78`; lint flags this file. | Keyboard focus indicator may be too subtle for WCAG expectations. | Add tokenized `focus-visible:ring-2` or equivalent Base UI `data-focused` ring. |
| P3 | Wrapper always renders a flat slot list at `otp-input.tsx:125`. | Common grouped OTP layouts like `123-456` require bypassing the component. | Export lower-level primitives or add groups/separator support. |

## Residual Risks

Intentional divergence from official shadcn Input OTP should remain explicit in docs.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- otp-input.test.tsx`
- `pnpm run lint`


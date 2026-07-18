# Auto Save Input

- Files reviewed: `packages/ui/registry/ui/auto-save-input.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: React controlled/uncontrolled input conventions.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Useful but `value` naming conflicts with React expectations.
- Accessibility assessment: Status announcements are inconsistent.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary required by debounce/save state.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | `value` is documented as initial value at `auto-save-input.tsx:24` and copied once into state at `auto-save-input.tsx:87`; docs repeat local ownership at `auto-save-input.mdx:28`. | API violates normal React `value` expectations and can show stale data after parent record changes. | Rename to `defaultValue`/`initialValue`, or support controlled `value` plus `onValueChange`. |
| P2 | Saving uses status semantics but saved/error render as icon labels at `auto-save-input.tsx:161`; docs claim announced labels at `auto-save-input.mdx:62`. | Success/error changes may not be announced reliably. | Use one `role="status" aria-live="polite" aria-atomic="true"` status slot with hidden text. |

## Residual Risks

Tests cover debounce/save/error/axe but should add prop-resync and live-announcement coverage.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- auto-save-input.test.tsx`


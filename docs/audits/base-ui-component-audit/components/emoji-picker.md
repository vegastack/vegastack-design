# Emoji Picker

- Files reviewed: `packages/ui/registry/ui/emoji-picker.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Popover/Button composition and listbox/search a11y patterns.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Lightweight, no third-party emoji dependency; trigger typing is loose.
- Accessibility assessment: Empty search update is not live-announced.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary required.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P3 | Empty search state is plain visual text at `emoji-picker.tsx:523`; test checks text only at `emoji-picker.test.tsx:56`. | Screen reader users may not hear that filtering produced no results. | Add `role="status" aria-live="polite"` for empty/result count updates. |
| P3 | `trigger` accepts any `ReactElement` at `emoji-picker.tsx:350`, but ref is typed `HTMLButtonElement` at `emoji-picker.tsx:387`. | Non-button custom triggers make ref typing unsound. | Type ref as `HTMLElement` or enforce/document button-like triggers. |

## Residual Risks

Embedded emoji set should be documented accurately if size/count changes.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- emoji-picker.test.tsx`


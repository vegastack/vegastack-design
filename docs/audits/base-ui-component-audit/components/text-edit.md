# Text Edit

- Files reviewed: `packages/ui/registry/ui/text-edit.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Tiptap React SSR guidance, React/Next performance guidance.
- Primitive status: Custom rich text editor using Tiptap.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered; preview barrel may load heavy dependency broadly.
- Public API assessment: Useful, but validation/ARIA API is incomplete.
- Accessibility assessment: Invalid/description state needs explicit props.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Heavy client dependency; `immediatelyRender: false` is good.
- View-transition relevance: None inside editor.

## Findings

| Priority | Evidence                                                                                                                                                               | Impact                                                                    | Suggested fix                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| P2       | Root has invalid styling hook at `text-edit.tsx:245`, but props do not expose `aria-invalid`/`aria-describedby`; editable/root around `text-edit.tsx:447`.             | Form integrations cannot properly mark or describe validation errors.     | Add explicit invalid/error description props and pass ARIA attributes to editable/root. |
| P2       | Preview barrel exports text-edit at `apps/docs/components/preview/index.tsx:67`; preview imports TextEdit at top level `apps/docs/components/preview/text-edit.tsx:5`. | Tiptap can leak into unrelated docs routes if barrel is imported broadly. | Dynamically import heavy previews or avoid all-preview barrels for heavy components.    |
| P3       | Source comments mention deprecated `onChange` at `text-edit.tsx:192` and `text-edit.tsx:207`.                                                                          | API comments nudge consumers away from `onValueChange`.                   | Update comments to prefer `onValueChange`; keep deprecation note.                       |

## Residual Risks

Tiptap is justified for rich text, but keep it isolated and monitor bundle size.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- text-edit.test.tsx`

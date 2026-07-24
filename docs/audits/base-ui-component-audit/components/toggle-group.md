# Toggle Group

- Files reviewed: `packages/ui/registry/ui/toggle-group.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Toggle Group, shadcn Base Toggle Group.
- Primitive status: Base UI (`@base-ui/react/toggle-group`, `@base-ui/react/toggle`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Duplicate selection-mode API and item override bug.
- Accessibility assessment: Keyboard/a11y tests are strong.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                                                           | Impact                                                                           | Suggested fix                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| P2       | Props extend Base ToggleGroup without omitting `multiple` at `toggle-group.tsx:33`, then add `toggleMultiple` at `toggle-group.tsx:51`; runtime sets `multiple={toggleMultiple}` before spreading props at `toggle-group.tsx:121`. | Duplicate/conflicting API; undocumented `multiple` can override by spread order. | Either omit Base `multiple` and own `toggleMultiple`, or drop alias and document Base `multiple`. |
| P2       | Item docs say per-item variant/size override at `toggle-group.tsx:148`, but resolution uses context first at `toggle-group.tsx:172`.                                                                                               | Item-level overrides do not win as advertised.                                   | Resolve item props before context or remove advertised override.                                  |
| P2       | Root/item `className` is treated as static at `toggle-group.tsx:124` and `toggle-group.tsx:181`; Base UI supports state-function className/render.                                                                                 | Base UI styling API is narrowed without docs.                                    | Support function className or narrow public types/docs.                                           |

## Residual Risks

Array `value`/`defaultValue` adaptation matches Base UI model.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- toggle-group.test.tsx`

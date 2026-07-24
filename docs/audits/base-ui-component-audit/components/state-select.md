# State Select

- Files reviewed: `packages/ui/registry/ui/state-select.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: combobox/select accessibility patterns.
- Primitive status: Custom searchable select/combobox.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered but dataset docs are vague.
- Public API assessment: Useful, but `className` target is misleading.
- Accessibility assessment: Combobox/fallback axe coverage exists.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client component ships a large embedded subdivision dataset.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                                                                               | Impact                                                      | Suggested fix                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| P2       | `className` docs say trigger/input at `state-select.tsx:1455`, but combobox path applies it to outer div at `state-select.tsx:1512`; Button has fixed classes at `state-select.tsx:1523`; fallback also applies to wrapper at `state-select.tsx:1497`. | Consumers cannot style the focusable control as documented. | Apply to focusable control or split `className`/`containerClassName`. |
| P3       | Docs understate dataset scope at `state-select.mdx:29`; source says 45 countries at `state-select.tsx:37`.                                                                                                                                             | Search/discovery expectations are unclear.                  | Document supported country/subdivision scope.                         |
| P3       | Embedded 45-country dataset starts at `state-select.tsx:43`.                                                                                                                                                                                           | Bundle size may grow unnoticed.                             | Track bundle size or allow data injection/lazy loading if it grows.   |

## Residual Risks

No Radix import found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- state-select.test.tsx`

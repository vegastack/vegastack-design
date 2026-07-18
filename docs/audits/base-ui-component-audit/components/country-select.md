# Country Select

- Files reviewed: `packages/ui/registry/ui/country-select.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Combobox/listbox accessibility expectations, shadcn Command/Popover patterns.
- Primitive status: Custom searchable popover, not Base UI Select.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered but combobox wording is inaccurate.
- Public API assessment: Useful country data override, but selected lookup ignores it.
- Accessibility assessment: Trigger semantics do not match docs.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary required.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | Docs call the trigger a combobox at `country-select.mdx:34`; source renders a Button at `country-select.tsx:292`; tests query button at `country-select.test.tsx:21`. | Accessibility docs overpromise combobox semantics. | Implement combobox trigger semantics or call it a button opening a searchable popover. |
| P2 | Custom `countries` prop is accepted at `country-select.tsx:256`, but selected value uses global `getCountryByCode` at `country-select.tsx:287`; list maps the supplied `countries` at `country-select.tsx:323`. | Custom data can render a list but show the wrong selected item. | Derive selected country from the effective `countries` array. |

## Residual Risks

Consider whether this should be built from a shared ComboBox/Command primitive to reduce bespoke behavior.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- country-select.test.tsx`


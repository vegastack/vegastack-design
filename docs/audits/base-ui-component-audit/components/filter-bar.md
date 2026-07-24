# Filter Bar

- Files reviewed: `packages/ui/registry/ui/filter-bar.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: group/search/filter accessibility conventions.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Flexible and useful; docs/JSDoc mismatch exists.
- Accessibility assessment: Group is unnamed.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary required.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                    | Impact                                     | Suggested fix                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| P2       | Root has `role="group"` at `filter-bar.tsx:267`; props expose no group label path at `filter-bar.tsx:89`; docs claim AT announces grouped controls at `filter-bar.mdx:110`. | Screen readers may get an unnamed group.   | Add default `aria-label="Filters"` or explicit `label`/`aria-labelledby` API. |
| P3       | Source example uses `search={{ value: query, onChange: setQuery }}` at `filter-bar.tsx:245`, but real prop is `onValueChange` at `filter-bar.tsx:75`.                       | Copy-pasted source docs mislead consumers. | Update JSDoc example.                                                         |

## Residual Risks

No registry dependency or Radix issue found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- filter-bar.test.tsx`

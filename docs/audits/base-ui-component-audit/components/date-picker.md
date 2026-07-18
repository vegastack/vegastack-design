# Date Picker

- Files reviewed: `packages/ui/registry/ui/date-picker.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Calendar/Date Picker, React DayPicker.
- Primitive status: Custom wrapper around `react-day-picker` plus Popover/Button composition.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Good `Calendar` escape hatch; wrapper props are narrow.
- Accessibility assessment: DayPicker handles core calendar semantics; wrapper tests cover basics.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary required.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | `Calendar` forwards DayPicker props at `date-picker.tsx:65`, but `DatePicker` and `DateRangePicker` expose narrowed props at `date-picker.tsx:350` and `date-picker.tsx:489`. | Consumers needing timezone, localization, footer, caption/year controls must drop down to `Calendar` or fork. | Add guarded `calendarProps` passthrough or promote high-value DayPicker props. |

## Residual Risks

`react-day-picker` is a meaningful, justified dependency; keep wrappers from forcing forks.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- date-picker.test.tsx`


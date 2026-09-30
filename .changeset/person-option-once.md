---
"@vegastack/ui": patch
---

🐛 **SearchableSelect** — a person option can no longer render two avatars and two emails. With the person contract (`itemToStringLabel` for the name, `itemToSecondaryLabel` for the email, `itemToAvatar` for the `Person`), the component draws each option as one `PersonOption` and the trigger as one avatar plus the name; `renderItem` and `renderValue` are ignored there, with a one-time development `console.warn` when they are passed. `renderItem` is now optional and defaults to `itemToStringLabel`. `FilterBarFacet` follows the same rule, and `RecordChip` warns in development when `value` is passed with `person` (the person already wins). [docs](https://design.vegastack.com/docs/components/searchable-select)

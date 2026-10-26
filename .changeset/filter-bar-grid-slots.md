---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **FilterBar**: grid slots for a spreadsheet-like list with saved views. `filterBuilder` makes the Filters toggle open a `FilterBuilder` in a popover (the applied `filters` chips stay in the chip row whenever there are any); `sort` (with `sortLabel`, default "Sort", and `sortCount`) adds a Sort button that opens a `SortBuilder`; `group`, `fields`, `density` and `viewActions` share one View menu (`viewMenuLabel`, default "View") with labelled sections in the order Group, Fields, Row height, then the view's own actions (`groupLabel`, `fieldsLabel`, `densityLabel`). The three controls sit after the Filters toggle and go icon-only below `@3xl`, keeping their words as accessible names. A saved view's "View changed · Save · Reset" goes in `trailing`, in the chip row. [docs](https://design.vegastack.com/docs/components/filter-bar)

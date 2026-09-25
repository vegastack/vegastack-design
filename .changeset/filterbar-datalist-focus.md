---
"@vegastack/ui": patch
"@vegastack/design": patch
"@vegastack/design-tokens": patch
---

🔧 List toolbars, tables and focus: FilterBar puts search (~320px) left and a Filters (n) toggle, scope Tabs and the view switch right, with compact rounded-md filter chips (tinted when set, a fixed 24px ×, "Status: 2") on a toggled row 12px below that scrolls sideways on a phone (the bottom sheet is gone); new DateRangeFilter with presets; SearchableSelect ticks async options and gains a person option (name plus muted email, both searched); DataList adds sortable columns with an indicator, `compare`/`sortFirst`/`sortMode`, a standard `rowActions` ⋯ column (32px, always last), un-underlined row links, and `noResults`; Empty always renders an icon; TabsList gains `size="sm"`; buttons inside a status Alert hover in the family's own tint; Dialog and Sheet open onto the first field, never the ×; and no focus rings anywhere except Tabs — keyboard focus is a subtle background tint (a border tint on text entry).

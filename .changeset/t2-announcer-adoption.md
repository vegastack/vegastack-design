---
"@vegastack/ui": minor
---

🔧 **EditableCell**, **ChipInput**, **DataGrid**, **CopyButton**, **SortableList**,
**Board**, **Dropzone** — all announce through `use-announcer`, one live region each, replacing five
identical hand-rolled `{ text, seq }` regions plus CopyButton's. EditableCell's visible status slot is
no longer itself a live region, so it stops announcing its own icon swaps. `Pagination`'s
`PaginationLink` takes its hover and pressed steps from `surfaceInteractive` instead of restated
`hover:bg-surface-2` / `active:bg-surface-3` literals.
[docs](https://design.vegastack.com/docs/components/editable-cell)

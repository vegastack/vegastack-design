---
"@vegastack/ui": minor
---

🐛 **A table's selection checkbox did not own its own 24px hit area.** `TableHead` and `TableCell`
collapsed the trailing padding of a checkbox column to `pe-0`, so the checkbox's 6px `::before`
overhang fell outside its own cell — the neighbouring header's sort control owned part of the
centred 24×24 square. Both cells now use `pe-2`, the least that contains the target, and the sort
control no longer carries a negative inline margin (`SortableHead` narrows its own cell padding
instead, so the label alignment is unchanged).
[docs](https://design.vegastack.com/docs/components/table)

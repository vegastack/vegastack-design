---
"@vegastack/ui": minor
---

🧩 **`data-table-parts`** — the chrome `DataList` and `DataGrid` had each grown separately: the sort
header, the select-all / per-row selection arithmetic, the skeleton rows, the empty row and the
column class rules, twice each. They now come from one registry item, installed automatically with
either renderer through `registryDependencies`. `SortableHead` and `SortHeaderButton` compose the
system `Button` instead of a hand-rolled `<button>`, and emit `aria-sort` on every sortable column
(`"none"` included). The doctrinal split is unchanged — `DataList` stays presentational, `DataGrid`
keeps its engines.
[docs](https://design.vegastack.com/docs/components/data-table-parts)

---
"@vegastack/ui": minor
---

📦 **`@tanstack/react-table` 8.21.3 → 9.2.4, in `data-grid` alone.** v9 replaces `useReactTable`
with `useTable` and stops bundling every feature into every table: a table now declares the features
it uses, and row models are feature slots rather than table options. `data-grid` declares exactly
one — `rowSortingFeature` with `createSortedRowModel()` — which turns the sanctioned-exception
boundary from a claim into something the module reads back: `columnVisibilityFeature`,
`columnOrderingFeature` and `rowSelectionFeature` all exist in v9 and none is adopted, because
column visibility, column order and row selection are `data-grid`'s own state, and the APG grid
keyboard layer (roving gridcell tabindex, Enter/F2 edit mode, Escape restore) is unchanged
this-file-only code. `getCoreRowModel()` is gone (the core model is automatic) and `manualPagination`
went with `rowPaginationFeature`, where it was already inert. The four built-in comparators v8 kept
permanently in its registry — `alphanumeric`, `basic`, `datetime`, `text` — are registered
explicitly in the `sortFns` slot so `getAutoSortFn` resolves the same comparator per column as it
did under v8. No public prop, type or behaviour of `DataGrid` changes; `@tanstack/react-virtual` is
untouched.
[docs](https://design.vegastack.com/docs/components/data-grid)

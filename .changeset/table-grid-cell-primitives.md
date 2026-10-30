---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **Grid cells without app-side hacks** (`field-cell`, `data-grid`, `app-shell`; additive — nothing changes until a consumer opts in): `FieldCellDisplay` and `FieldCellEditor` take `variant="cell"` — the display is plain (no digit grouping except currency, links without scheme, dates clipped on one line, every person named) and the editor is borderless, with a growing one-paragraph text box and a number typed as written (decimal mark of the reader, no steppers, arrows step by 1). `DataGrid` takes `fill` (viewport height to the bottom of its scroller, ≥240px), `endSpacer`, `columnDividers` (frozen columns too), `editingTint`, and `headerAlign` (grid-wide or per column) so a numeric column's header can lead while its values stay end-aligned. New `AppShellBleed` lets a grid reach the page's edges without a gutter wrapper.

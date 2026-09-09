---
"@vegastack/ui": minor
---

🔧 **`DataGrid`, `DataList`, `Table`, `PropertyList`, `Chart`** — the rest of the table-family pass.
`DataGrid` gains `columnPicker` (default `true`): the "Columns" picker used to render whenever the
grid had any columns — i.e. always, even for a three-column read-only grid — and it now sits in the
toolbar's trailing slot beside the hidden-columns hint. `DataList` and `DataGrid` gain a `mono`
column flag (mono numeral face plus `tabular-nums`, `nowrap` by default) and a `nowrap` flag;
together with the shared chrome that is 249 fewer lines across the two files. `TableRow` no longer
tints the header row on hover — it styles every row it renders, including the header row the two
renderers build with it, so hovering a header washed it as if it were actionable. `PropertyList`
becomes a container query: the label track was a fixed 112px regardless of the pane, and is now
content-sized above an 80px floor at `@xs` and stacked below it, with values wrapping instead of
truncating. `Chart` moves axis labels from 11px to 12px (11px is reserved for mono) with the
numerals on the mono `text-code-sm` tier, and the tooltip follows.
[docs](https://design.vegastack.com/docs/components/data-grid)

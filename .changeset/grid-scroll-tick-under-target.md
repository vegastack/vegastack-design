---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **DataGrid**: a scroll tick at 150 columns costs about a quarter to a third less main-thread time. A body cell is no longer `position: relative` unless it holds the remote-change cue or the fill handle (each positioned cell was a paint layer of its own, so paint and layerize were most of a tick), and `EditableCell`'s display is positioned only while it edits. The row window overscans three rows and the column window one column. The frozen edge's `data-scrolled-x` is set once a frame from the offset the column virtualiser already read, so no grid scroll handler forces a layout. Header and summary cells are memoised behind stable actions, so a column-window move renders the entering column alone, and a remote change's cue (and its timer) mounts only on the cell it marks. A managed `EditableCell`'s text leaf that measures on contact keeps its element in a ref, so a newly mounted cell renders once instead of twice. [docs](https://design.vegastack.com/docs/components/data-grid)

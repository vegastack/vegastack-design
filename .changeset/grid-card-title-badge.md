---
"@vegastack/ui": patch
---

🐛 `MediaCard`'s `badge` now sits beside the title, where `DataList`'s list view puts a pill, instead of in the meta line — a long title truncates before it and the badge never shrinks; the meta line is just `meta` and `timestamp`. The record title has one weight in the grid and the list: `DataList`'s first column is now `font-medium`, the grid card's title weight, through a shared `RECORD_TITLE_CLASS` exported from `media-card`; merged values under it stay regular. Docs show the badge variants (with, without, long title) and the grid and list side by side.

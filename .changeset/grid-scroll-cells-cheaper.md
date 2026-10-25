---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **DataGrid**: scrolling a wide grid costs much less per frame, and a fast fling through clipped values no longer stops the grid with "Maximum update depth exceeded". A cell the grid mounts no longer measures its own overflow: `TruncatedText`, `IconText` and a managed `EditableCell` under a grid or list host measure when the pointer reaches them (the full text still opens on hover), and every other `useOverflow` shares one `ResizeObserver` that reads sizes after layout instead of forcing a layout on mount (`measureOverflow` is the one-shot read). `useMediaQuery` keeps one `matchMedia` list and listener per query, which `TruncatedText` now uses for `(hover: none)`. Inside `DataGrid`, an `EditableCell` speaks through the grid's one live region (`AnnouncerScope`, joined with `useAnnouncer({ scoped: true })`) instead of a `role="status"` region per cell, a row's selection checkbox no longer re-renders when the column window moves, and `EditableCell` runs only the mode half of the edit machine (`useInlineEditMode`). [docs](https://design.vegastack.com/docs/components/data-grid)

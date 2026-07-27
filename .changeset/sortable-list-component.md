---
"@vegastack/ui": minor
---

New `sortable-list` component — reorderable rows on `ItemGroup`/`Item`, driven by
`use-drag-reorder`: pointer drag with 2px closest-edge drop indicators, the keyboard move mode,
per-step polite announcements, and the required lossless Move menu (up / down / to top / to
bottom). Controlled — the host owns the order and can refuse a move by rejecting the `onReorder`
promise (pending shimmer, announced snap-back). Deliberately owns no selection: reordering and
multi-select on one surface make drag intent ambiguous. The `data-list` scope table's
"drag-and-drop reordering" row is reconciled: the persisted order stays app-coupled, the mechanism
now lives in the system. Selected for cross-engine smoke.

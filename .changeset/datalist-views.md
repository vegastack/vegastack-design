---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 DataList views: `view` is `"list"`, `"grid"` or `"board"` over the same items, sections, sort, filters, paging, loading, empty and no-results states. The grid renders a MediaCard per row (sections as "Label · n" headings over a 1/2/3-column container grid, `gridSize="lg"` for a 16:9 image, `renderCard` to override); the board renders sections as Board lanes with `onMove(row, from, to)` and a per-section `loading`/`loadMore`/`emptyState`. `onViewChange` mounts the new ViewToggle (Grid | List | Board, labels hidden on a phone) in the FilterBar `view` slot and remembers the view for the session; `views` picks the offered views. Columns take a `thumbnail` (32px Thumbnail with `thumbnailFallback`). New MediaCard (whole-card link, 48px thumbnail, meta, badge, timestamp, ⋯ on hover/focus/touch, `lg` size), Thumbnail (32/48px, cover-fit, fallback) and ViewToggle; RowAction entries can be `{ type: "separator" }` between groups (and an item can take `separatorBefore`), in row, grid-card and board-card menus; the Badge page documents the warning pill.

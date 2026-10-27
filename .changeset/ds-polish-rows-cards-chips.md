---
"@vegastack/ui": patch
---

🐛 Row states, empty values, phone board lanes and inline chips (Regent polish audit).

- **DataList** and **DataGrid** use one set of row states. Hover is a faint `muted`/30 wash with no start edge. A ticked row keeps the stronger `muted`/50 wash. The open row (`activeRowId`) gets the `accent` wash and the 2px start edge. The edge used to follow the mouse, because DataList's pointer-driven cursor drew it; now only the keyboard cursor and keyboard focus draw it.
- **DataGrid** pinned (frozen) cells now take a ticked row's wash. They checked `data-selected="true"`, but rows set `data-selected=""`. The phone card view has the same fix.
- **DataGrid** shows an empty primary value as a muted "Untitled" in the primary cell and in a card's title. The new `untitledLabel` prop overrides the word. Cards leave out fields that have no value, label included.
- **Board** on a phone with lane tabs: each lane header drops the title and count that its tab already shows, and keeps only its actions.
- **InlineChip** (mentions, file and record chips) never wraps. Its icon and label stay on one line, and a chip wider than its line ends in an ellipsis.
- **DataList** and **DataGrid** can show a sort set somewhere else, such as a toolbar. Pass `sort` without `onSortChange` and the headers are no longer sort buttons. The sorted column still shows a read-only ↑/↓ (with its position number in a multi-sort) and keeps `aria-sort`. `SortableHead` also draws the read-only glyph when it gets a `direction` and no `onSort`.
- **Board** card and lane menus and **SortableList** item menus use ⋯, the same as table rows. The app-shell header's actions menu keeps ⋮.

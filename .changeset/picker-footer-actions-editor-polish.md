---
"@vegastack/ui": patch
---

🛠 Searchable pickers get a footer for their static actions, and the editor, space picker and pill calendar get review fixes (Regent new-task review, OVL-20).

- `CommandActions` (new): the last child of `CommandList`, a sticky footer behind a hairline for a picker's static actions ("Assign to me", "Unassign", "Clear"). Its `CommandItem`s are never filtered and never counted as results, so "No results" still shows with the actions under it; the arrow keys reach them after the last result; the list's scroll padding keeps the active row clear of the footer.
- `PanelList` and `PanelActions` (new, in `panel-search`): the scrolling list under a `PanelSearch` row and the matching sticky footer for menus. A row action with both `submenu` and `items` now renders `items` as that footer below the submenu content (they used to sit above the search).
- `SpacePicker` rows are one line (tile and name; a disabled reason muted at the end); `SpacePickerItem.secondary` is deprecated and no longer shown. `placement="title"` is an outlined, rounded chip, with no "› New task" after it.
- `TextEdit`: the bubble menu no longer opens over a selection with no text (select all in an empty editor), and it follows its selection when a dialog or panel around the editor scrolls, hiding while the selection is out of view. In a narrow frame (a Dialog's 16px padding) the content takes just enough start padding that the block grip sits clear of the text and the caret.
- `RecordChipMenu`: a `Calendar` inside it is transparent, so its square box no longer paints over the popup's rounded border.

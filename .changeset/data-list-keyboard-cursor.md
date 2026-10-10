---
"@vegastack/ui": patch
---

🧩 **DataList**: `keyboardNavigation` gives a page's main list a row cursor. J or ↓ and K or ↑ move it, Enter opens the cursor row, and Escape clears it. The cursor wears the keyboard-focus cue (the hover wash and the 2px start edge) and follows the mouse. `cursorId` and `onCursorChange` give a host with its own keys the same cue. A row link that gets focus back, for example when a drawer opened from it closes, no longer paints a rounded grey box behind the first cell. **SortableList**: a `header` row above the list, full width, for an add field whose new value goes first, and `flush` rows with no hover wash or side padding, for rows that hold their own bordered input.
[docs](https://design.vegastack.com/docs/components/data-list)

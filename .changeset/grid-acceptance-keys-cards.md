---
"@vegastack/ui": patch
---

🐛 **DataGrid**: Tab back into the grid returns to the cell that was active, even after its row or column was windowed out by scrolling (it scrolls back in), instead of landing on whichever cell stood in as the tab stop. The grid is its own stacking context, so its sticky summary row no longer covers an `ActionBar` and its buttons can be pressed. **FieldCellEditor**: opened from the keyboard, a choice or link picker focuses a usable control (never the picker's hidden form input, where keys went nowhere), a choice, person, link or date picker opens its list or calendar with the editor, and long text's editor takes the caret when opened with Enter too. **DataList**: a press on a clickable grid card's text opens its row; only the card's own controls (its checkbox, a menu, an `interactive` column) keep a press to themselves.

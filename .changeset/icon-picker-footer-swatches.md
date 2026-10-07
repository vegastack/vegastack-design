---
"@vegastack/ui": patch
---

🛠 `IconPicker` picks colour from inline swatches in a sticky footer instead of a popover beside search.

- In icon mode the footer row starts with a "No colour" swatch (clears the hue), then the hues, as one "Icon colour" radiogroup; Remove sits on the right when `onRemove` is passed. The emoji tab shows only Remove, and the footer is omitted when empty.
- Line tabs sit over a full-width hairline, search runs full width, and section headers stay pinned while the grid scrolls.
- `PickerPanel`'s `searchAction` prop is deprecated.

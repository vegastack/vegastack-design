---
"@vegastack/ui": patch
---

🐛 `IconPicker` keeps focus in its own search when its trigger sits in an `InputGroupAddon`, and its footer and tabs line up.

- Clicks inside the popup no longer bubble (through the portal) to an `InputGroupAddon` around the trigger, which used to move focus to the field's input while you typed a search. Opening by pointer or keyboard now focuses the search field; touch keeps the default.
- The footer is one row that never wraps: "No colour" and the ten hues on the left, Remove as a compact trash icon button (`aria-label` "Remove icon", tooltip "Remove") on the right.
- The checked swatch shows the selected cell's 1px `primary` border, rounded, instead of a ring.
- Both tabs share one width sized to the grid (`w-79`, compact `w-62.5`, with 6px cell gaps), and both browse eight categories: emoji flags leave the category bar and sections but stay searchable (new `PickerPanel` `searchOnly` prop). `EmojiPicker` uses the same grid width.

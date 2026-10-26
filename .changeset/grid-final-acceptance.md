---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **data-grid**, **field-cell**, **filter-bar-managed**, **text-edit**: the grid's final acceptance fixes. `GroupByPicker` and `SortBuilder` no longer crash when every field is already used (a compiled memo read `free[0].key` while rendering); Add stays disabled. Typing on a long-text cell opens its editor holding every typed key in place of the value (a `#` or `-` is the character, not Markdown), and typing on a date cell opens a field that takes a typed date ("12/3", "Mar 12", "today") seeded with the key. Links and chips inside grid cells leave the tab order, so <kbd>Tab</kbd> leaves the grid from any cell: <kbd>Alt</kbd>+<kbd>Enter</kbd> (or <kbd>Enter</kbd> on a read-only cell) moves into its first chip, arrows step, <kbd>Escape</kbd> returns. `TextEditHandle.focus` takes an optional `"start"` or `"end"`, and focuses the read view while the editor loads so early keys are kept. [docs](https://design.vegastack.com/docs/components/data-grid)

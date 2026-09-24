---
"@vegastack/ui": minor
---

🔧 `Combobox` exports `ComboboxStatus`, Base UI's own polite status region for a list that loads asynchronously. Render it as a sibling of `ComboboxList` and change its children ("Searching…", then the result count) rather than mounting it conditionally. It is screen-reader-only by default; `visible` shows the message as a muted row above the list. It carries `data-slot="combobox-status"` (decision API-27).

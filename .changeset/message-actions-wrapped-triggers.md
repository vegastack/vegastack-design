---
"@vegastack/ui": patch
---

🐛 `MessageActions` sizes every button in the row, so a 👍 or 👎 `Toggle` inside a `TooltipTrigger` or `PopoverTrigger` (which rename its `data-slot`) is the same 28px square as Copy and Retry ([Message parts](/docs/components/message-parts)).

---
"@vegastack/ui": patch
---

🐛 `parseTimeOfDay` (`date-time`) reads back what `formatTimeValue` writes in every locale: the locale's own digits ("٩:٣٠ ص") and a day word before the time ("오전 9:30"). A `DateTimePicker` or `TimeField` in those locales marked its own display invalid when one digit was edited.

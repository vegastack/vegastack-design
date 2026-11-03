---
"@vegastack/ui": minor
"@vegastack/design": minor
---

🧩 **New: `TimePicker` and `DateTimePicker`.** `TimePicker` is a time of day you type ("930", "9:30 pm", "21:30") or pick from the day's times every `step` minutes, in the locale's 12- or 24-hour clock (`hourCycle` to fix one); its value is `HH:MM`. It is our `Combobox` field with a clock, so it has the same `sm`/`default` sizes, `outline`/`ghost` variants, focus, invalid and `Field` wiring as every input. `DateTimePicker` puts `DatePicker` and `TimePicker` in one named group and edits an instant on the reader's clock (`timeZone`, else `TimeZoneProvider`): a day picked alone takes `defaultTime` (09:00), a skipped wall time moves past the DST gap, and a repeated one keeps its offset. `FieldInput type="datetime"` and the date-time cell editor now use it in place of the browser's native time input; their props and `data-slot` are unchanged. The `date-time` lib exports `zonedParts` and `fromZoned`.

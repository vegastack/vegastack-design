---
"@vegastack/ui": minor
"@vegastack/design": minor
---

🧩 **New: `DateTimePicker`, a date and a time in one picker.** One trigger ("Nov 3, 2026, 9:00 AM") opens one popup with the calendar and, beside it, the time: a field to type one ("930", "9:30 pm", "21:30") over the day's times every `step` minutes. Picking a day keeps the popup open for the time (a day alone takes `defaultTime`, 09:00); picking or entering a time closes it. The value is an instant, shown and edited on the reader's clock (`timeZone`, else `TimeZoneProvider`); a skipped wall time moves past the DST gap and a repeated one keeps its offset. It ships in the `date-picker` item beside `DatePicker` and `DateRangePicker`, with their sizes, `ghost` tier, clear control and `Field` wiring. `FieldInput type="datetime"` and the grid's date-time cell editor use it in place of the browser's native time input: the cell's popup opens with the editor, <kbd>Tab</kbd> steps inside it, a time commits (Enter moves down) and closing it with nothing changed cancels. The `date-time` lib exports `zonedParts`, `fromZoned`, `parseTimeOfDay`, `formatTimeValue` and `localeHourCycle`.

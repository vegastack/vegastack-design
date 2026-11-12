---
"@vegastack/ui": minor
---

🧩 A workspace date and time format. `DateFormat` (`dateStyle` `dmy` "12 Nov 2026" · `mdy` "Nov 12, 2026" · `ymd` "2026-11-12", `hourCycle` `h12` "3:40 PM" · `h23` "15:40"), `DEFAULT_DATE_FORMAT` (today's output, byte for byte) and `dateFormatDefaults(timeZone)` (the zone's regional convention, from a fixed table). Every `@/lib/date-time` formatter takes `dateFormat`; `formatDate` takes `month: "long"`. `TimeZoneProvider` takes `dateFormat` and `useDateFormat()` reads it, so `RelativeTime`, `DateTime`, `DueLabel`, `DatePicker`, `DateRangePicker`, `DateTimePicker`, `TimeField`, `FieldCell`, `EditableCell`, `VersionList`, `Comments`, `BoardCard` and `DateRangeFilter` follow it. A comment's "Edited" tooltip now reads in the viewer's zone, like every other tooltip.

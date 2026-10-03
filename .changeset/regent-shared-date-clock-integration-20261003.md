---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 Keep date-picker Today highlighting and application date groups on the shared viewer clock.

- DateRangeFilter forwards its explicit calendar-day reference to the custom Calendar.
- Export useDateTimeNow from the relative-time registry item for groups, badges and picker presets, preserving serialized SSR references and one shared live timer.

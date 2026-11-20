---
"@vegastack/ui": minor
---

⚠️ `DateRangePicker`, `DateRangePickerProps`, `DateRangePreset` and `defaultRangePresets` move to their own file, `@/components/ui/date-range-picker`, installed by the same `date-picker` item. A bundler keeps or drops a module's exports for the whole app, so one range picker anywhere used to ship its code to every page with a `DatePicker` (about 1 KB gzip on every table and list page). Import them from the new path; `DatePicker`, `DateTimePicker` and their presets are unchanged. `date-picker.tsx` now also exports the plumbing the two files share (the lazy calendar engine, popup classes, preset rail, trigger format); it is not part of either picker's API.

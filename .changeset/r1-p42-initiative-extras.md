---
"@vegastack/ui": minor
---

🧩 **Timeline**, **HealthIndicator**, **MilestoneList**. `Timeline` lays dated work against the calendar: a sticky label column with a leading glyph slot, bars from `start` to `end` coloured by a closed `status` set (planned, active, paused, completed, canceled; never by health), milestone diamonds, a today line, Month and Quarter zoom (controlled or not), rows without dates under "No dates", a vertical list grouped by month under 40rem, one Tab stop with Enter → `onOpen`, `content-visibility: auto` rows and the shared `loadMore` tail. `HealthIndicator` is a glyph and its words for On track, At risk, Off track and grey No update, with `labelHidden` for a leading slot. `MilestoneList` is ordered milestones (diamond state, truncated name, weight chip when not 1, "3 of 5" tasks, a warning, the date) on `SortableList`: `onMove` gets the new neighbours, plus `onDoneChange`, a ⋯ menu from `getActions` and an "Add milestone" row.

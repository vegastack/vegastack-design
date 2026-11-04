---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **Grid cells: files show as chips, and the date, date-time and link triggers sit flat.** `FieldCellDisplay variant="cell"` shows every file as its `InlineChip` (type icon and name, as a page shows it), or a small `Thumbnail` when the file carries the new optional `FieldFile.thumbnailUrl`, on one line that clips like the person cell — no "+N", no scroll bar. `DatePicker`, `DateTimePicker` and `SearchableSelect` gain `flat` (off by default): no border, fill or shadow, and no open tint while the popup is open. `FieldCellEditor variant="cell"` turns it on for its date, date-time and link editors, so only grid cells change.

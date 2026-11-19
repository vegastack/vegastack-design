---
"@vegastack/ui": patch
---

🐛 Side panel and top bar tidy. The top bar's and the peek header's controls read one size — 14px labels and 16px icons — so Share, Watch and ☆ match ⋯, ▥ and the breadcrumb. `SpaceChip variant="ghost"` is a space as a property value: the value's ink and size, the ghost Record Chip's capsule and hang, its ▾ only on hover, and `href` for a read-only link; `SpacePicker placement="property"` uses it (dashed while empty) and `onClear` offers "No space". In a panel `PropertyList`, an editable value with nothing in it is the dashed empty capsule (`EditableCell` marks it `data-empty`), and so is an empty `AgentSlot`, whose hover is a capsule too. `RecordPanelItem` takes an `action` that replaces its detail on hover or focus instead of reserving a column. A `FileCard` row shows its source beside the name and its actions take no room until hover where the row has a tab stop before them. A toast's content pads 12px again (staging's height).

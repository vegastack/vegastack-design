---
"@vegastack/ui": patch
"@vegastack/design": patch
"@vegastack/design-tokens": patch
---

🔧 No focus rings anywhere, Tabs included (FOC-13): tab triggers and panels take the same background tint as everything else, and clicking a tab shows nothing. Every clear and dismiss × (FilterBar facet and date clear, Chip remove, SearchableSelect, Combobox and DatePicker clear, Dialog and Sheet close) opts out of Button's press nudge and centres with inset and auto margins, so it never jumps when pressed. Transcript: the search field is capped at `max-w-sm`, the speaker name in each turn is an inline `EditableCell` when `onSpeakerRename` is set (a rename applies to every turn with that speaker), and `TranscriptSpeakers` is deprecated. Empty's icon tile is 40px with a 20px icon (32px / 16px at `size="sm"`), and the tile sizes any icon passed in.

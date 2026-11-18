---
"@vegastack/ui": minor
"@vegastack/design-tokens": minor
---

⚠️ Shell, Peek and Record Layout: the top bar ends in a hairline (`border-b`), so the record side panel's divider meets it instead of being cut across, and its controls sit 4px apart (an empty slot, or one holding only an empty portal target, now takes no room or gap) (8px either side of the ▥ divider; the phone's Help and avatar keep 8px), the same rhythm as `PeekActions` and the assistant's header. `RecordPanel` now paints the page's own ground (`bg-background`) behind its start-edge hairline, and its phone sheet the same ground (COL-26, revised). **Breaking:** the `--panel` token (`bg-panel`) is removed, with no alias: use `bg-background`.

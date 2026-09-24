---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🧩 Transcript is a new component for the text of a recording: timestamped, speaker-labelled lines on MessageScroller's engine.

- The line playing at `currentTime` gets `aria-current="true"` and stays centred while following. Scrolling the list pauses following, and "Back to current line" brings it back.
- Each timestamp is a "Play from 0:15" button that calls `onSeek`. Without `onSeek`, timestamps are plain text.
- `TranscriptSearch` highlights matches with `<mark>`. Enter and Shift+Enter move between them, and each move announces "2 of 5" or "No matches".
- `loading` and `emptyState` cover the states before there is any text.
- Add it with `shadcn add @vegastack/transcript`.

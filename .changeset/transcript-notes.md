---
"@vegastack/ui": minor
---

🔧 **Transcript** takes `notes`: lines that are not speech (notes typed while recording, `{ id, time, text, marked? }`) shown among the turns at their time as a quiet, indented row with its time, a pen and `noteLabel` — a star in the warning ink when `marked`. A note has no speaker, is never the current line, is not searched, and seeks from its time with `onSeek`; without `notes` nothing changes.

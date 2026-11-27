---
"@vegastack/design-tokens": minor
---

🔧 Agent faces come in two families: Pebbles and Dots.

- `AgentFaceSpec.family` (`"pebble"` | `"dot"`, new and optional; absent means Pebble) and `FACE_FAMILIES` with their names.
- A Dot draws the preset's silhouette with a 5 × 5 dot face at every size: unlit dots show faintly from 40px, the lit dots grow below 24px, states are dot patterns with a light round the edge (thinking), a wave (working) and typing dots (writing), its eyes blink when idle, and it keeps the badges. It moves with the same body rhythms as a Pebble. `data-family` and `data-form="dot"` mark it.
- Back: the `face-dot-ink` token and the `motion-face-chase` and `motion-face-wave` utilities.

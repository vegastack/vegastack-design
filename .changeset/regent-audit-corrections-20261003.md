---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 Preserve permissions, editor content and interaction state across asynchronous work, and make design verification report the behavior it actually checks.

- Guard board drops, serialize pending moves, cancel lazy playback, retain wizard locks and support keyboard activation of grid cards and virtualized cells.
- Normalize image URLs, bound thumbnail inflation, preserve unsupported paste selections and honor React callback-ref cleanup.
- Render relative timestamps from a shared request reference and live clock; hide unavailable comment composers without hiding replies.
- Preserve no-ring focus while raising the existing text-entry border tint to the first standard opacity that passes the unchanged contrast threshold.
- Protect cleanup and idempotency checks, verify negative-test identity, load credential-only dotenv values and correct generated installation/API/example guidance and docs demos.

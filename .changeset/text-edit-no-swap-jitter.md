---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 TextEdit swap. A `variant="composer"` box mounts its editor at once (it is an input — no read view to click through first), and every editable `TextEdit` fetches the editor when the page goes idle, so the first click swaps it in immediately. A new browser test holds the read view and the editor to the same first-line position, height and caret start (within half a pixel) for documents and composers, empty and with text.

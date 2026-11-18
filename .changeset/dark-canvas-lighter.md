---
"@vegastack/design-tokens": patch
---

🔧 Shell: in dark the rounded-card frame's canvas is lighter than its page card (LAY-26). `--shell-canvas` moves from `oklch(0.145 0 0)` to `oklch(0.235 0 0)` (about `#1E1E1E`) under the global bar and the rail, one step above the card's `oklch(0.185 0 0)`; light is unchanged.

---
"@vegastack/ui": patch
---

🛠 Test lanes: `geometry.css` reads `hover:` as plain `:hover` (`@custom-variant hover`). Headless Chromium in the Linux runner image reports `(hover: hover)` as false, so every `hover:` style vanished in CI while desktop hosts applied it (`ghost-chip-align` failed in CI only).

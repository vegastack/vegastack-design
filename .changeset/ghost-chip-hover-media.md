---
"@vegastack/ui": patch
---

🛠 Test lane: Chromium launches with a desktop mouse stated (`--blink-settings` hover and pointer types). Headless Chromium in the Linux runner image reported `(hover: hover)` as false, so Tailwind's `hover:` styles never applied in CI (`ghost-chip-align` failed there only) while every desktop host applied them.

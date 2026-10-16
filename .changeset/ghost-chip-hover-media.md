---
"@vegastack/ui": patch
---

🛠 Test: `ghost-chip-align` reads the ghost chip's hover reveal with the page's media set to a fine, hovering pointer. Headless Chromium on the Linux runners reports `(hover: hover)` as false, so Tailwind's `hover:` styles never applied there and the test failed in CI only.

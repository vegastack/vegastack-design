---
"@vegastack/ui": patch
"@vegastack/design-tokens": patch
---

🐛 `TextSpinner`'s bolt keeps its text size (0.72em × 0.48em) inside containers that size their icons with `[&_svg:not([class*='size-'])]:size-*`: a Button such as Send, `LiveLine`'s trigger and a `ChatComposerNotice` lead. It had grown to 16px there, so a striking bolt looked bigger than the pulsing "Thinking" one. Pulse now steps .75 → .45 → .45 → .75 → 1 → 1 (was .65 → .3 …), so a waiting bolt reads as clearly as a striking one.

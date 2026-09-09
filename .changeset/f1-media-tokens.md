---
"@vegastack/design-tokens": minor
---

🐛 **Media chrome no longer inverts in dark** — the video scrim and its controls were built
from `primary`, which flips with the theme, so in dark the scrim rendered near-white with near-black
icons. New theme-invariant `--media-scrim`, `--media-scrim-strong` and `--media-foreground` tokens
keep overlay chrome dark-scrim + light-ink in both themes.
[docs](https://design.vegastack.com/docs/foundations/colors)

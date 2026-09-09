---
"@vegastack/ui": minor
---

🔧 **Media chrome is theme-invariant.** The video overlay was built on `primary`, which flips
with the theme — in dark it rendered a near-white scrim behind near-black icons. Scrim, pills and
ink now come from `--media-scrim`, `--media-scrim-strong` and `--media-foreground`, which are the
same values in both themes, and a compiled-CSS test pins scrim lightness under 0.3 with overlay ink
over 0.85. Overlay controls are `IconButton variant="ghost" shape="round"` on the scrim.
[docs](https://design.vegastack.com/docs/components/video-player)

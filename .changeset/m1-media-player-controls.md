---
"@vegastack/ui": minor
---

🧩 **`media-player-controls`** — the shared media transport, lifted out of `audio-player` (which
owned the video player's controls too). It carries the control surface and `useMediaShortcuts`: ONE
keyboard map for both players (Space/K play, J/L and arrows skip, M mute, F fullscreen), scoped
`surface` vs `controls` so a shortcut can never steal a key from the focused control. The
`assignRef` / `getMediaDuration` / `clampTime` helpers live here as well, instead of in a copy per
player. `audio-player` drops from 1,431 lines to 305.
[docs](https://design.vegastack.com/docs/components/media-player-controls)

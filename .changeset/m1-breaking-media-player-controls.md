---
"@vegastack/ui": minor
---

⚠️ **`MediaPlayerControls` moved out of `audio-player` into its own registry item.** It was
exported from `audio-player` even though the video player was its main consumer. Run
`shadcn add @vegastack/media-player-controls` and import from `@/components/ui/media-player-controls`;
`video-player` declares it as a registry dependency, so a fresh `shadcn add @vegastack/video-player`
pulls it in automatically.
[docs](https://design.vegastack.com/docs/components/media-player-controls)

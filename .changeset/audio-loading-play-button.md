---
"@vegastack/ui": patch
---

🐛 `AudioPlayer` no longer grows while it loads. The "Loading audio…" status row below the controls is gone: while `loading` is set, a lazy `src` resolves, or the media buffers after play, the play button's glyph becomes a spinner of the same size in the same button (`aria-busy`, same accessible name, still pauses). `loadingLabel` is still announced once to screen readers. `MediaPlayerControls` gains the `loading` prop that draws it.

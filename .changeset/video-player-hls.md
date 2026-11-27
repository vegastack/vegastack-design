---
"@vegastack/ui": minor
---

🧩 Video Player plays HLS playlists, with chapters, captions, skip ranges, picture in picture and the full keyboard map.

- `hls={{ playlistUrl, expiresAt, onExpired }}` in place of `src`: native HLS in Safari and iOS, `hls.js` (1.7.4, loaded with a dynamic `import()` only where needed) elsewhere, with `hlsWorkerPath` for a same-origin worker. `onExpired` runs 60 s before `expiresAt` and on a 403, and the player reloads the new playlist at the same position, playing if it was. `attach` (`visible` or `interaction`) decides when a playlist loads; the poster shows until then.
- `skipRanges` previews an edit: playback jumps past each range, and the scrubber, readout, chapters and 0–9 jumps use the edited time.
- `chapters` (ticks on the scrubber, the title on hover, a Chapters menu), `captions` (one WebVTT track, a captions control, remembered per device), picture in picture where supported, and fullscreen with Safari and iOS fallbacks.
- `onTimeUpdate(ms)` and `controllerRef` (`seekTo`, `play`, `pause`, `currentMs`) for a transcript that follows and seeks.
- Keys: C captions, P picture in picture, `<` / `>` speed, 0–9 jump, ↑ / ↓ volume; `arrowSkipSeconds` lets ← → move less than J / L. Speeds gain 1.75×. The scrubber reads "1:23 of 4:56". Waits over 400 ms show the loading bolt. While playing, the controls step aside after 2.5 s without pointer movement; paused after playing, they stay up.
- `src` and `onSourceExpired` are unchanged. `MediaPlayerControls` gains `timeline`, `chapters`, captions and picture-in-picture toggles and `arrowSkipSeconds`.

---
"@vegastack/ui": patch
"@vegastack/design": patch
---

📦 The audio player loads less. `AudioPlayerProvider`, `useGlobalPlayer`, `useGlobalPlayerTime` and `GlobalAudioPlayer` now live in `audio-player-global` (still re-exported from `audio-player`): import them from there in an app shell and the player UI loads only once a recording opens, so routes that never play one ship no player code. `AudioPlayer` takes `deferControls`: a light play button (and the still waveform with `peaks`) until the first play, then the full controls with focus on their play button, for lists of recordings.

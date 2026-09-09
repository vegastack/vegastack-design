---
"@vegastack/ui": minor
---

🐛 **A viewer's chosen playback speed no longer resets while the media plays.** The
media-element effect listed the consumer's `onTimeChange` among its dependencies; `timeupdate` fires
~4×/s and re-renders the controls, so a player given an inline callback re-applied
`defaultPlaybackRate` several times a second and 2× snapped back to 1×.
[docs](https://design.vegastack.com/docs/components/video-player)

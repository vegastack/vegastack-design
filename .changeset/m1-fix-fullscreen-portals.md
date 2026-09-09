---
"@vegastack/ui": minor
---

🐛 **The video player's tooltips and settings menu are visible in fullscreen.** They portaled
to `<body>`, which the browser does not paint inside a fullscreen element — the playback-speed and
quality menus were unusable in fullscreen. `MediaPlayerControls` takes a `portalContainer` and
`VideoPlayer` passes its frame; the volume panel already avoided this by rendering inline.
[docs](https://design.vegastack.com/docs/components/video-player)

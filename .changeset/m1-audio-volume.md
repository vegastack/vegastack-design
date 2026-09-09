---
"@vegastack/ui": minor
---

🔧 **AudioPlayer gains mute and a volume rail in both layouts.** Audio previously had no
visible volume control at all and mute was reachable only from the M key. The rail is a vertical
`Slider` opened from the mute button, rendered inline rather than portaled — the video frame is the
fullscreen element, so a portal to `<body>` would put the rail outside it. The seek thumb is now
hidden at rest only where a pointer can hover; on touch it stays visible, because otherwise there is
no scrub affordance at all.
[docs](https://design.vegastack.com/docs/components/audio-player)

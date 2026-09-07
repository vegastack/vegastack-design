---
"@vegastack/ui": minor
---

Media players share one transport. The new `media-player-controls` registry item owns the control
surface and `useMediaShortcuts` — a single keyboard map (Space/K play, J/L and arrows skip, M mute,
F fullscreen), scoped so a shortcut can never steal a key from the focused control — plus the
`assignRef` / `getMediaDuration` / `clampTime` helpers both players used to keep private copies of.
`audio-player` drops from 1,431 lines to 305; `video-player` declares the shared item in
`registryDependencies`.

Overlay chrome is now theme-invariant. It draws on `--media-scrim`, `--media-scrim-strong` and
`--media-foreground` instead of `primary`, which flipped with the theme and in dark rendered a
near-white scrim behind near-black icons. Overlay controls are `IconButton variant="ghost"
shape="round"` on the scrim and keep the system's standard 2px focus outline: the
`MEDIA_SOFT_FOCUS_CLASS` / `MEDIA_FOCUS_OFFSET_CLASS` box-shadow glow and its forced-colours
carve-out are deleted, and `tabIndex={0}` remains only on genuinely scrollable regions.

Audio gains mute and a volume rail in **both** layouts (it previously had neither — mute was
keyboard-only), and the seek thumb stays visible where a pointer cannot hover instead of leaving no
scrub affordance on touch.

`Slider` gains `variant` (`default · media · overlay · bare`), `orientation`, `thumb`
(`always · hover · none`), `marks` and `showValue`, which retires every
`[&_[data-slot=slider-*]]` descendant override the players used to restyle it from outside.
`AttachmentTrigger` drops `outline-none` for the inset focus outline, `Image` defaults to
`loading="lazy" decoding="async"` with an `eager` opt-out, and `VideoPlayer` gains `controlsVisible`
to pin the overlay open for kiosk players and static fixtures.

---
title: "M1 · Media players: split controls, theme-invariant chrome, standard focus ring, audio volume, Slider props"
labels: [audit-2026-09, components, media]
---

## Context

Audit 2026-09-07, `02-batch-04-media-rich-text.md` (B4-01…B4-08, B4-11), `02-batch-01` B1-15
(Slider readout/marks). Depends on **F1** (`--media-scrim`, `--media-scrim-strong`,
`--media-foreground`) and **F2** (`IconButton shape="round"`). Decisions: D16 (no glass; overlay
buttons are ghost IconButtons on a scrim), D17 (standard 2px outline on media controls).
Evidence: `probe-media.mjs`, `captures/_overlays/video-volume__{light,dark}.png`, `audio__*.png`.

## Problem

- Video overlay chrome is built on `primary`/`primary-foreground` and **inverts in dark**: scrim
  measured oklab 0.92 (near-white), icons near-black (`video-player.tsx:524`,
  `audio-player.tsx:53,259,1040`).
- `audio-player.tsx` is 1,432 lines and owns `MediaPlayerControls` (≈880 lines) that
  `video-player.tsx` imports; `assignRef`/`getMediaDuration`/`clampTime` duplicated; keyboard
  shortcuts implemented twice (`audio-player.tsx:689-764`, `video-player.tsx:329-446`).
- `MEDIA_SOFT_FOCUS_CLASS`/`MEDIA_FOCUS_OFFSET_CLASS` (`audio-player.tsx:66-79`,
  `video-player.tsx:500`) replace the global outline with a `ring-2 ring-ring/50` box-shadow glow.
- Audio has **no volume/mute control** in either layout (`:1167-1184`, `:1194-1233`) and hides the
  seek thumb at rest (`:257`), so touch users have no scrub affordance.
- ~70 `[&_[data-slot=slider-*]]:` overrides restyle `Slider` from outside (`:257,259,350,1054-1057`);
  `orientation="vertical"`/`thumbAlignment="edge"` are passed but undocumented.
- `AttachmentTrigger` uses border tint as its only focus cue on a button (`attachment.tsx:454`).
- `Image` has no `loading="lazy" decoding="async"` default (`image.tsx:145-157`).

## Do

1. New registry item `media-player-controls` (shared controls + `useMediaShortcuts` with one
   shortcut map: Space/K play, J/L seek, M mute, F fullscreen, arrows); `audio-player` and
   `video-player` compose it; `video-player` declares it as a registry dependency; helpers move
   to one module.
2. Overlay chrome on `--media-scrim` (gradient), `--media-scrim-strong` (volume pill),
   `--media-foreground` (ink); buttons are `IconButton variant="ghost" shape="round"` on the
   scrim.
3. Delete both focus constants; controls keep the centralised outline, inset
   (`focus-visible:-outline-offset-2`) inside `overflow-hidden` frames; forced-colours carve-out
   removed.
4. Audio: mute button + volume popover in wide and narrow layouts; thumb visible at rest under
   `(hover: none)` and on focus, hidden-until-hover on hover-capable devices only.
5. `Slider` gains `variant: default | media | overlay`, `orientation`, `thumb: always | hover`,
   `marks`, `showValue` (B1-15); the players pass props; descendant overrides deleted.
6. `AttachmentTrigger`: drop `outline-none`, inset ring. `Image`: lazy/async defaults with an
   `eager` opt-out for heroes.
7. Docs: `video-player.mdx` gets a static fixture with the overlay open (`controlsVisible` prop, also
   useful to consumers) so the contract lane sees the controls; `code-block`/`tool-call-chip` gain
   the fixtures listed in B4-11.
8. Doctrine: `design.md` §Media — theme-invariant scrim/ink tokens; controls keep the standard
   ring.

## Acceptance

- Dark-lane test: video scrim computed colour L < 0.3, overlay icon colour L > 0.85.
- `grep -c "\[&_\[data-slot=slider" packages/ui/registry/ui/audio-player.tsx` → 0; audio-player
  under 600 lines; `media-player-controls` in `registry.json` and `component-contracts.json`.
- `pnpm gates:component audio-player video-player slider attachment image`; cross-engine smoke
  (media is in `crossBrowserSmoke`); `probe-media.mjs` rerun shows the same chrome in both themes.

# Media Player Components

Date: 2026-08-26

## Scope

Add two new VegaStack registry components:

- `audio-player`: a compact audio transport matching the supplied reference image.
- `video-player`: a video surface with the same transport/control language.

Both components should share the same player-control model: play/pause, seek, elapsed/duration text,
15-second rewind/forward actions, and playback-rate selection. The video component adds the rendered
video surface above the controls; the audio component stays compact and horizontal.

## Proposed API

`AudioPlayer`:

- `src`, `preload`, `loop`, `muted`, `autoPlay`, `playbackRates`
- `defaultPlaybackRate`, `skipSeconds`
- `label`, `title`, `description`
- `formatTime`
- `onPlayStateChange`, `onTimeChange`, `onPlaybackRateChange`

`VideoPlayer`:

- the same control props as `AudioPlayer`
- `poster`, `aspectRatio`, `playsInline`

The components will render tokenized custom controls and use the browser media element only as the
media engine. Native `controls` will not be exposed by default because the design requirement is a
consistent VegaStack control surface.

## Implementation Notes

- Canonical sources live in `packages/ui/registry/ui/audio-player.tsx` and
  `packages/ui/registry/ui/video-player.tsx`.
- Put shared media-control helpers in a small internal module if duplication becomes meaningful;
  otherwise keep helpers local to avoid creating a public abstraction prematurely.
- Compose existing VegaStack primitives where they fit:
  - `IconButton` for play/pause and skip controls.
  - `Slider` for the seek track.
  - `Button` or `Segmented`-style treatment for playback rate, depending on whether the final UI is a
    simple cycle action or an exposed rate picker.
- Use lucide icons already available in the system (`Play`, `Pause`, rewind/forward variants if
  present, or direct `lucide-react` imports without raw size props).
- Use semantic tokens only; no hardcoded color, raw pixel sizing, raw opacity, or removed radius
  classes.
- Use `'use client'` because the components own media state, refs, effects, and event handlers.
- Keep the native `<audio>` / `<video>` element hidden or visually framed as appropriate and do not
  render native browser controls.

## Docs And Registry Work

Add the full eight surfaces required by the component skill for each component:

- canonical component source
- browser-mode unit tests
- docs preview
- MDX docs page
- `packages/ui/registry.json` item
- changeset
- preview barrel and docs nav entry
- `packages/ui/component-contracts.json` record, followed by `pnpm design:derived`

Docs previews will use deterministic demo media. If no product media is supplied, use small stable
sample media sources solely for the docs examples.

## Verification

Run the narrow gates first, then widen:

- `pnpm gates:component audio-player`
- `pnpm gates:component video-player`
- `pnpm registry:build`
- `pnpm design:derived`
- `pnpm design:verify`
- `pnpm registry:verify-consume`
- `pnpm contracts` or route-scoped `node tooling/contracts-run.mjs --routes /docs/components/audio-player /docs/components/video-player`

If the local changes remain limited to these new components, do not run the full ship ladder unless
MK asks to prepare a release.

## Risks

- Media playback state is browser-owned and asynchronous; tests need to avoid depending on real
  decoding where the browser harness cannot guarantee it.
- A custom range control must stay keyboard-accessible. Composing the existing `Slider` is preferred
  because it already owns the accessible slider interaction.
- The docs examples need reliable media URLs or checked-in tiny sample assets. If the supplied design
  must use specific audio/video content, those assets need to be provided before implementation.

## Non-Goals

- No playlist or queue management.
- No waveform renderer.
- No captions/transcript UI in this first pass.
- No fullscreen or picture-in-picture controls unless explicitly requested later.
- No shipping, publishing, or deployment.

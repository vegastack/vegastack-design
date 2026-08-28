# Audio Player — video-parity control surface + waveform variant

**Date:** 2026-08-28
**Author:** MK (via Claude Code)
**Status:** Proposed — awaiting approval

## Goal

Bring the standalone `AudioPlayer` control surface in line with the `VideoPlayer` overlay controls
(but rendered statically on the audio card), and add a second `AudioPlayer` variant whose seek bar is
a **real, decoded-audio waveform**.

Both players share `MediaPlayerControls` in `packages/ui/registry/ui/audio-player.tsx`. The video uses
`variant="overlay"`; the audio uses `variant="default"`. The redesign is scoped to the `default`
variant + a new audio-only waveform seek, so **the video player is left visually unchanged**.

## Scope (what changes)

1. **Default controls adopt the video layout, static.**
   - Layout becomes the overlay's two-row structure: seek bar on top (full width), then
     `[play + time readout] · spacer · [volume · settings]`. The current `@lg` reflow that splits
     elapsed/duration to the row ends is removed.
   - Colors are the light-surface analog of the overlay treatment (not the white
     `primary-foreground` used over media).

2. **Combined time readout `0:00 / 0:00` next to the play button**, replacing the split
   `media-player-elapsed` (left) / `media-player-duration` (right) spans. Reuses the existing
   `timeReadout` element, made color/size-aware per variant (`text-muted-foreground`, mono/tabular).

3. **Settings sub-dropdown matches the video.** The label-leading / trailing-selected-dot treatment
   (`MEDIA_OVERLAY_RADIO_ITEM_CLASS`) currently gated to `overlay` is applied to `default` as well.

4. **Scrubber = solid fill, borderless thumb.** Seek slider overrides: `bg-muted` track,
   `bg-primary` indicator (played portion stays visible), and a **solid `bg-primary`, `border-0`**
   thumb revealed on hover/focus/drag (same reveal mechanic as the overlay). Replaces the current
   translucent alpha-wash track. Effective drag/tap target stays ≥24px (checked).

5. **Play/pause button: no filled background, primary-colored icon, hover background.**
   Becomes `variant="ghost"` (was filled `variant="default"`), icon in `text-primary` at the feature
   icon size, `rounded-full`, with the standard ghost hover background — the light-surface equivalent
   of the video's ghost + hover tint. Mute/settings stay ghost as today.

6. **New `variant="waveform"` on `AudioPlayer`** — same controls as above, but the seek bar renders a
   real waveform:
   - A local helper decodes `src` via Web Audio (`fetch` → `AudioContext.decodeAudioData`), samples
     the PCM into N normalized peak buckets in a `useEffect`, and stores them in state.
   - Bars render as an `aria-hidden` visual layer: played bars `bg-primary`, unplayed `bg-muted`,
     filled continuously as `currentTime` advances.
   - A **transparent `Slider` overlays the bars** to own all interaction and a11y — keyboard
     (arrows/Home/End), pointer click/drag seek, and the hidden `input[type=range]` slider semantics
     — so no hand-rolled `role="slider"` is introduced. Thumb hidden; progress shown by bar color.
   - Graceful fallback: on fetch/decode failure or before decode completes, flat equal-height bars
     render and remain fully interactive (robustness only — the feature path is real decoded audio).

## Non-goals

- No change to `VideoPlayer` visuals or the `overlay` variant.
- No new npm dependency — Web Audio is a native browser API.
- No new registry hook — peak decoding stays a local helper in `audio-player.tsx` (revisit only if a
  second consumer appears).
- No entrance/height animation on bars (keeps reduced-motion trivial); bar fill is an immediate color
  change (per the no-`transition-colors` rule).
- No playlist / transcript / multi-track features.

## Wiring / API

- `MediaPlayerControlsProps` gains `seekVariant?: "slider" | "waveform"` (default `"slider"`) and
  `waveformPeaks?: readonly number[]`.
- `AudioPlayerProps` gains `variant?: "default" | "waveform"` (default `"default"`); the root gets a
  `data-variant`. When `waveform`, `AudioPlayer` decodes peaks and passes them + `seekVariant` down.

## Files to touch

| File                                                                               | Change                                                                                                                                                                   |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/ui/registry/ui/audio-player.tsx`                                         | Redesign `default` layout/colors; combined readout; menu treatment; solid/borderless scrubber; ghost primary play button; waveform seek + peak decoding; `variant` prop. |
| `packages/ui/registry/ui/audio-player.test.tsx`                                    | Update to combined readout; add a waveform-variant test (slider present + operable, bars render).                                                                        |
| `apps/docs/components/preview/audio-player.tsx`                                    | Add `audioPlayerWaveform()` preview.                                                                                                                                     |
| `apps/docs/components/stories/audio-player.story.tsx`                              | Add a "Waveform" story variant.                                                                                                                                          |
| `apps/docs/content/docs/components/audio-player.mdx`                               | Add Waveform example; note the `variant` prop; refresh Basic copy.                                                                                                       |
| `packages/ui/component-contracts.json`                                             | Set `variants` dimension to `default`/`waveform`; add visual state; then `pnpm design:derived`.                                                                          |
| `apps/docs/components/ui/audio-player.tsx`, `apps/docs/public/r/audio-player.json` | Regenerated by `pnpm registry:build` (never hand-edited).                                                                                                                |
| changeset                                                                          | `pnpm changeset` — minor (`@vegastack/ui` / registry item), new `variant`.                                                                                               |

`registry.json` audio-player deps are unchanged (no new dep). `video-player.tsx` untouched.
`design.md` has no players section (`grep` found none), so no doctrine sync is required.

## Verification (how we prove it worked)

- `pnpm gates:component audio-player` (design-lint + unit + its contract routes) as the inner loop.
- `node tooling/design-lint.mjs packages/ui/registry` — token/AST rules (watch: no raw colors on
  bars, alpha vs opacity, motion pairing, `border-0` allowed).
- `cd packages/ui && pnpm exec tsc --noEmit && pnpm exec vitest run` — types + browser unit + axe,
  incl. new waveform test and an `expectNoA11yViolations` for the waveform state.
- `pnpm registry:build && git status --porcelain` — idempotent, copy-in + JSON regenerated.
- `pnpm design:derived && pnpm design:verify` — contract reconciliation + RSC safety + the rest.
- `pnpm contracts` (scoped) — 320px reflow, RTL containment, 24px target floor on both audio routes.
- `node tooling/vrt-review.mjs` — before/after pixels on the audio route for a human read at ship.

## Risks

- **Waveform a11y** — mitigated by keeping a real Base UI `Slider` as the interaction/semantic layer;
  bars are decorative (`aria-hidden`). No new roving-tabindex to test.
- **Decode in tests** — browser-mode has `AudioContext`, but the tiny silent fixture yields ~flat
  peaks; the waveform test asserts the slider is present/operable and bars render, not bar heights.
- **VRT determinism** — the docs waveform decodes a fixed local file, so bars are deterministic.
- **Cleanup** — `AbortController` for the fetch and `AudioContext.close()` on unmount/`src` change to
  avoid leaks.
- **RTL** — bar fill follows logical progress; verified against the contract RTL check.

## Rollback

Single-commit, additive: revert restores the current default look and drops the `waveform` variant.
No data migration, no API removal.

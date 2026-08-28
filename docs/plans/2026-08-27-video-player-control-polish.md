# Video Player Control Polish

Date: 2026-08-27

Status: Awaiting MK approval. No component implementation starts until this plan is approved.

## Findings

- The video seek/progress rail currently composes the canonical `Slider` through
  `MediaPlayerControls` in `packages/ui/registry/ui/audio-player.tsx`. The vertical volume rocker
  uses the same `Slider` and applies media-specific geometry through descendant selectors.
- The generic `Slider` is not the right authority for this visual adjustment: changing it would
  alter unrelated product sliders. The media transport needs a named local specialization while
  retaining Base UI Slider keyboard and screen-reader behavior.
- The overlay seek thumb jumps from hidden to visible because its opacity has no transition, and
  the track has no resting/hover thickness states.
- Overlay icon controls currently use the 32px `sm` IconButton surface with a 10% ink-tint hover.
- The overlay volume surface is 40px wide around a 32px mute button. At maximum volume the vertical
  track terminates too close to the surface edge, leaving the thumb visually tangent to the top.
- Fullscreen toggling works, but no `fullscreenchange` state is reflected into the control, so the
  icon, tooltip, and accessible name always say “Fullscreen”.
- The video overlay time readout uses the 12px mono code role.

## Scope

1. Introduce a named internal `MediaProgressSlider` specialization around `Slider`, with a
   `media-player-progress` slot. Keep `Slider` as the interaction primitive and keep this helper
   private to the shared media-control implementation.
2. For the video overlay progress rail, use a thin resting track that smoothly grows on hover or
   focus, reduce the visible thumb from its current oversized overlay treatment, and transition the
   thumb opacity and track geometry with the sanctioned duration/easing tokens. Preserve the
   invisible 24px minimum interaction target and reduced-motion behavior.
3. Increase video-overlay transport buttons from the small to the default IconButton surface and
   strengthen the existing semantic hover wash. Do not alter the global IconButton component.
4. Narrow the video-overlay volume surface to align with the mute button, reduce its internal
   padding, and inset the vertical track endpoints so the thumb remains visibly contained at both
   0% and 100%.
5. Track the frame’s real fullscreen state from `fullscreenchange`. Render `Maximize` when windowed
   and `Minimize` when fullscreen, with matching tooltip and accessible labels (“Fullscreen …” /
   “Exit fullscreen …”). Keep the `F` shortcut as a toggle.
6. Change only the video-overlay elapsed/duration readout to the sans 14px text role while retaining
   tabular numerals. Leave the compact Audio Player’s mono time treatment unchanged.
7. Update the Video Player tests and docs for the named progress rail, smooth visual states,
   contained volume extrema, and fullscreen enter/exit state. Update the component contract only if
   its modeled state evidence needs to name the new fullscreen-exit/hover states.

## Non-Goals

- No change to the public `Slider` API or its default visual treatment.
- No new public registry component or dependency.
- No change to media playback, seeking, volume, settings, quality, or keyboard semantics.
- No redesign of the standalone Audio Player.
- No release, publish, deploy, or changelog work.

## Verification

- Add regression coverage before behavior changes where practical, including computed geometry for
  the progress hover state and vertical volume endpoints rather than class-name assertions alone.
- Run `pnpm gates:component audio-player` because it owns the shared transport source.
- Run `pnpm gates:component video-player` for the composed overlay and fullscreen behavior.
- Run `node tooling/design-lint.mjs packages/ui/registry`, `pnpm registry:build`,
  `pnpm design:derived`, and `pnpm design:verify`.
- Run the scoped behavior contracts for `/docs/components/audio-player` and
  `/docs/components/video-player` through `tooling/contracts-run.mjs`.
- Run `node tooling/vrt-review.mjs`; inspect video-player diffs at desktop and 320px, light/dark,
  hover/focus, volume 0/100, and windowed/fullscreen. Confirm Audio Player pixels remain unchanged.

## Risks

- `MediaPlayerControls` is shared; an unguarded class or prop change could alter Audio Player. Every
  visual branch in this pass must be scoped to `variant="overlay"` and verified on both routes.
- Fullscreen state is browser-owned and asynchronous. State must come from `fullscreenchange`, not
  optimistic click state, and tests must cover external fullscreen exit as well as button/keyboard
  entry.
- Shrinking the visible seek thumb or volume surface must not shrink the effective pointer target or
  clip the centralized focus outline.
- The worktree already contains in-progress media-player and Progress Indicator changes. Preserve
  those edits and review generated output before accepting it.

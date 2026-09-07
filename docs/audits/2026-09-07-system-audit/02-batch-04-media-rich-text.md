# 02 — Batch 4: media and rich text

**Items:** audio-player (+ `MediaPlayerControls`) · video-player · attachment · image · figure-frame ·
code-block · terminal · markdown-view · text-edit · copy-button · tool-call-chip · message
**Evidence:** source read; five-lane captures; an interaction probe (`probe-media.mjs`) that hovers
the video frame, opens the volume popup and records the scrim/button colours in light and dark
(`captures/_overlays/video-volume__*.png`, `audio__*.png`); tests and docs inventories.

Overall: the rich-text and chat leaves are tidy and largely server-safe. The media pair is the
heaviest, most duplicated code in the system and has one real theme defect. MK's original example
(the volume slider handle) is explained below: the handle exists in the video popup, but the audio
player has **no volume control at all** and hides the seek handle at rest.

## Findings

### B4-01 · HIGH · defect · The video overlay chrome inverts in dark mode

- **Where:** `video-player.tsx:524` scrim `from-primary/(--alpha-backdrop-soft)`; `audio-player.tsx:53`
  overlay buttons `text-primary-foreground`; `:1040` volume pill `bg-primary/… text-primary-foreground`;
  `:259` overlay track/thumb `bg-primary-foreground`.
- **Measured:** light: scrim `oklab(0.35 … / 0.6)` (dark), icons near-white. Dark: scrim
  `oklab(0.92 … / 0.6)` (**near-white**), icons **near-black**, volume pill light with a black
  thumb (`captures/_overlays/video-volume__dark.png`). Controls over video must be dark-scrim +
  light-ink regardless of theme; `primary` flips with the theme, so the chrome flips with it.
- **Fix:** add two theme-invariant tokens, `--media-scrim` (a black alpha) and `--media-foreground`
  (warm off-white), plus `--media-scrim-strong` for the volume pill, and use them for every overlay
  surface. Add a dark-lane test asserting the scrim's computed colour has L < 0.3.

### B4-02 · HIGH · bloat · `audio-player.tsx` is 1,431 lines and owns the video controls

- `MediaPlayerControls` (≈880 lines) lives inside `audio-player.tsx` and is imported by
  `video-player.tsx`; `assignRef`, `getMediaDuration`, `clampTime` are duplicated in both files;
  keyboard shortcuts (Space/J/K/L/M/F, arrows) are implemented **twice** — once in the controls
  (`audio-player.tsx:689-764`) and once in the video frame + a document-level listener
  (`video-player.tsx:329-446`).
- **Fix:** three registry items: `media-player-controls` (shared, with `useMediaShortcuts`),
  `audio-player`, `video-player`. One shortcut map. `video-player` registers `media-player-controls`
  as a registry dependency instead of reaching into audio-player.

### B4-03 · HIGH · doctrine · The media chrome invents a box-shadow focus ring

- **Where:** `audio-player.tsx:66-79` (`MEDIA_SOFT_FOCUS_CLASS`, `MEDIA_FOCUS_OFFSET_CLASS`),
  `video-player.tsx:500`. Under normal colours the global 2px outline is replaced by a
  `ring-2 ring-ring/50` box-shadow with an offset — exactly the "glow" `design.md` forbids, and a
  second focus grammar in the system. The forced-colours carve-out is correct but exists only to
  patch the deviation.
- **Fix:** delete both constants; controls keep the centralised outline (inset with
  `-outline-offset-2` inside `overflow-hidden` frames, the Terminal pattern). If a softer ring on
  media is wanted, it is a token decision (`--ring-media`), not a component-local override.

### B4-04 · MEDIUM · UX · Audio has no volume/mute control and hides its seek handle

- **Where:** `audio-player.tsx:1167-1184` (wide layout) and `:1194-1233` (narrow) render no volume
  control; mute is keyboard-only (`M`). `MediaProgressSlider` default variant hides the thumb
  (`opacity-0`) until hover/focus/drag (`:257`), so the seek reads as a progress bar, not a control.
- **Facts:** every reference player (YouTube, Spotify, Apple, Geist's media examples) shows a mute
  button and a visible seek handle at rest on hover-less devices; hiding the handle on touch means
  no scrub affordance at all.
- **Fix:** mute button with the volume popover in both layouts; thumb visible at rest on
  `(hover: none)` and on focus, hidden-until-hover only on hover-capable devices. Slider gets a real
  `variant` (`default | media | overlay`) instead of 60 descendant overrides (B4-05).

### B4-05 · MEDIUM · bloat · Slider is restyled from outside with descendant selectors

- `audio-player.tsx:257,259,350,1054-1057` push ~70 `[&_[data-slot=slider-*]]:` utilities onto
  `Slider` to make it media-shaped. That is the component's styling leaking to the call site
  (against the "no local styles" principle of the polish mandate). Also `orientation="vertical"` and
  `thumbAlignment="edge"` are passed but `Slider` documents neither.
- **Fix:** `Slider` gains `orientation` (documented, with its own layout), `variant`
  (`default | media | overlay`) and `thumb` (`always | hover`) props; the players pass props.

### B4-06 · MEDIUM · a11y · `AttachmentTrigger` uses a border tint as its only focus cue

- `attachment.tsx:454` `outline-none focus-visible:border-ring/…` on a `<button>` overlay: the
  same forced-colours gap as B1-01, on a non-text-entry control where the doctrine explicitly
  forbids border-tint focus. Fix: drop `outline-none`, keep the centralised outline with
  `-outline-offset-2` (the trigger sits inside `rounded-[inherit]` overflow).

### B4-07 · MEDIUM · consistency · Round icon buttons and `size="default"` everywhere

- Every media control overrides `rounded-full` on `IconButton` (12 call sites). Round is a fine
  media idiom, but it should be `IconButton shape="round"` (or the media variant), not a class
  override per call. `size="default"` → `md` per B1-05.

### B4-08 · MEDIUM · UX · `Image` does not lazy-load or decode async by default

- `image.tsx:145-157` renders `<img>` with no `loading`/`decoding`. `MarkdownView` already sets
  `loading="lazy" decoding="async"` on its images (`markdown-view.tsx:346`). Default both on `Image`
  (consumers override for above-the-fold heroes with `loading="eager"`).

### B4-09 · LOW · consistency · Prose recipes duplicated between MarkdownView and TextEdit

- `markdown-view.tsx:33-274` and `text-edit.tsx:34-57` restate the same heading/paragraph/list/
  code/blockquote token recipe (one as `Components`, one as `[&_h1]:` selectors). Extract a
  `prose.ts` recipe (class strings per element) both consume; TextEdit's `[&_pre]` block should
  render `CodeBlock`'s surface classes, not a third copy.

### B4-10 · LOW · gap · TextEdit toolbar is not a Base UI `Toolbar`

- `text-edit.tsx:123-206` is a `role="toolbar"` of `Toggle`s with no roving tab stop; every button
  is its own tab stop. Base UI `Toolbar` (roving focus, `Toolbar.Group`, `Separator`) exists. Adopt
  it here and in ActionBar/FilterBar (Batch 5/8).

### B4-11 · LOW · docs/tests · Coverage gaps

- `code-block` (3 tests, 1 preview: no headerless, no long-line overflow fixture) and
  `tool-call-chip` (3 tests, 1 preview: no interactive `render={<button/>}` fixture, no running state
  in the contract lane) are thin. `text-edit.mdx` puts "Scope" after Accessibility (move into Usage).
  `video-player.mdx` has no fixture with the overlay open, so the contract lane never sees the
  controls; add a `controlsVisible` prop (also useful to consumers) and a static fixture.
- `copy-button`: `Check`/`Copy` swap via keyed `motion-pop-in` — fine; the `showLabel` path changes
  size to `sm` implicitly (document, or drop the implicit size change).

### Verified fine

MarkdownView is XSS-safe by construction and blocks remote images by default with a documented
allow-list and no-referrer; GFM task-list checkboxes swap to the system `Checkbox`; CodeBlock is
server-safe with a client `CopyButton` leaf; Terminal self-scopes to the marketing ground and names
its scrollable pane correctly; CopyButton's live region is the real announcement mechanism;
`Message`/`Attachment` are server-safe layout primitives with `data-*` state hooks; waveform seek
keeps full keyboard semantics under decorative bars; audio decode aborts on unmount.

## Motion register — Batch 4

| id   | where                            | motion                                 | verdict                             |
| ---- | -------------------------------- | -------------------------------------- | ----------------------------------- |
| M-19 | video controls overlay + scrim   | fade 150ms, auto-hide after 1s         | keep                                |
| M-20 | media seek thumb / track         | opacity + track-height on hover, 150ms | keep (thumb rule changes per B4-04) |
| M-21 | image                            | fade-in on load, 150ms                 | keep                                |
| M-22 | copy button                      | `motion-pop-in` icon swap              | keep                                |
| M-23 | attachment title while uploading | `shimmer` utility                      | keep                                |
| M-24 | message / bubble `animateIn`     | `motion-enter-up`, opt-in              | keep                                |

## Doubts for MK (Batch 4)

| id  | question                                  | options                                                                                                                                                | recommendation                                |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| D16 | `glass` Button variant (deferred from B1) | (a) delete — media chrome uses the new `--media-*` tokens via `IconButton variant="ghost"` on a scrim, not a glass button · (b) keep `glass` for media | **(a)** — the players never use `glass` today |
| D17 | Media focus ring                          | (a) standard 2px outline everywhere · (b) add a `--ring-media` token for a softer ring on video only                                                   | **(a)**                                       |

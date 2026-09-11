# @vegastack/design-tokens

## 0.4.0

### Minor Changes

- [#62](https://github.com/vegastack/vegastack-design/pull/62) [`42aa455`](https://github.com/vegastack/vegastack-design/commit/42aa455b00d1a50bb919ecfb7112a1e4f8c5d244) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`--duration-indeterminate` (1200ms) and the `motion-indeterminate` utility** — the one
  sanctioned looping animation, the sweeping segment of an indeterminate `Progress`. Its keyframes open
  and close on the same resting frame, so the global `prefers-reduced-motion` reset leaves a static 35%
  segment rather than a bar that reads as complete.
  [docs](https://design.vegastack.com/docs/foundations/motion)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **The `prefers-reduced-motion: reduce` reset zeroes delays too.** It gains
  `animation-delay: 0s !important` and `transition-delay: 0s !important`. Zeroing duration alone left a
  staggered entrance sequencing over its real-time delay window, which is motion; with the delay zeroed
  the whole sequence lands at once, and no component needs a `motion-reduce:` restatement of its own.
  [docs](https://design.vegastack.com/docs/foundations/motion)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **`border` and `input` are translucent.** `border` is derived as `foreground` at
  `--alpha-border` (8% light / 14% dark) so one hairline reads on the page, on a card, inside a well
  and on a dark band. Anything that assumed an opaque border value should read the variable instead.
  [docs](https://design.vegastack.com/docs/foundations/colors)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Light cards are page-coloured.** `card` was `oklch(0.985)` against a `0.994` page — a
  grey slab no reference system draws. It is now the page colour, separated by the hairline alone; dark
  keeps its one-step lift. `popover` is `card` in both themes.
  [docs](https://design.vegastack.com/docs/foundations/colors)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Text-entry focus under forced colours** — Input, Textarea, NumberField, OTPInput and
  TextEdit signal focus with a border tint and `outline-none`. Windows High Contrast replaces
  `border-color` outright, so a focused field showed no indicator at all. The token layer now paints a
  real `2px` outline under `forced-colors: active`, once, for every text-entry control.
  [docs](https://design.vegastack.com/docs/foundations/colors)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **A layout scale, and `--chart-single`.** `--layout-header-height`,
  `--sidebar-width-mobile`, `--layout-overlay-max-height` and `--panel-width-sm|md|lg` give the shell
  and the overlay family named dimensions instead of per-component literals, and `--chart-single` names
  the one-series chart colour.
  [docs](https://design.vegastack.com/docs/foundations/colors)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Media chrome no longer inverts in dark** — the video scrim and its controls were built
  from `primary`, which flips with the theme, so in dark the scrim rendered near-white with near-black
  icons. New theme-invariant `--media-scrim`, `--media-scrim-strong` and `--media-foreground` tokens
  keep overlay chrome dark-scrim + light-ink in both themes.
  [docs](https://design.vegastack.com/docs/foundations/colors)

- [#55](https://github.com/vegastack/vegastack-design/pull/55) [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Surface tokens are now one ladder.** `surface-1` / `surface-2` / `surface-3` — the
  rest-fill/well, hover and pressed/selected rungs — arrive with the theme-invariant alpha twins
  `--alpha-hover` (7%) and `--alpha-pressed` (10%). `secondary`, `muted` and `accent` were a single
  OKLCH value under three names, so no hover or pressed state could be seen on a card. They are now
  **aliases** of ladder rungs and have no independent values: `secondary` = `muted` = `surface-1`,
  `accent` = `sidebar-accent` = `surface-2`, `sidebar` = `card`, `sidebar-border` = `border`,
  `sidebar-ring` = `ring`. Existing `bg-muted` / `bg-accent` / `bg-sidebar-*` utilities keep compiling
  and keep their rest appearance; only `accent` moves (one rung darker, because it is the hover rung).
  Name the rung in new code.
  [docs](https://design.vegastack.com/docs/foundations/colors)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **`track` is removed.** The slider rail, progress track, skeleton and every well are
  `surface-1`; the switch off-track is `surface-3`, the pressed rung. Three alpha roles are removed
  with it, because the ladder is now the one hover mechanism and nothing references them:
  `--alpha-fill-hover` (the secondary button's `/80` opacity dim), `--alpha-input-hover` (the dark-only
  input hover wash) and `--alpha-surface-subtle` (the outline button's hover tint, now `--alpha-hover`
  in the family's own hue).
  [docs](https://design.vegastack.com/docs/foundations/colors)

- [#60](https://github.com/vegastack/vegastack-design/pull/60) [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **Button `finish` and the `--shadow-lit` token.** The "lit" action finish is retired, so
  flat-by-default now has no exception at all and the system has exactly **one** shadow role,
  `shadow-overlay`.
  [docs](https://design.vegastack.com/docs/foundations/elevation)

- [#67](https://github.com/vegastack/vegastack-design/pull/67) [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Text-entry focus under forced colours, on a field with addons, where the outline was being
  clipped.** A bordered field group — Input's prefix/suffix wrapper, NumberField's stepper group,
  ChipInput, the Combobox input-group — clips with `overflow-hidden` so its addons follow the rounded
  corner, and the inner input's outline is offset outward into that clip. It was drawn and then cut,
  so an addon field still had no visible focus under the forced palette. The group carries the outline
  now (via a bare `data-field-group` attribute that `base.css` hooks) and the control inside stands
  down, so the two never double-ring.
  [docs](https://design.vegastack.com/docs/components/input)

- [#113](https://github.com/vegastack/vegastack-design/pull/113) [`18e2208`](https://github.com/vegastack/vegastack-design/commit/18e22087c75bdd116554c9cf85523d4be20c7b61) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Two shipped WCAG 1.4.3 failures in brand and status colour, and the three gates that could not
  see them.** The `destructive` `Bubble` was the only place in the registry that used a solid FILL
  token as body text — `text-destructive` over `bg-destructive/(--alpha-soft-surface)` measured
  5.24 / 4.31 / 4.44:1 in light and 2.56 / 2.37 / 1.78:1 in dark across rest/hover/pressed, and its
  light ladder inverted (hover L 0.874, pressed L 0.883) because the pressed step jumped to a
  precomposed token sitting on a different ground. It is now the same soft recipe the four soft
  Buttons use — `bg-destructive-subtle` / `-hover` / `-active` with `destructive-text` ink — measuring
  5.80 / 5.13 / 4.69 light and 6.14 / 5.02 / 4.61 dark, monotone in both. The `tinted` variant's
  pressed step, which composited to L 0.921 against a `surface-3` hover at 0.922, moves to
  `--alpha-ink-tint-strong` so a press is visible. The `cta` Button painted its 0.75rem/400 mono label
  in `text-brand`, a 3.5:1 MARKER value, measuring 3.41 / 3.33 / 3.21:1 in light on the public docs
  playground; the family now ships **`brand-text`**, the page-readable half every chromatic family
  already has, and the label re-measures 5.93 / 5.80 / 5.59 light and 11.41 / 10.90 / 10.13 dark. The
  hovered-link dim (`--alpha-link-hover`, on the `link` Button, every rendered rich-text link through
  `prose`, and PropertyList) composited `success`/`info`/`warning` ink to 4.03–4.11:1 in light at 80%
  and is now 88%, re-measured 4.74–4.83:1. `--alpha-soft-hover` and `--alpha-soft-surface` are
  **removed**: their only consumer was that Bubble line, and `--alpha-soft-hover` was a second, 13pp
  different answer to the role `sd-hooks.mjs`'s `SUBTLE_HOVER_ALPHA` already owns.
  `--font-display` / `--font-pixel` are now bridged into `@theme inline`, so D17's sanctioned Geist
  Pixel flourish is reachable. Gates: `contrast-check.mjs` measures `brand-text` and the link-hover
  composite (both observed failing on the pre-fix theme); `design-lint` gains `fill-token-as-text` and
  `field-group-pairing`, both with negative fixtures; `verify-token-references` and `design-lint` now
  cover `packages/design/src`, where every shared recipe lives and where a bogus token previously
  exited 0; and `verify-docs-base-mirror` now mirrors the `::view-transition-*` reduced-motion
  companion rule the docs copy had silently lost.
  [docs](https://design.vegastack.com/docs/components/button)

- [#90](https://github.com/vegastack/vegastack-design/pull/90) [`d5e2de2`](https://github.com/vegastack/vegastack-design/commit/d5e2de2b3ea2f3e74bab8548b0a5e9fd1d4a1d99) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Toasts run on Base UI, and the `toast()` API changed with them.** `sonner` is removed from the
  system and the registry item is renamed `sonner` → `toast`. `toast()` now takes a title plus Base
  UI's options: `action: { label, onClick }` becomes `actionProps: { children, onClick }`, `duration`
  becomes `timeout` (and `0`, not `Infinity`, disables auto-dismiss), and ids are strings.
  `toast.message` is gone — it was `toast()`. `toast.custom` now renders the toast BODY inside a real
  toast, so a custom notification keeps stacking, swipe-to-dismiss, `Escape` and the live region
  instead of opting out of them. Resolving a loading toast is `toast.update(id, …)` rather than
  re-firing with the same id. `Toaster` loses sonner's props: `position` values are logical
  (`bottom-end`, not `bottom-right`), `expand` is gone because the stack expands on hover by design,
  and `offset` / `mobileOffset` / `theme` are gone — the viewport carries the safe-area insets itself
  and reads the theme from the cascade. `VegaStackProvider` always mounts the toast context now:
  `toaster={false}` still suppresses the visible viewport — the part that must not mount twice — but
  the provider `toast()` writes into is unconditional, so a host rendering its own `<Toaster />`
  shares one queue. `@vegastack/design` gains `TIMINGS.tooltipOpenDelayMs` /
  `TIMINGS.tooltipCloseDelayMs`, which the provider applies to `Tooltip.Provider` so every tooltip in
  an app shares one rhythm. `@vegastack/design-tokens` gains a third z band, `--z-toast` (60): the
  toast viewport mounts with the app provider, before any dialog exists, so DOM order alone would put
  every later-opened dialog on top of it — and a toast fired from inside a modal must stay visible.
  Sonner supplied that from its own private z-index, which is why elevation doctrine carried a
  library-shaped exception; it is now a token with exactly one caller.
  [docs](https://design.vegastack.com/docs/components/toast)

### Patch Changes

- [#59](https://github.com/vegastack/vegastack-design/pull/59) [`065315d`](https://github.com/vegastack/vegastack-design/commit/065315d56e23fd33614f6c9e9a9965f166c063e1) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Text on the soft media scrim is gated at AA** — `media-foreground` on `media-scrim` was
  checked only against the 3:1 non-text floor while the token contract permitted labels on it, so the
  contract was wider than its enforcement. The pair is now gated at 4.5:1; it measures 5.22:1 over the
  white worst case, so nothing moves today and a future scrim retune that thins it under AA fails the
  build instead of silently demoting its labels. The `media-scrim`, `media-scrim-strong` and
  `media-foreground` descriptions state where text is allowed and which floor enforces it. No token
  value changes.
  [docs](https://design.vegastack.com/docs/foundations/colors)

- [#64](https://github.com/vegastack/vegastack-design/pull/64) [`2a3fc24`](https://github.com/vegastack/vegastack-design/commit/2a3fc24196b2a94171bce34478cd18a792bdc550) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📦 **`@vegastack/design-tokens`** — adds the `motion-dock-in` / `motion-dock-out` utilities — the docked-control enter/exit pair for a
  control that stays mounted at a viewport edge and flips `data-active` (a bottom action bar, a
  floating scroll-to-edge button). 150ms in on `ease-emphasized`, 100ms out on `ease-exit`, translate
  and fade, **no scale**: an exit is never slower than its enter.

  The pair owns the timing, the fade and the parked `pointer-events: none`; the travel distance stays
  at the call site as ordinary `translate-*` utilities, because it is per-dock geometry and a
  `translate` declaration inside the utility would clobber a horizontally-centred bar's composed
  transform.

## 0.2.0

### Minor Changes

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Publish the unified VegaStack design doctrine as generated DTCG-backed `design.md` data, add the
  named strong-type and effect roles, keep dark and marketing themes in exact parity, and normalize
  animated icons to React 19 ref props with intrinsic reduced-motion behavior.

  Add the `@vegastack/design/theme-scope` subpath for the `@internal` portal theme-scope plumbing.
  It is a client module (module-scope `React.createContext`), so it is deliberately NOT re-exported
  from the root entry — the root stays importable from a React Server Component, which is what every
  server-safe component relies on when it imports `cn`.

## 0.1.0 — first release (2026-07-18)

The DTCG → Style Dictionary token layer (OKLCH, light + dark):

- Warm-neutral palette; neutral primary; brand = phosphor accent (`--brand`), info = blue.
- Two-layer type scale (product + doc ladders) with a display tier (32/40/56/72, weight 400).
- 24 alpha/opacity role tokens; two z bands; control/icon/radius/sidebar size scales.
- Motion: duration + ease tokens (incl. a `linear()` spring), `motion-pop-in`/`motion-enter-up`/`motion-shake`
  mount utilities, `scroll-fade-*` affordances; reduced-motion resets baked in (incl. `::view-transition-*`).
- The `.vs-marketing` scope: dark brand ground, Newsreader serif + Geist Pixel font tokens, `text-mono-label` voice.

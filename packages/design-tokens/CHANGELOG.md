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
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Light cards are page-coloured.** `card` was `oklch(0.985)` against a `0.994` page — a
  grey slab no reference system draws. It is now the page colour, separated by the hairline alone; dark
  keeps its one-step lift. `popover` is `card` in both themes.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Text-entry focus under forced colours** — Input, Textarea, NumberField, OTPInput and
  TextEdit signal focus with a border tint and `outline-none`. Windows High Contrast replaces
  `border-color` outright, so a focused field showed no indicator at all. The token layer now paints a
  real `2px` outline under `forced-colors: active`, once, for every text-entry control.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`273a602`](https://github.com/VegaStack/vegastack-design/commit/273a602)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **A layout scale, and `--chart-single`.** `--layout-header-height`,
  `--sidebar-width-mobile`, `--layout-overlay-max-height` and `--panel-width-sm|md|lg` give the shell
  and the overlay family named dimensions instead of per-component literals, and `--chart-single` names
  the one-series chart colour.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Media chrome no longer inverts in dark** — the video scrim and its controls were built
  from `primary`, which flips with the theme, so in dark the scrim rendered near-white with near-black
  icons. New theme-invariant `--media-scrim`, `--media-scrim-strong` and `--media-foreground` tokens
  keep overlay chrome dark-scrim + light-ink in both themes.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

- [#55](https://github.com/vegastack/vegastack-design/pull/55) [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **Surface tokens are now one ladder.** `surface-1` / `surface-2` / `surface-3` — the
  rest-fill/well, hover and pressed/selected rungs — arrive with the theme-invariant alpha twins
  `--alpha-hover` (7%) and `--alpha-pressed` (10%). `secondary`, `muted` and `accent` were a single
  OKLCH value under three names, so no hover or pressed state could be seen on a card. They are now
  **aliases** of ladder rungs and have no independent values: `secondary` = `muted` = `surface-1`,
  `accent` = `sidebar-accent` = `surface-2`, `sidebar` = `card`, `sidebar-border` = `border`,
  `sidebar-ring` = `ring`. Existing `bg-muted` / `bg-accent` / `bg-sidebar-*` utilities keep compiling
  and keep their rest appearance; only `accent` moves (one rung darker, because it is the hover rung).
  Name the rung in new code.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **`track` is removed.** The slider rail, progress track, skeleton and every well are
  `surface-1`; the switch off-track is `surface-3`, the pressed rung. Three alpha roles are removed
  with it, because the ladder is now the one hover mechanism and nothing references them:
  `--alpha-fill-hover` (the secondary button's `/80` opacity dim), `--alpha-input-hover` (the dark-only
  input hover wash) and `--alpha-surface-subtle` (the outline button's hover tint, now `--alpha-hover`
  in the family's own hue).
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

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

### Patch Changes

- [#59](https://github.com/vegastack/vegastack-design/pull/59) [`065315d`](https://github.com/vegastack/vegastack-design/commit/065315d56e23fd33614f6c9e9a9965f166c063e1) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Text on the soft media scrim is gated at AA** — `media-foreground` on `media-scrim` was
  checked only against the 3:1 non-text floor while the token contract permitted labels on it, so the
  contract was wider than its enforcement. The pair is now gated at 4.5:1; it measures 5.22:1 over the
  white worst case, so nothing moves today and a future scrim retune that thins it under AA fails the
  build instead of silently demoting its labels. The `media-scrim`, `media-scrim-strong` and
  `media-foreground` descriptions state where text is allowed and which floor enforces it. No token
  value changes.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`65975e1`](https://github.com/VegaStack/vegastack-design/commit/65975e1)

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

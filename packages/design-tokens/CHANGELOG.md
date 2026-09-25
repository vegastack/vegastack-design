# @vegastack/design-tokens

## 0.7.18

### Patch Changes

- [#255](https://github.com/vegastack/vegastack-design/pull/255) [`283057d`](https://github.com/vegastack/vegastack-design/commit/283057db0d97a549f5194a46054e6b4830b89f61) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 List toolbars, tables and focus: FilterBar puts search (~320px) left and a Filters (n) toggle, scope Tabs and the view switch right, with compact rounded-md filter chips (tinted when set, a fixed 24px ×, "Status: 2") on a toggled row 12px below that scrolls sideways on a phone (the bottom sheet is gone); new DateRangeFilter with presets; SearchableSelect ticks async options and gains a person option (name plus muted email, both searched); DataList adds sortable columns with an indicator, `compare`/`sortFirst`/`sortMode`, a standard `rowActions` ⋯ column (32px, always last), un-underlined row links, and `noResults`; Empty always renders an icon; TabsList gains `size="sm"`; buttons inside a status Alert hover in the family's own tint; Dialog and Sheet open onto the first field, never the ×; and no focus rings anywhere except Tabs — keyboard focus is a subtle background tint (a border tint on text entry).

## 0.7.1

### Patch Changes

- [#181](https://github.com/vegastack/vegastack-design/pull/181) [`72741b7`](https://github.com/vegastack/vegastack-design/commit/72741b760a741ab3c782ba78ee25e1b44b996a66) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The reduced-motion comment in `base.css` now states the `!important` rule precisely: the reset is the only hand-written `!important` in the token CSS, and Tailwind's `!` modifier in component class strings is a separate, counted allowance in `design-lint`.

  No token value, selector or rule changed — this is a documentation correction inside the shipped stylesheet.

## 0.7.0

### Minor Changes

- [#169](https://github.com/vegastack/vegastack-design/pull/169) [`76fa8d3`](https://github.com/vegastack/vegastack-design/commit/76fa8d3171a81226dd2bfd29ba676a699353e8e6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Typography: a global Geist-spec ramp replaces per-component type decisions

  The system had no typography contract at all — the shadcn reset resolved TYP-1…TYP-9 and TYP-11 as
  **shadcn**, which left every size, weight, line-height and letter-spacing to Tailwind's stock values
  plus 229 local decisions across 112 component files. Nothing was globally declared, and nothing
  carried letter-spacing at any size.

  Four new decisions (MK, 2026-09-22), all declared once and inherited everywhere:

  - **TYP-15 — heading-tier optical metrics.** At `text-lg` and above, line-height and letter-spacing
    follow Geist's heading spec, declared as per-size `--text-*--line-height` and
    `--text-*--letter-spacing` in the `@theme inline` bridge. Tracking runs −0.012em at 18px to
    −0.06em at 72px. Geist's copy tier carries zero letter-spacing, and this system's body sizes are
    its copy tier, so `text-xs`/`text-sm`/`text-base` are untouched and render byte-identically.
    SIZES do not move, so TYP-1 stays **shadcn** and a pasted shadcn snippet still renders at
    upstream's size.
  - **TYP-16 — Geist rendering.** `-webkit-font-smoothing: antialiased` on `body`. Geist is drawn for
    it; without it the same weight renders heavier and softer than the identical weight elsewhere.
  - **TYP-17 — a declared 14px default body size**, on `body` and never on `html`. `rem` resolves
    against the root, so an `html` size would rescale every token and override the reader's browser
    font-size preference. Previously unclassed text fell back to 16px while components were 14px.
    The docs shell keeps its 16px reading size.
  - **TYP-18 — no arbitrary font size.** Upstream's `text-[0.8rem]` (`button` sm, `toggle` sm,
    `calendar`) and `text-[0.625rem]` (`questionnaire`) now sit on the ramp. Upstream's ladder does
    scale type with control size and is KEPT — the `sm` half-step resolves down to `text-xs` rather
    than flattening up to 14px.

  Also enforced: **TYP-10** ("tabular figures on code and data") had been **ours** since the reset
  with no gate at all, and `number-field` shipped proportional digits whose value jittered on every
  stepper press. It now carries `tabular-nums`, and three new `design-lint` rules — `raw-tracking`,
  `arbitrary-text-size` and `tabular-figures` — hold all of the above, each with negative-specimen
  coverage in `verify-design-lint-structural`.

  Block heading weight is normalised to `font-semibold`; chart figure labels keep `font-bold`.

  **Markdown surfaces.** `prose.root` never declared a font family, and neither of its two consumers
  (`MarkdownView`, `TextEdit`) sets one — so prose inherited whatever surrounded it, and inside any
  mono container the whole tree rendered in Geist Mono: headings, paragraphs, table cells, and the
  `1.` / `2.` markers of an ordered list, since `::marker` inherits font properties from its element.
  The recipe now declares `font-sans`, making mono the exception it names explicitly (`code`, `pre`,
  `pre code`) rather than something prose falls into by accident.

  **No uppercase, anywhere.** `design.md` § Voice & content has always said sentence case for
  everything and TYP-7 resolves as **shadcn** ("No uppercase"), but twelve `font-mono text-xs
uppercase tracking-wide` eyebrows had survived across the docs shell, plus the `terminal` and
  `code-block` header labels and the OG card. Two were a correctness bug rather than a style one: the
  home page rendered real CSS custom-property names through the transform, so `--text-lg` displayed
  as `--TEXT-LG`. All of it is removed and gated by a new `uppercase-transform` rule, which bans the
  CSS transform rather than uppercase text — if a string is uppercase, write it that way. That also
  removed the only justification for positive `tracking-*`, which existed to make uppercase legible,
  so `raw-tracking` now allows `tracking-widest` alone (the menu shortcut hint). `code-block` now
  shows `tsx` as given instead of `TSX`, and `terminal` shows `Terminal`.

  The principle applied throughout: **mono is for code, uppercase is for nothing** — content that is
  code keeps `font-mono`, content that is language is `font-sans` in sentence case.

  **The docs site.** Fumadocs' `.prose` writes `font-size` directly rather than through a utility, so
  its headings tracked the ramp's sizes but never its letter-spacing, `h1` rendered at weight 800
  (`h1 strong` at 900) and `h3` at 1.6 leading. All four now reference the ramp variables at weight 600. Two arbitrary sizes baked into Fumadocs' own class strings — 15px on the sidebar, tabs and
  accordion, 13px on code blocks — are pulled onto `--text-sm`, putting every piece of docs chrome at
  the same 14px as the product layer. Prose body stays 16px; it is a reading surface.

## 0.5.0

### Minor Changes

- [#151](https://github.com/vegastack/vegastack-design/pull/151) [`72ae827`](https://github.com/vegastack/vegastack-design/commit/72ae827666bc9b03cd6d197e27cd3e0ec9ee0044) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **The shadcn `base-nova` reset — the token contract is shadcn `base-nova`'s `neutral` base plus our recorded additions, and every deleted family is gone with no alias.**

  94 resolved tokens per theme, down from 185. **Deleted:** the surface ladder
  (`--surface-1/2/3`), the 19-entry `--alpha-*` ladder, the `--opacity-*` ladder,
  `--size-*`, `--icon-*`, `--panel-width-*`, `--layout-*`, `--z-*`, `--shadow-overlay`, `--radius-xs`,
  `--radius-sharp`, `--overlay`, `--muted-foreground-faint`, `--font-family-pixel`, the whole role and
  display type scale (`text-h1`…`text-h4`, `text-label*`, `text-code*`, `text-mono-label`,
  `text-display-*`), and every `-subtle`/`-hover`/`-active` step on the four STATUS families (the ten
  `--tag-*` trios keep theirs). Each is now a plain Tailwind
  utility. **Kept and ours:** the four status families in upstream's own `destructive` shape — each with
  a `-foreground` ink for the solid fill and a `-text` ink for the page and the family's own tint — the
  8-hue chart palette plus `--chart-single`, the 10-hue tag palette, the brand pair, the media trio, the
  Geist families, and the `--duration-*`/`--motion-ease-*` pairs behind the `motion-*` utilities.

  **Who this affects:** every consumer, including ones that never touched a component. A deleted token
  compiles to nothing rather than failing, so a page keeps rendering and quietly looks wrong. The
  searches that find every holdover, and the write-instead table for each family, are
  the migration guide §§ 3–5 and § 11.

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

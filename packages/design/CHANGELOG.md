# @vegastack/design

## 0.4.0

### Minor Changes

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Animated icons** — the reduced-motion effect ran after _every_ render in all 439 icons,
  because it was written without a dependency array. It now runs when the preference changes, once, in
  the factory.
  [docs](https://design.vegastack.com/docs/foundations/icons)

- [#57](https://github.com/vegastack/vegastack-design/pull/57) [`f1d7d2f`](https://github.com/vegastack/vegastack-design/commit/f1d7d2fbc5f9c52aa13ff9ddfc869cb71c6ae163) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 **Animated icons are one factory plus 439 data modules.** Every mirrored `lucide-animated`
  icon used to carry its own copy of the controller — the animation controls, the reduced-motion gate,
  five pointer/focus handlers, the imperative handle and a block-level host — so a change to any of
  that meant regenerating 439 files and trusting that all 439 agreed. The controller now lives once in
  `createAnimatedIcon`, exported from the new `@vegastack/design/create-animated-icon` subpath, and
  each icon is a `createAnimatedIcon({ … })` call describing only its geometry, its Motion variants,
  and (for 49 icons) its non-default start/stop steps. `motion` becomes an OPTIONAL peer dependency —
  only an animated icon pulls it in, so `Icon`/`BrandIcon` consumers are unaffected. The corpus went
  from 79,078 lines to 12,951 (-84%) and from 2.06 MiB to 0.57 MiB of source; the served registry fell
  from 4.48 MiB to 2.92 MiB. `tooling/mirror-animated-icons.mjs` emits the data modules and fails
  closed on any upstream archetype it cannot model; `tooling/verify-animated-icons.mjs` asserts the
  controller contract once against the factory, holds every module to a schema whose central clause is
  that a data module contains no controller at all, pins each generated module by SHA-256 in
  `packages/ui/animated-icon-sources.json` so a hand-edited path or timing value is rejected outright,
  and carries a `--self-test` that proves seventeen distinct regressions are rejected.
  [docs](https://design.vegastack.com/docs/foundations/icons)

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Animated icons** — the host element is now an `inline-flex` `<span>` rather than a
  block-level `<div>`, so an icon placed in a line of text no longer breaks the line box, and
  `AnimatedIconComponent` types its host as `HTMLSpanElement`. Reduced motion is now a live
  subscription to `(prefers-reduced-motion: reduce)`, so turning the preference on settles every
  mounted icon immediately instead of only affecting icons mounted afterwards. Motion's own hooks
  cannot do this: in 12.42.2 `useReducedMotion()` is `useState(prefersReducedMotion.current)` — a
  one-shot read of a module singleton captured at first import, with a standing `TODO` about not
  updating — and `useReducedMotionConfig()` layers `<MotionConfig>` on that same one-shot value. Worse,
  the OS preference was never consulted at all unless the application happened to mount a
  `<MotionConfig>`: `useReducedMotionConfig()` returns `false` outright when the context says
  `reducedMotion: "never"`, and `"never"` is precisely Motion's **default** context value. The factory
  now treats the preference as the base value and lets `<MotionConfig reducedMotion="always">` add
  reduction on top; the override is one-way, because an explicit `reducedMotion="never"` is
  byte-identical to no provider at all and honouring it would switch reduced motion off for everyone
  who configured nothing. Public icon names, the `size` prop and the `startAnimation`/`stopAnimation`
  handle are unchanged.
  [docs](https://design.vegastack.com/docs/foundations/icons)

- [#95](https://github.com/vegastack/vegastack-design/pull/95) [`452df99`](https://github.com/vegastack/vegastack-design/commit/452df99a039dc145a801deb9b548458bb993ad41) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📦 **Five mechanical dependency majors.** `motion` 12.42.2 → 13.2.0 (its only import site is the
  animated-icon factory; the 13.0 removal of the optional `@emotion/is-prop-valid` dependency does not
  apply — no CSS-in-JS library wraps a `motion` component here — and `useReducedMotion()` is still the
  one-shot `useState` read the factory deliberately replaces with a live `useSyncExternalStore`
  subscription). `react-dropzone` 19.1.1 → 20.1.1, whose only breaking change is a Node 22 floor
  (this repo pins Node 24.20.0). `@atlaskit/pragmatic-drag-and-drop` 2.0.1 → 3.1.0 plus `-hitbox`
  2.0.0 → 2.2.0, whose 3.0.0 renamed every entry point: `use-drag-reorder` now imports from
  `/adapter/element-adapter`, `/utils/combine`, `/closest-edge/attach-closest-edge`,
  `/closest-edge/extract-closest-edge` and `/types` rather than the deprecated compatibility shims.
  `@testing-library/jest-dom` 6.9.1 → 7.0.1, which makes `@testing-library/dom` a required peer — now
  declared explicitly at 10.4.1. `globals` 16.5.0 → 17.12.0, whose 17.0.0 split the `audioWorklet`
  environment out of `browser`; the shared ESLint config uses `browser` + `node` only. Behaviour of
  the drag keyboard layer, the live-region announcements, the "Move to…" menu equivalents and the
  paste-acquisition path is unchanged — all of it is ours, not the engines'.
  [docs](https://design.vegastack.com/docs/components/board)

- [#55](https://github.com/vegastack/vegastack-design/pull/55) [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`surfaceInteractive` and `fillInteractive`** — the two hover/pressed recipes, exported
  from `@vegastack/design` so no component writes a `hover:bg-*` literal again. `surfaceInteractive`
  (`hover:bg-surface-2 active:bg-surface-3`) is for a control on a known ladder surface;
  `fillInteractive.<tone>` (`hover:bg-<tone>/(--alpha-hover) active:bg-<tone>/(--alpha-pressed)`) is
  for one on an unknown backdrop or hovering in its own hue. The `FillTone` type ships with them.
  [docs](https://design.vegastack.com/docs/foundations/colors)

- [#116](https://github.com/vegastack/vegastack-design/pull/116) [`02ba364`](https://github.com/vegastack/vegastack-design/commit/02ba364991737f7a8222fd6007790269d1e7102f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Four controls shipped with utilities silently destroyed, and a `Field > Textarea` was
  unlabelled.** In five places two adjacent class-string literals were concatenated with no
  separating space, so JavaScript welded them into one word and the utility on _both_ sides of the
  seam vanished. The **Switch had no track colour in either state** — measured
  `background-color: rgba(0, 0, 0, 0)` and `padding: 0px` unchecked _and_ checked, with on/off
  conveyed only by thumb position on a `background`-coloured thumb; only a hovered checked switch
  painted, so the control appeared under the cursor and nowhere else. The switch thumb ran on
  Chromium's default curve instead of `--motion-ease-standard`; a focused **OTP** slot wore the global
  2px focus ring that text entry exists to suppress; and the **NumberField** steppers rendered at full
  `--foreground` with no hover step. All four are repaired, and `design-lint` gained a structural
  `class-glue` rule that rejects the seam at the AST — the existing rules read one literal at a time
  and could not see it, which is why `transition-pairing` passed on an element with no ease token.

  `<Field label="…"><Textarea /></Field>` produced a textarea with no `id`, no `aria-labelledby`, no
  `aria-describedby` and no `aria-invalid`: the `<label for>` pointed at nothing, the error message was
  not linked, and axe reported `label` at **critical**. `Textarea` now renders through Base UI's
  `Field.Control`, like every sibling control, so the wiring and the destructive border tint arrive
  automatically. Standalone use is unchanged.

  Also fixed: `aria-invalid` was accepted and inert on a standalone `OTPInput` (it landed on the root,
  never on the slots) and on a standalone `NumberField` (the group's `:has()` selector cannot match the
  group's own attribute); a read-only `EditableCell` with a `select` editor rendered the raw stored
  value where the editable cell rendered the option label; and a `borderless` `Field` showed no resting
  border when invalid.
  [docs](https://design.vegastack.com/docs/components/switch)

- [#67](https://github.com/vegastack/vegastack-design/pull/67) [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📦 **`@vegastack/design` exports the field-chrome recipes.** `fieldControl` and `fieldControlGroup`
  are the one border/hover/focus/invalid/disabled grammar every text-entry control wears, so Input,
  Textarea, NumberField, OTP slots, the Select trigger, the Combobox input and ChipInput can stop
  keeping private copies of it. Three border rungs and no more: `border-input` at rest, the neutral
  `--alpha-border-subtle` ink on hover, the `ring` tint on focus. Hover is guarded by `not-disabled:`
  because a disabled control keeps its pointer events so a Tooltip can explain it. Every element
  wearing the wrapper recipe must also carry a bare `data-field-group` attribute — that is what
  `@vegastack/design-tokens`' `base.css` hooks to paint the forced-colours focus outline on the group,
  whose `overflow-hidden` would otherwise clip the inner input's own.

  Also `surfaceInteractiveGroup` — the group-scoped twin of `surfaceInteractive`, for the one geometry
  where the two ladder rungs cannot sit on the interactive element itself: a wash painted by an inner
  chip inset from a container hairline (NumberField's ± steppers). The rungs stay written once.
  [docs](https://design.vegastack.com/docs/components/input)

- [#107](https://github.com/vegastack/vegastack-design/pull/107) [`cff5ccb`](https://github.com/vegastack/vegastack-design/commit/cff5ccb0c71af274c3607047ba1dc56247f4251b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Text-entry focus** — a text field's border is its only focus channel, and two other states were
  taking it. An `aria-invalid` field kept its destructive border when focused, and a `Field borderless`
  control kept its transparent one, so both showed **no focus indicator at all** (WCAG 2.2 §2.4.7). The
  invalid tint in `fieldControl` / `fieldControlGroup` and on TextEdit's container now stands down on
  `focus`/`focus-within`, `borderless` flattens only while unfocused, and `Input`'s `outline-hidden` —
  lost to a missing space in a string concatenation — applies again. The focus tint is now contrast-gated
  as the composite users actually see: 4.04–4.51:1 light, 6.31–7.72:1 dark.
  [docs](https://design.vegastack.com/docs/components/input)

- [#64](https://github.com/vegastack/vegastack-design/pull/64) [`2a3fc24`](https://github.com/vegastack/vegastack-design/commit/2a3fc24196b2a94171bce34478cd18a792bdc550) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📦 **`@vegastack/design`** — exports the `prose` recipe — one token vocabulary for rendered rich text, so a surface the system
  did not author element by element (markdown, a contenteditable, CMS copy) is styled by one class on
  its root. `proseClassName` is the whole recipe; `prose` is the per-element record it composes from,
  keyed by the `ProseElement` type.

  It is expressed as descendant variants (`[&_h1]:…`) because neither consumer can put a class on the
  elements — ProseMirror owns the editor's DOM, and react-markdown's output is reachable only through
  an override map — and because an element-level class silently LOSES the cascade to a root-level
  descendant rule (specificity (0,1,0) against (0,1,1)). Restyle prose by composing `prose`, never by
  setting a class on the rendered element.

- [#74](https://github.com/vegastack/vegastack-design/pull/74) [`3663f8f`](https://github.com/vegastack/vegastack-design/commit/3663f8fa197880148f7e8d63be5dd42d678e206b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📦 **`@vegastack/design` exports `mergeRefs`** — fan one DOM node out to several refs (a forwarded
  `ref` prop plus one or more internal refs) as a single ref callback, handling both shapes React 19
  accepts and skipping `null`/`undefined` entries. It was exported from the `use-animation-replay`
  registry item, an odd home for it, while nine registry files hand-inlined the same
  `typeof ref === "function"` merge; ref-as-prop makes "the component needs the node AND has to forward
  it" the normal case, so it belongs in the package. Typed against React's ref shapes with a type-only
  import, so the entry stays server-safe.

- [#73](https://github.com/vegastack/vegastack-design/pull/73) [`fdaed05`](https://github.com/vegastack/vegastack-design/commit/fdaed057ba85871fe99849a2cdaea0bdc3d5ee14) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📦 Exports `selectedChipVariants` — the one "raised chip on a muted track" recipe, shared by Tabs
  `pill`/`chip`, `Segmented`, and pressed `Toggle`/`ToggleGroup`, which had drifted into four
  different selected looks (`bg-background`, `bg-secondary` plus a hairline, `bg-foreground/10`). The
  track is `surface-1`; the chip is the pressed/selected rung in its alpha form
  (`bg-foreground/(--alpha-ink-tint)`), which is what lets a SELECTED chip keep stepping — it
  strengthens on hover and drops back to the resting tint on press. Ships as `track`, `item`, and two
  state literals: `pressed` (Base UI `data-pressed`) and `active` (Base UI `data-active`).
  [docs](https://design.vegastack.com/docs/components/tabs)

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

- [#118](https://github.com/vegastack/vegastack-design/pull/118) [`78ed487`](https://github.com/vegastack/vegastack-design/commit/78ed48741747429211c1ab3a25f914fe348ae076) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 **The `input` and `textarea` summaries no longer promise a focus ring they never had.** Both
  text-entry controls signal focus with a border tint, not an outline — that is the rule in
  [Accessibility](https://design.vegastack.com/docs/foundations/accessibility) and it is what the
  shared field recipe implements — but `component-contracts.json`, the machine authority that feeds
  the shipped design-system skill, still described "a focus-visible ring" for each. Both summaries are
  corrected, so an agent reading the packaged skill roster is told what the components actually do.
  The other 114 component summaries were audited for the same class of claim and hold.

  Doctrine, in the same pass: `react-markdown` and `remark-gfm` are now sanctioned renderer engines
  rather than an undocumented exception, and two version decisions are written down with their
  evidence — TypeScript stays at 6.0.3 while no shipped `typescript-eslint` supports TypeScript 7, and
  `tw-animate-css` stays bundled in `preset.css` because it is consumer-facing API that
  [Quickstart](https://design.vegastack.com/docs/guides/quickstart) and
  [Troubleshooting](https://design.vegastack.com/docs/guides/troubleshooting) both document.

- [#60](https://github.com/vegastack/vegastack-design/pull/60) [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 **The shipped design-system skill** is refreshed for Button's `variant × tone` matrix, the
  single `xs · sm · md · lg` size vocabulary, and `IconButton` as the only icon-only path. No runtime
  code changed.
  [guide](https://design.vegastack.com/docs/guides/agent-skills)

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

- [#75](https://github.com/vegastack/vegastack-design/pull/75) [`45cde26`](https://github.com/vegastack/vegastack-design/commit/45cde26d287595d2a0d4d2413320d004badd1f0d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 `registry:lib` files are now modeled as shadcn-transformed in the shipped consume verifier. `shadcn
add` removes a JS/TS file's entire leading comment prologue as it writes it, for every file type it
  touches — but `verify-registry-item.mjs` listed only `registry:ui`, `registry:hook`, `registry:page`
  and `registry:component`, so the first `registry:lib` items (`geo-data`, `drag-item`) compared the
  copy-in against unstripped source and failed post-write verification with a line-count mismatch —
  i.e. the gate reported a TOCTOU signal for a transform the CLI is sanctioned to perform.
  `check-updates` reads the same set, so its diffs were affected identically.
- Updated dependencies [[`42aa455`](https://github.com/vegastack/vegastack-design/commit/42aa455b00d1a50bb919ecfb7112a1e4f8c5d244), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`065315d`](https://github.com/vegastack/vegastack-design/commit/065315d56e23fd33614f6c9e9a9965f166c063e1), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd), [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64), [`18e2208`](https://github.com/vegastack/vegastack-design/commit/18e22087c75bdd116554c9cf85523d4be20c7b61), [`2a3fc24`](https://github.com/vegastack/vegastack-design/commit/2a3fc24196b2a94171bce34478cd18a792bdc550), [`d5e2de2`](https://github.com/vegastack/vegastack-design/commit/d5e2de2b3ea2f3e74bab8548b0a5e9fd1d4a1d99)]:
  - @vegastack/design-tokens@0.4.0

## 0.3.2

### Patch Changes

- [#26](https://github.com/vegastack/vegastack-design/pull/26) [`43eb359`](https://github.com/vegastack/vegastack-design/commit/43eb359a9157bce16a361ba929a8bf68e05d44e7) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Update the shipped Audio Player skill reference to describe the new single-line transport with skip controls and a tappable speed control.

## 0.3.1

### Patch Changes

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Sync the shipped component-roster skill reference with the two new registry components (AudioPlayer, VideoPlayer), the ProgressIndicator value-variant description, and the updated registry counts.

## 0.3.0

### Minor Changes

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`9d0a2ef`](https://github.com/vegastack/vegastack-design/commit/9d0a2efae46de237bf1a9f54a99bdebc4badc840) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Add `vegastack-design doctor`, and stop the drift gate failing open.

  **`doctor`** — a read-only setup check for consuming projects. It verifies the package is
  installed, `preset.css` is imported, the Tailwind PostCSS plugin is configured, Tailwind is not
  imported twice, the `@vegastack` registry is declared, and (in a workspace) that `@source`
  directives are present. Understands monorepo layouts: it looks for the PostCSS config in the
  package that owns the preset-importing stylesheet, and walks up for `components.json`.

  Motivated by a real consumer failure. A missing `@tailwindcss/postcss` plugin has two misleading
  symptoms and no obvious cause: under Turbopack the build dies with `Can't resolve 'tw-animate-css'`,
  naming a dependency that is installed and fine; under webpack the build **succeeds** with the token
  theme applied and **zero utility classes generated**, which reads as "the design system is broken".

  **`check-updates --fail-on-update` now exits 1 when it finds zero components.** It previously exited
  0, so any project whose components sit outside the default path — every monorepo — got a
  permanently green CI drift gate that scanned nothing. Zero components under an explicit gate is a
  misconfiguration, not a clean bill of health. Without the flag the behaviour is unchanged, since
  "no components yet" is legitimate mid-setup.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`630ca84`](https://github.com/vegastack/vegastack-design/commit/630ca84084199e75c5a0a80184aa726552070994) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Refresh the shipped `vegastack-design-system` skill for the 0.4.0 component wave: the roster now
  covers 108 components, 6 hooks, and 554 registry items — including the new ActionBar, ChipInput,
  EditableCell, FilterBuilder, NumberField, ShortcutOverlay, Stepper, Timeline, SortableList, Board,
  Dropzone, and DataGrid, plus the useListNav, usePlatform, useDragReorder, and useFileDrop hooks.
  Without a `@vegastack/design` release the npm-shipped skill would keep describing the 0.2.0-era
  roster (104 components / 548 items) while the registry serves the new one.

### Patch Changes

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`6633fc8`](https://github.com/vegastack/vegastack-design/commit/6633fc866bf50eb6b0501ab46503437e3ee2864e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - The bundled design-system skill now documents the Button-as-link pattern: compose the anchor via
  `render` and pass `nativeButton={false}`, matching Base UI's native-button contract.

## 0.2.0

### Minor Changes

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Ship the VegaStack agent skills to consumers and add a `skills` subcommand to install them.

  `npx vegastack-design skills install` writes the four public skills — `vegastack-design-system`,
  `vegastack-consume`, `vegastack-design-audit`, and `vegastack-brand` — into both `.claude/skills/`
  (Claude Code) and `.agents/skills/` (Codex). The skills are bundled in this package, so installing
  them needs no registry credentials and no repository access; external and client projects stay
  tokenless.

  The installer is safe by default: it never overwrites an existing file that differs without
  `--force`, never writes through a symlink, and aborts the whole run on any conflict rather than
  leaving a half-installed set. `--claude`/`--codex` select a single surface, `--dir` targets another
  project root, and `--dry-run` reports the plan without writing. `vegastack-design skills list` shows
  what a given version bundles.

  The design-system skill's component roster is generated from the design system's own component
  contract, so it cannot drift from the components that actually exist.

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Publish the unified VegaStack design doctrine as generated DTCG-backed `design.md` data, add the
  named strong-type and effect roles, keep dark and marketing themes in exact parity, and normalize
  animated icons to React 19 ref props with intrinsic reduced-motion behavior.

  Add the `@vegastack/design/theme-scope` subpath for the `@internal` portal theme-scope plumbing.
  It is a client module (module-scope `React.createContext`), so it is deliberately NOT re-exported
  from the root entry — the root stays importable from a React Server Component, which is what every
  server-safe component relies on when it imports `cn`.

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - **Breaking (both packages — `minor` is the breaking position pre-1.0).** Two changes here alter
  existing behaviour and were previously filed as `patch`, which would have broken consumers on an
  upgrade they had no reason to review:

  - `vegastack-design verify --post-write` now **requires** `--expected-integrity <sha256-base64>`,
    a flag that did not exist before. Any existing consumer CI step invoking `--post-write` with just
    `--item`/`--target-dir` now exits 2. Take the value from the pre-write run, which prints the exact
    integrity-pinned command to use.
  - `MarkdownView` images are **same-origin by default**. Remote `<img>` sources previously rendered
    unconditionally and are now dropped unless their origin is listed in the new `allowedImageOrigins`
    prop. Consumers rendering markdown that references remote images must opt those origins in.

  Constrain registry credentials and copied-file verification to trusted origins and contained paths,
  pin post-write checks to a digest retained before copy-in, match shadcn's inherited TypeScript alias
  resolution, and make Markdown images same-origin by default with an explicit remote-origin allowlist.

  Refuse to place credential material in a registry URL, and redact it from CLI output. The
  trusted-origin check only inspected request HEADERS, so a `components.json` registry entry such as
  `"@vegastack": "http://host/r/{name}.json?k=${CF_ACCESS_CLIENT_SECRET}"` declared no headers, skipped
  the check entirely, and sent the Cloudflare Access service token to an arbitrary origin over plain
  http — while `check-updates` exited 0. The token was also echoed verbatim into stderr, and therefore
  into CI logs. Credentials now must travel as headers: a URL is recorded in server access, proxy and
  CDN logs even when the origin is fully trusted, so the refusal is unconditional rather than
  origin-scoped. Applied identically in `check-updates`, `verify`, and the shared internal helper so
  the three do not diverge on this boundary. Uncredentialed registries (including plain-http localhost
  mirrors) are unaffected.

### Patch Changes

- Updated dependencies [[`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f)]:
  - @vegastack/design-tokens@0.2.0

## 0.1.1

### Patch Changes

- [`9532d42`](https://github.com/vegastack/vegastack-design/commit/9532d4295807dd4f37ddefb514641249e1002911) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - `tw-animate-css` is now a regular dependency (was an optional peer): `preset.css` hard-imports
  it, so a fresh pnpm consumer's build failed with "Can't resolve 'tw-animate-css'" the moment it
  imported `@vegastack/design/preset.css`. Found by the reference starter's first build.

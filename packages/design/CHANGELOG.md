# @vegastack/design

## 0.4.0

### Minor Changes

- [#77](https://github.com/vegastack/vegastack-design/pull/77) [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Animated icons** — the reduced-motion effect ran after _every_ render in all 439 icons,
  because it was written without a dependency array. It now runs when the preference changes, once, in
  the factory.
  [docs](https://design.vegastack.com/docs/foundations/icons) ·
  [`cb20de9`](https://github.com/VegaStack/vegastack-design/commit/cb20de9)

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
  and carries a `--self-test` that proves fifteen distinct regressions are rejected.
  [docs](https://design.vegastack.com/docs/foundations/icons) ·
  [`cb20de9`](https://github.com/VegaStack/vegastack-design/commit/cb20de9)

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
  [docs](https://design.vegastack.com/docs/foundations/icons) ·
  [`cb20de9`](https://github.com/VegaStack/vegastack-design/commit/cb20de9)

- [#55](https://github.com/vegastack/vegastack-design/pull/55) [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **`surfaceInteractive` and `fillInteractive`** — the two hover/pressed recipes, exported
  from `@vegastack/design` so no component writes a `hover:bg-*` literal again. `surfaceInteractive`
  (`hover:bg-surface-2 active:bg-surface-3`) is for a control on a known ladder surface;
  `fillInteractive.<tone>` (`hover:bg-<tone>/(--alpha-hover) active:bg-<tone>/(--alpha-pressed)`) is
  for one on an unknown backdrop or hovering in its own hue. The `FillTone` type ships with them.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

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

### Patch Changes

- [#60](https://github.com/vegastack/vegastack-design/pull/60) [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 **The shipped design-system skill** is refreshed for Button's `variant × tone` matrix, the
  single `xs · sm · md · lg` size vocabulary, and `IconButton` as the only icon-only path. No runtime
  code changed.
  [guide](https://design.vegastack.com/docs/guides/agent-skills)
- Updated dependencies [[`42aa455`](https://github.com/vegastack/vegastack-design/commit/42aa455b00d1a50bb919ecfb7112a1e4f8c5d244), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`065315d`](https://github.com/vegastack/vegastack-design/commit/065315d56e23fd33614f6c9e9a9965f166c063e1), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`9c33dfa`](https://github.com/vegastack/vegastack-design/commit/9c33dfaf6fa8c38dc2e1e009620ecb06d86dc4ff), [`7915a71`](https://github.com/vegastack/vegastack-design/commit/7915a71edd32c5038e08145fb4e8192fef1f9098), [`8ce8de4`](https://github.com/vegastack/vegastack-design/commit/8ce8de4d8b45936c44023e6d3cd39e7494db48cd), [`9fbeb65`](https://github.com/vegastack/vegastack-design/commit/9fbeb655379d401a1479212671073bafc7978f64)]:
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

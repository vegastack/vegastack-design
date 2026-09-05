# @vegastack/design

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

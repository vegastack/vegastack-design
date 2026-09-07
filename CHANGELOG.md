# Changelog

All notable changes to VegaStack Design, versioned by the **design-system (registry) version**
— the version every registry item carries. npm package versions are listed per entry under
**📦 npm**. Sections use a fixed vocabulary (enforced by `tooling/changelog-lint.mjs`):
`🧩 New components` · `🔧 Changed components` · `🗑 Removed / renamed` · `🛠 CLI & tooling` ·
`📦 npm` · `📚 Docs` · `🐛 Fixed` · `⚠️ Breaking`.

The docs [Changelog page](https://design.vegastack.com/docs/changelog) is **generated from this
file** by `tooling/sync-changelog.mjs` — edit here, never there.

## [0.7.0] — September 7, 2026

### ⚠️ Breaking

- **Surface tokens are now one ladder.** `secondary`, `muted` and `accent` were a single OKLCH
  value under three names, so no hover or pressed state could be seen on a card. They are now
  **aliases** of ladder rungs and have no independent values: `secondary` = `muted` = `surface-1`,
  `accent` = `sidebar-accent` = `surface-2`, `sidebar` = `card`, `sidebar-border` = `border`,
  `sidebar-ring` = `ring`. Existing `bg-muted` / `bg-accent` / `bg-sidebar-*` utilities keep
  compiling and keep their rest appearance; only `accent` moves (one rung darker, because it is the
  hover rung). Name the rung in new code.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)
- **`track` is removed.** The slider rail, progress track, skeleton and every well are `surface-1`;
  the switch off-track is `surface-3`, the pressed rung.
  Three alpha roles are removed with it, because the ladder is now the one hover mechanism and
  nothing references them: `--alpha-fill-hover` (the secondary button's `/80` opacity dim),
  `--alpha-input-hover` (the dark-only input hover wash) and `--alpha-surface-subtle` (the outline
  button's hover tint, now `--alpha-hover` in the family's own hue).
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)
- **Light cards are page-coloured.** `card` was `oklch(0.985)` against a `0.994` page — a grey slab
  no reference system draws. It is now the page colour, separated by the hairline alone; dark keeps
  its one-step lift. `popover` is `card` in both themes.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)
- **`border` and `input` are translucent.** `border` is derived as `foreground` at `--alpha-border`
  (8% light / 14% dark) so one hairline reads on the page, on a card, inside a well and on a dark
  band. Anything that assumed an opaque border value should read the variable instead.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

### 🔧 Changed components

- **Button**, **Select**, **Sidebar**, **Toggle**, **Tabs**, **Table**, **DataGrid**, **DataList**,
  **Board**, **Item**, **Pagination**, **NavigationMenu**, **Combobox**, **DatePicker**, **Dialog**,
  **Sheet**, **Popover**, **HoverCard**, **Segmented**, **TagGroup**, **Bubble**, **Card**,
  **AppShell**, **EmojiPicker**, **FieldInline**, **MessageScroller**, **NumberField**,
  **OnboardingChecklist**, **ShortcutOverlay**, **Sonner**, **Switch**, **ToolCallChip** and the
  **dashboard-01** block — every hover now climbs one rung and **every control has a pressed
  step**. Previously only the solid primary Button darkened on `:active`; a state probe found 268
  elements where pressing changed nothing. Select's trigger hovered only in dark mode; it now
  hovers in both. The current sidebar row rests on `surface-3` so hovering it still moves.
  [docs](https://design.vegastack.com/docs/components/button) ·
  [`273a602`](https://github.com/VegaStack/vegastack-design/commit/273a602)
- **ComparisonMatrix**, **PricingSection** — the promoted column and the highlighted plan used
  `info` (blue). `info` is links and informational UI only; promotion is a neutral ladder rung.
  [docs](https://design.vegastack.com/docs/components/comparison-matrix) ·
  [`273a602`](https://github.com/VegaStack/vegastack-design/commit/273a602)

### 🐛 Fixed

- **Text-entry focus under forced colours** — Input, Textarea, NumberField, OTPInput and TextEdit
  signal focus with a border tint and `outline-none`. Windows High Contrast replaces `border-color`
  outright, so a focused field showed no indicator at all. The token layer now paints a real
  `2px` outline under `forced-colors: active`, once, for every text-entry control.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`273a602`](https://github.com/VegaStack/vegastack-design/commit/273a602)
- **Media chrome no longer inverts in dark** — the video scrim and its controls were built from
  `primary`, which flips with the theme, so in dark the scrim rendered near-white with near-black
  icons. New theme-invariant `--media-scrim`, `--media-scrim-strong` and `--media-foreground`
  tokens keep overlay chrome dark-scrim + light-ink in both themes.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)

### 📦 npm

- **`@vegastack/design-tokens`** → **`0.4.0`** — the surface ladder (`surface-1/2/3`), the alpha
  twins `--alpha-hover` / `--alpha-pressed` / `--alpha-border`, theme-invariant media tokens,
  `--chart-single`, and the layout scale `--layout-header-height` / `--sidebar-width-mobile` /
  `--layout-overlay-max-height` / `--panel-width-sm|md|lg`.
- **`@vegastack/design`** → **`0.4.0`** — exports the `surfaceInteractive` and `fillInteractive`
  hover/pressed recipes, plus the `FillTone` type.
- The design-system registry (`@vegastack/ui`) bumps 0.6.0 → 0.7.0.

### 📚 Docs

- **Colors** — a new surface-ladder specimen renders both themes side by side with the rungs and
  their alpha twins; the sidebar section now says the rail is aliases, not a second palette.
  [docs](https://design.vegastack.com/docs/foundations/colors) ·
  [`6c1b7bf`](https://github.com/VegaStack/vegastack-design/commit/6c1b7bf)
- **One page canon, for humans and agents alike — the infrastructure, and three reference pages.**
  The canon defines a fixed page shape whose machine-readable half is generated from the two
  authorities rather than typed: Install from `registry.json` (the `shadcn add` command, the
  registry dependencies and the sanctioned engines), Anatomy from the contract's new
  `dataAttributes`, the states-tested table from the contract's `states`, and a per-item Changelog
  filtered out of this file. This release ships those generated sections as MDX components and
  places them on **three reference pages** (button, dialog, data-grid); the remaining 107 pages
  keep their current bodies and are migrated to the canon in the next release. The canon table is
  `design.md` §Docs canon — the target shape, not a description of every page today.
  [canon](/docs/components/button)
- **The markdown export is real markdown.** The per-page `.md` route and `llms-full.txt` previously
  emitted `<AutoTypeTable …/>` and `<ComponentPreview …/>` verbatim — 107 of 110 component pages
  and 260 occurrences in `llms-full.txt` — so an agent reading the docs saw no props and no example
  code at all. Every MDX component now renders to markdown: the exact fixture source the Code tab
  shows, the flat prop tables, the install steps, the do/don't pairs. Browser-only surfaces are
  replaced by a one-line note rather than dropped silently.
- **API tables are flat and expanded, on every page at once.** One table per exported part — name,
  the literal union (`"default" | "secondary" | …`, not `union`), the `@default` value, the
  description — instead of collapsed accordion rows. This one lands everywhere immediately: the
  renderer is registered under the legacy `AutoTypeTable` name the 107 unmigrated pages author, so
  no page body had to change for it. Own props only, and a part with no own props of its own gets one
  sentence instead of the 138 "(no own props)" placeholder rows that filled 18 pages. A second
  table lists the `data-*` attributes and CSS variables the part exposes.
  [example](/docs/components/dialog)
- **`llms.txt` carries the registry roster and the skill roster** — every installable item with its
  page and its `shadcn add` target, and the public agent skills — so an agent can go from "I need a
  data grid" to the page and the install command without scraping.
  [guide](/docs/guides/agent-skills)
- **The docs shell obeys the design system it documents.** Fumadocs' chrome and the typography
  plugin are compiled against Tailwind's stock theme, so headings, sidebar titles and prose
  `<strong>` rendered at weight 600–900 in a system whose ladder is 400/500, cards used
  `rounded-xl`, and popovers used the stock shadow ladder. All of it is remapped to system values
  once. Demos also sat on the 15px/28px prose base because the product type scope re-bound the
  `--type-*` vars but not the inherited `font-size`. [foundations](/docs/foundations/typography)
- **Fullscreen preview is the system `Dialog`.** The old overlay declared `role="dialog"
aria-modal="true"` and had no focus trap — Tab walked straight out into the hidden chrome behind
  it. Copy Prompt moved once into the page header (it was repeated six times on the Button page),
  the hero preview renders through the same frame as every other example, a skip link is now the
  first tab stop on every page, and the icon-gallery tile is a real labelled button instead of 439
  nameless focusable `div`s. [accessibility](/docs/foundations/accessibility)

### 🛠 CLI & tooling

- **`verify-docs-export`** fails the docs build on any JSX tag surviving outside a code fence, any
  unresolved export placeholder, or any empty API table — the regression guard for the export
  above — and enforces that a page carries either a curated playground or the Story explorer, never
  both.
- **`verify-docs-base-mirror`** diffs the rule blocks `apps/docs/app/global.css` hand-copies from
  `base.css`, which had no gate. It counts `@apply` as a declaration: the focus ring is expressed
  only that way on both sides, so filtering `@`-prefixed lines compared that block as empty against
  empty and could never fail.
- **`design-lint --docs-shell --emitted-css`** reads the BUILT stylesheet, because the shell's
  off-system values are compiled in by dependencies and never appear in this repo's source.
- **`verify-component-contracts --write-data-attributes`** extracts each part's `data-*` attributes
  and CSS variables from the canonical source through the TypeScript AST; the default mode fails
  when the contract drifts from the source.
- Each of the four ships a negative self-test, so none of them can pass by never having run — and
  so does `verify-component-contracts`, whose `--self-test` drifts a `dataAttributes` record in
  memory and requires the reconciliation to reject it.
- **`verify-mdx-manifest`** (docs `lint`) proves the agent export fails closed on the three
  failures that leave no artefact behind for the gate above to find: an MDX component no manifest
  entry classifies, a placeholder whose runtime renderer is missing (nested ones included), and a
  component registered in the MDX map but absent from the manifest. Before it, the first rendered
  to a single space and the second to its bare children.

## [0.6.0] — August 31, 2026

### 🔧 Changed components

- **AudioPlayer** — rebuilt transport with a responsive, two-line mobile layout. On a wide player
  it is a single line: play/pause, rewind and forward (±15s), an `elapsed / duration` readout, a
  flexible seek, and a fixed-width tappable speed control that cycles the playback rates
  (1x → 1.25x → 1.5x → 2x → 0.5x). Audio carries no volume control — mute stays on the M key. On a
  narrow (mobile-width) player it reflows to two lines: the seek bar with `elapsed` and `duration`
  pinned to either edge in a smaller font on top, and a centred play/pause flanked by rewind and
  forward on the bottom, with an optional transcript control (new `onTranscriptClick`, lucide
  `audio-lines`) on the leading edge and the speed control on the trailing edge. The chrome and
  progress fill move from the brand-bold primary to a subdued secondary emphasis, and the waveform
  seek now fills continuously instead of one bar at a time. VideoPlayer's overlay controls are
  unchanged.
  [docs](https://design.vegastack.com/docs/components/audio-player) ·
  [`43eb359`](https://github.com/VegaStack/vegastack-design/commit/43eb359)

### 📦 npm

- **`@vegastack/design`** → **`0.3.2`** — refreshes the shipped Audio Player skill reference for the
  reworked transport and its two-line mobile layout. No runtime code changed.
- **`@vegastack/design-tokens`** is unchanged. The design-system registry (`@vegastack/ui`) bumps
  0.5.0 → 0.6.0.

## [0.5.0] — August 28, 2026

### 🧩 New components

- **AudioPlayer**, **VideoPlayer** — media players sharing one custom transport: grouped
  play / seek / mute / settings controls, a 128-bar waveform seek on audio, a smoothly expanding
  video progress rail, a contained volume rocker, larger overlay actions, state-aware fullscreen,
  and keyboard shortcuts.
  [docs](https://design.vegastack.com/docs/components/audio-player) ·
  [`334cb4c`](https://github.com/VegaStack/vegastack-design/commit/334cb4c)

### 🔧 Changed components

- **ProgressIndicator** — new value-display variants render the percentage inline or contained
  within the glyph.
  [docs](https://design.vegastack.com/docs/components/progress-indicator) ·
  [`334cb4c`](https://github.com/VegaStack/vegastack-design/commit/334cb4c)
- **Sidebar** — the desktop sidebar and its footer now stay pinned to the viewport while page and
  navigation content scrolls.
  [docs](https://design.vegastack.com/docs/components/sidebar) ·
  [`334cb4c`](https://github.com/VegaStack/vegastack-design/commit/334cb4c)
- **Switch** — the invalid state no longer applies a destructive track border; `aria-invalid`
  remains the semantic cue and the wrapping Field owns the error message. Consumer-visible restyle.
  [docs](https://design.vegastack.com/docs/components/switch) ·
  [`334cb4c`](https://github.com/VegaStack/vegastack-design/commit/334cb4c)

### 🐛 Fixed

- **DatePicker**, **ComparisonMatrix**, **PricingSection**, **Tabs**, **FieldInline** — manual-QA
  remediation across range selection, compact navigation, overflow handling, and responsive pricing
  and comparison layouts.
  [docs](https://design.vegastack.com/docs/components/date-picker) ·
  [`334cb4c`](https://github.com/VegaStack/vegastack-design/commit/334cb4c)

### 🛠 CLI & tooling

- Cross-engine smoke and the full three-engine suite now treat **WebKit as host-conditional** — it
  runs where it can launch and is skipped with an auditable banner where it cannot (macOS 26.6.2
  cannot launch Playwright's WebKit). Chromium + Firefox coverage is never blocked, and a Mac on
  macOS 26.2–26.5 still enforces WebKit. Control with `WEBKIT_LANE=auto|off|require`.
  [`b6b1bd0`](https://github.com/VegaStack/vegastack-design/commit/b6b1bd0)

### 📚 Docs

- Improved the published examples for dropzones, menus, charts, mobile shells, and the dashboard
  starter.
  [`334cb4c`](https://github.com/VegaStack/vegastack-design/commit/334cb4c)

### 📦 npm

- **`@vegastack/design`** → **`0.3.1`** — ships the regenerated component-roster skill reference
  (the two new players, the ProgressIndicator variant note, updated counts). No runtime code changed.
- **`@vegastack/design-tokens`** is unchanged. The design-system registry (`@vegastack/ui`) bumps
  0.4.1 → 0.5.0.

## [0.4.1] — July 28, 2026

### 🐛 Fixed

- **Stepper** — horizontal step content is now width-constrained so long labels truncate instead
  of overlapping adjacent steps at the 320px responsive contract width.
  [docs](https://design.vegastack.com/docs/components/stepper)

## [0.4.0] — July 27, 2026

### 🧩 New components

- **ActionBar**, **ChipInput**, **EditableCell**, **FilterBuilder** (`filter-bar-managed`),
  **NumberField**, **ShortcutOverlay**, **Stepper**, and **Timeline** — eight additions from the
  CRM commission (plan 2026-07-26), each with complete docs, state coverage, accessibility tests,
  and registry integrity metadata.
  [components](https://design.vegastack.com/docs/components/action-bar)
- **SortableList**, **Board**, **Dropzone**, and **DataGrid** — the four dependency-gated
  commissions, unblocked by MK's 2026-07-27 sanction of four engines (Pragmatic drag and drop,
  react-dropzone, TanStack Table, TanStack Virtual). Reorderable rows with a lossless keyboard
  Move menu; a kanban board with cross-column card movement and per-move lock reasons; a
  paste-capable file drop surface; and the full-parity grid — multi-key sort, column picker with
  responsive revelation, collapsible grouping, keyboard-continuous load-more, opt-in
  virtualization, and APG cell navigation with inline editing.
  [components](https://design.vegastack.com/docs/components/data-grid)
- **useListNav**, **usePlatform**, **useDragReorder**, and **useFileDrop** — four new registry
  hooks: roving-tabindex keyboard navigation for lists and grids (RTL-aware arrows,
  `homeEndScope`, overlay suppression); SSR-safe platform detection (`{ os, isTouch }`) for
  `Kbd`'s modifier rewriting and touch gating; the reorder seam over Pragmatic drag and drop
  (pointer drags, commit-per-step keyboard move mode, server-refusable moves); and the file-drop
  seam over react-dropzone (drop + paste + browse, typed rejection reasons).
  [guide](https://design.vegastack.com/docs/guides/components)

### 🔧 Changed components

- **Kbd** — mac modifier glyphs now pair the visual glyph with visually hidden spoken names
  ("Command", "Option", …), so screen readers no longer hear "place of interest sign" or nothing.
  [docs](https://design.vegastack.com/docs/components/kbd)
- **Table** — new `containerClassName` / `containerProps` forwarded to the
  `data-slot="table-container"` scroll wrapper, the attachment point for sticky headers,
  fixed-height viewports, and virtualizers.
  [docs](https://design.vegastack.com/docs/components/table)
- **DataList** — `DataListProps` now extends `TableProps` (the spreadsheet voice and container
  hooks type-check), columns gain a per-cell `cellClassName` hook, and `render` receives an
  optional third `DataListCellContext` argument. All additive.
  [docs](https://design.vegastack.com/docs/components/data-list)
- **FieldInline** — additive controlled edit mode (`editing` / `onEditingChange`) and a `tabIndex`
  override for the display element, so `EditableCell` and grid hosts compose it instead of forking
  it. No behaviour change for existing consumers.
  [docs](https://design.vegastack.com/docs/components/field-inline)
- **ColorPicker** and **EmojiPicker** — internal refactor onto the shared `useListNav` hook; the
  API and visuals are unchanged, with one behavioural correction riding along: EmojiPicker's
  horizontal arrow keys become RTL-aware, matching ColorPicker. Safe to take or skip.
  [docs](https://design.vegastack.com/docs/components/color-picker)
- **Button** — the `active:translate-y-px` press nudge is removed from `buttonVariants`, so every
  component composing Button (IconButton, SplitButton, toolbars, pickers) loses it in one place.
  Pressed feedback is now colour-only via the existing `active:bg-*` states, and the motion
  foundations doctrine records press-motion as a deliberate exclusion.
  [docs](https://design.vegastack.com/docs/components/button)

### 🛠 CLI & tooling

- `verify-registry-deps` gains a fail-closed npm-range check: a registry item pin the installed
  version cannot satisfy now fails `registry:build` instead of passing silently.

### 📚 Docs

- The npm dependency pins the installed versions could not satisfy are reconciled to
  `packages/ui/package.json`: `lucide-react` was declared at both `^1.20.0` and `^0.525.0` across
  a major boundary (41 items), and `@shadcn/react` at `^0.1.0` against an installed `^0.2.1`.
- `table.mdx` no longer claims the Table parts add no props; `data-list.mdx` documents that a
  column `render` is invoked as a plain function (hooks belong in a returned component element).
- The docs homepage and 404 page now pass `nativeButton={false}` to every Button rendered as a
  link, matching the Base UI contract for non-button `render` targets; `button.mdx` and the
  bundled design-system skill document the pattern, and `motion.mdx` records the press-nudge
  removal.

## [0.3.0] — July 24, 2026

### 🧩 New components

- **AnnouncementBanner**, **CodeBlock**, **ComparisonMatrix**, **NavigationMenu**,
  **OnboardingChecklist**, **PricingSection**, **PropertyList**, **RuledBand**, **Segmented**,
  **Stat**, **TagGroup**, and **ToolCallChip** — twelve production-ready additions with complete
  docs, state coverage, accessibility tests, responsive previews, and registry integrity metadata.
  [components](https://design.vegastack.com/docs/components/announcement-banner) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### 🔧 Changed components

- **MarkdownView** — remote image sources are now same-origin by default; explicitly allow trusted
  remote origins with `allowedImageOrigins`. The renderer and copied-file verifier also enforce
  contained paths and digest-pinned post-write checks.
  [docs](https://design.vegastack.com/docs/components/markdown-view) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- **Provider** and all portal-owning components now share an explicit theme-scope contract, while
  server-safe modules are verified under React's real `react-server` condition.
  [docs](https://design.vegastack.com/docs/components/provider) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### 🛠 CLI & tooling

- `vegastack-design skills install` now bundles and safely installs the four public VegaStack agent
  skills for Claude Code and Codex, with atomic conflict handling, symlink containment, dry-run,
  and single-surface options.
  [guide](https://design.vegastack.com/docs/guides/agent-skills) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- `vegastack-design check-updates` now verifies installed file bodies and the complete target set;
  matching provenance headers can no longer hide edited content, and removed or renamed targets
  fail `--fail-on-update`.
  [guide](https://design.vegastack.com/docs/guides/components) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- Registry builds now prune stale artifacts, reconcile exact authority/index/manifest sets, and
  prove real shadcn consumption against locally packed npm artifacts before release.
  [integrity](https://design.vegastack.com/docs/guides/registry-auth) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### 📦 npm

- `@vegastack/design` **0.2.0** — adds bundled public agent skills, the skills installer,
  CommonJS-compatible exports, and the explicit `./theme-scope` client subpath while preserving a
  server-safe root.
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- `@vegastack/design-tokens` **0.2.0** — publishes the unified DTCG-backed doctrine, strong type and
  effect roles, exact dark/marketing parity, and verified ESM/CommonJS/package exports.
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- Private `@vegastack/ui` advances to **0.3.0** to stamp the 538-item registry; it remains private
  and is never published to npm.
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### 📚 Docs

- The public design doctrine, component contracts, homepage catalog, API reference, agent guidance,
  internal SSO corpus, metadata, and release/cutover runbooks now derive from current machine
  authorities and build successfully in both private and public visibility modes.
  [design doctrine](https://design.vegastack.com/docs/foundations/design-principles) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### 🐛 Fixed

- State-specific accessibility coverage now exercises open, expanded, selected, disabled,
  highlighted, loading, empty, error, success, and removable states across the applicable
  component contracts; all token contrast pairs pass WCAG 2.2 AA gates in both themes.
  [accessibility](https://design.vegastack.com/docs/foundations/accessibility) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- Release and deploy workflows now use the reviewed-merge/manual-dispatch approval model supported
  by the private GitHub Team repository, retain isolated OIDC and repository secrets, and probe the
  Cloudflare Access boundary after deployment.
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### ⚠️ Breaking

- `vegastack-design verify --post-write` now requires `--expected-integrity`; use the exact
  integrity-pinned command printed by the pre-write verification. **MarkdownView** also requires an
  explicit allowlist for cross-origin images.
  [verification](https://design.vegastack.com/docs/guides/registry-auth) ·
  [MarkdownView](https://design.vegastack.com/docs/components/markdown-view) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

## [0.2.0] — July 19, 2026

### 🧩 New components

- **Provider** — the app-root wrapper (theme, toasts, tooltip coordination, text direction);
  install once via `shadcn add @vegastack/provider`, composes the `sonner` Toaster item.
  [docs](https://design.vegastack.com/docs/components/provider) ·
  [`c7de692`](https://github.com/VegaStack/vegastack-design/commit/c7de692)

### 🔧 Changed components

- **Checkbox**, **Switch** — Story explorer controls narrowed to human-usable props (the raw
  Base UI prop graph serialized to ~24 MB per page, over Cloudflare's 25 MiB asset limit).
  No API change.
  [checkbox](https://design.vegastack.com/docs/components/checkbox) ·
  [switch](https://design.vegastack.com/docs/components/switch) ·
  [`45c7cf8`](https://github.com/VegaStack/vegastack-design/commit/45c7cf8)
- **dashboard-01** (block) — component files now target `app/dashboard/components/` (the page's
  relative imports were broken on clean installs) and `page.tsx` ships the default export Next
  requires for route files.
  [docs](https://design.vegastack.com/docs/blocks/dashboard-01) ·
  [`ac6288a`](https://github.com/VegaStack/vegastack-design/commit/ac6288a)
- **use-animation-replay** (hook) — stray duplicate header line removed (caused a false drift
  flag in `check-updates`).
  [`ac6288a`](https://github.com/VegaStack/vegastack-design/commit/ac6288a)

### 🛠 CLI & tooling

- `vegastack-design check-updates` is **header-optional**: the shadcn CLI strips provenance
  headers on copy-in, so copies are now identified by filename against the registry index and
  compared by alias-normalized content. New `≈ drift` status (differs — upstream update or
  local edits); `--fail-on-update` fails on `update` + `drift`.
  [guide](https://design.vegastack.com/docs/guides/components) ·
  [`ac6288a`](https://github.com/VegaStack/vegastack-design/commit/ac6288a)
- Release workflow is path-routed: the container pixel gate runs only when component-visual
  code changes; the release job only when something is publishable.
  [`e8a8450`](https://github.com/VegaStack/vegastack-design/commit/e8a8450)

### 📦 npm

- `@vegastack/design` **0.1.1** — `tw-animate-css` is a real dependency (was an optional peer
  that pnpm never installed, breaking every fresh consumer build at `preset.css`).
  Published via npm OIDC trusted publishing — the first fully-automated release.
  [`9532d42`](https://github.com/VegaStack/vegastack-design/commit/9532d42)
- `@vegastack/design-tokens` stays **0.1.0** (no changes).

### 📚 Docs

- New **Guides** section — [Quickstart](https://design.vegastack.com/docs/guides/quickstart),
  Registry access & auth, Working with components, Provider setup, Theming, Production
  checklist, Troubleshooting. Every command executed for real against the reference starter
  before being written down; 29 adversarial-review findings applied.
  [`7307231`](https://github.com/VegaStack/vegastack-design/commit/7307231) ·
  [`11836b6`](https://github.com/VegaStack/vegastack-design/commit/11836b6)
- Sidebar sections labeled; doc pages carry a server-rendered "Last updated" stamp.
  [`a323cba`](https://github.com/VegaStack/vegastack-design/commit/a323cba)
- Lifecycle guides for both audiences: **Internal projects** (the two-speed update
  model: npm = global on dep bump, registry = frozen until reviewed pull; the
  token-ordering trap) and **Client projects** (delivery model, handover checklist,
  zero-lock-in dependency table). Repo also gains a maintainer README.
  The internal guide is now SSO-only and intentionally absent from the public corpus;
  the [client-project guide](https://design.vegastack.com/docs/guides/external-projects)
  remains public.

## [0.1.0] — July 18, 2026

### 🧩 New components

- Initial release: **75 components**, **439 animated-icon items**, 2 hooks
  (`use-mobile`, `use-animation-replay`), and the `dashboard-01` starter block — all Base UI +
  Tailwind v4, semantic-token-only, WCAG 2.1 AA, distributed as copy-in via the private
  registry at `design.vegastack.com/r/*` (Cloudflare Access service-token auth,
  Sigstore-signed manifest).
  [components](https://design.vegastack.com/docs/components/button) ·
  [`8a5bb2a`](https://github.com/VegaStack/vegastack-design/commit/8a5bb2a)

### 📦 npm

- `@vegastack/design` **0.1.0** — `cn()`, the icon runtime (`./icons`), the Tailwind v4 preset
  (`./preset.css`), token CSS re-exports, and the `vegastack-design` CLI.
- `@vegastack/design-tokens` **0.1.0** — the zero-dependency DTCG token contract
  (`theme.css`, `base.css`, `utilities.css`, `tokens.json`).

### 📚 Docs

- At the 0.1.0 release, the Fumadocs showcase had 91 pages, live previews rendering the real
  shipped source, and complete desktop/mobile VRT coverage; it was deployed behind Cloudflare
  Access SSO. Current route and baseline counts are verified dynamically rather than inferred
  from this historical release entry.
  [`8a5bb2a`](https://github.com/VegaStack/vegastack-design/commit/8a5bb2a)

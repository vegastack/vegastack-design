# @vegastack/ui

## 0.5.0

### Minor Changes

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Fix component behavior and responsive presentation found during manual QA, including range selection, compact navigation, overflow handling, and responsive pricing and comparison layouts. Improve the published examples for dropzones, menus, charts, mobile shells, and the dashboard starter.

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Add AudioPlayer and VideoPlayer registry components with shared custom transport controls, including
  a smoothly expanding video progress rail, contained volume rocker, larger overlay actions, and
  state-aware fullscreen controls. The AudioPlayer mirrors the video control surface statically — a
  full-width solid scrubber, a background-free primary play control with a combined `elapsed / duration`
  readout, and matching settings submenus — and gains a `variant="waveform"` that renders the decoded
  audio as an interactive, seekable waveform.

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Add ProgressIndicator value display variants for inline and contained percentage labels.

- [#23](https://github.com/vegastack/vegastack-design/pull/23) [`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - Keep the desktop Sidebar and its footer pinned to the viewport while page or navigation content scrolls.

### Patch Changes

- Updated dependencies [[`334cb4c`](https://github.com/vegastack/vegastack-design/commit/334cb4cac069d7998762feae29e9ea61638c237c)]:
  - @vegastack/design@0.3.1

## 0.4.1

### Patch Changes

- [#19](https://github.com/vegastack/vegastack-design/pull/19) [`a3de5ed`](https://github.com/vegastack/vegastack-design/commit/a3de5eded041ad1fdbba537eda9d8510e8fc50ab) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Prevent horizontal Stepper labels from overlapping at narrow container widths.

## 0.4.0

### Minor Changes

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`5f17c36`](https://github.com/vegastack/vegastack-design/commit/5f17c36f042ff39c5e4d1b61f9b593e90ca5e57b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `action-bar` component — a floating contextual bar with a status region and action children.
  Bulk selection ("5 selected · Tag · Archive") is its most common recipe, never its identity: the
  same object serves unsaved-changes and batch-progress bars. It never owns selection (the host's
  list keeps `selectedIds`), announces status changes politely, inerts its actions while `pending`,
  sits flat in the raised band (covered by any dialog), and enters/exits with the CSS-only
  translate/scale/opacity recipe MessageScrollerButton established. `containerRef` switches from
  viewport centring (auto margins — never `left: 50%`) to ResizeObserver-measured centring over a
  content area beside a sidebar.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`cb15077`](https://github.com/vegastack/vegastack-design/commit/cb15077278e9e327b453a185f4e063af2388c9c3) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `board` component — kanban columns over the `use-drag-reorder` seam with the reference
  implementation's content/chrome split: the host renders card content only and owns the move command
  (`onMove`, promise-refusable with pending shimmer and announced snap-back); the board owns column
  shells, counts, `Empty bordered` drop targets, collapsed read-only lanes, drag + keyboard models,
  and the lossless per-card "Move to…" menu with visible lock reasons. Below 768px pointer drag
  disables outright — the keyboard move mode and the menu are the only, lossless paths. Cards form
  one roving tab stop (↑/↓ within a column, RTL-aware ←/→ across at a clamped index, M opens the
  menu, Enter activates, Space lifts). A dragged card gains no shadow — flat by doctrine. Selected
  for cross-engine smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`6633fc8`](https://github.com/vegastack/vegastack-design/commit/6633fc866bf50eb6b0501ab46503437e3ee2864e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Remove the `active:translate-y-px` press nudge from `buttonVariants`. Pressed feedback across
  Button and every component composing it (IconButton, SplitButton, toolbars, pickers) is now
  colour-only via the existing `active:bg-*` states — no press motion anywhere in the system. The
  motion foundations doctrine is updated to match.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`cf154ee`](https://github.com/vegastack/vegastack-design/commit/cf154ee2533d36830335a435372d9bb894464cbe) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `chip-input` component — free-token entry for tags, recipients, domains, and webhook events.
  Enter/comma/paste-split commit chips; Backspace in the empty input removes the last one. The field
  chrome is the Combobox input group's (borrowed literally, retargeted at the inner real `Input` — no
  raw `<input>`, no lint exemption), the chips are real `Tag`s with named 24px remove targets.
  Validation is per-chip and non-destructive: invalid entries are added and flagged (`data-invalid` +
  destructive outline-border pair + text description) rather than silently dropped, duplicates are
  rejected and announced, and all outcomes flow through a polite live region.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`019b921`](https://github.com/vegastack/vegastack-design/commit/019b921d0768693736dc877719fafa972556e2f2) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New component: `DataGrid` — the full-parity grid DataList's docs always pointed to. TanStack Table computes the sorted row model (multi-key sort with visible ordinals, shift-click additive); TanStack Virtual windows rows behind the `virtualize` flag; the APG grid keyboard layer — roving cell focus with RTL-aware arrows, Enter/F2 into `EditableCell` managed editing, Escape restore — is the component's own. Also: column picker + responsive column revelation (visible/hidden/merge), collapsible per-value grouping as real `tbody` sections, keyboard-continuous load-more, and row selection. Install with `shadcn add @vegastack/data-grid`.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`dc088f5`](https://github.com/vegastack/vegastack-design/commit/dc088f56d3ec83c58089230935fc3337c20567d6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `editable-cell` component — an inline-editable value with an async commit lifecycle. Composes
  `FieldInline` as the text leaf and reuses `AutoSaveInput`'s `AutoSaveStatus` vocabulary
  (`idle | saving | saved | error`) for its status indicator. A promise-returning `onCommit` shows the
  committed value optimistically, then flips to saved — or reverts to `value` and politely announces
  the revert on rejection (the version-conflict path). Editors are typed and open:
  `text` (FieldInline), `select` (a Select whose popover is the editor), and `custom` for app editors.
  `focusMode: "standalone" | "managed"` decides whether the cell owns its tab stop or defers to a
  grid's roving focus model.

  `FieldInline` gains three additive props to support this without being forked: controlled
  `editing` / `onEditingChange`, and a `tabIndex` override for the display element. No behaviour
  change for existing consumers.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`42427ad`](https://github.com/vegastack/vegastack-design/commit/42427ad24313e6cc83842bae741829dce6cb6f3f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `filter-bar-managed` component (`FilterBuilder`) — the stateful nested and/or filter builder
  the `filter-bar` docs recorded as deferred. The grammar is host-injected: the component owns the
  tree shape (`FilterNode` groups and conditions) and its editing surface, while the app supplies the
  field `vocabulary` (operators per field, `requiresValue`, formatting) and a per-type `editors`
  registry (text is built in). Nested groups render as fieldset/legend — deliberately not
  `role="tree"` — with depth and condition caps whose disabled add affordances carry readable
  reasons, a missing-value check with visible text, focus-managed removal (next sibling, else the
  group's add button), and a `readOnly` summary of removable `FilterChip`s. It never validates field
  semantics, never serialises, and never executes the filter — that would adopt one app's AST.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`49a0519`](https://github.com/vegastack/vegastack-design/commit/49a0519db34238685c163374de8a3309dd54ffd5) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `number-field` component — the roster's first numeric input. Wraps Base UI's NumberField
  (locale-aware Intl parsing/formatting, `min`/`max`/`step` with `snapOnStep`, keyboard stepping,
  wheel scrub) in `Input`'s exact addon-group chrome, with full-height − / + steppers whose pointer
  targets meet the 24px floor without hit-area expansion. Money is a `format` prop
  (`{ style: "currency", currency }`) plus a documented minor-units recipe — deliberately not a
  separate money-input. Like `Input`, the `size` prop replaces the native numeric `size` attribute.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`488cc09`](https://github.com/vegastack/vegastack-design/commit/488cc091ae5304d1377271bfd03ecbe57f158da1) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `shortcut-overlay` component — the `?`-triggered dialog listing keyboard shortcuts, rendered
  from a declaration registry (keys, label, category, optional `when`) instead of hand-listed markup,
  so the surface cannot go stale. Shortcuts group by category in declaration order, render as
  description-list pairs with real `Kbd` keys whose modifier glyphs follow the user's platform via
  `use-platform`, and large sets get an automatic filter. The global binding never fires from a text
  field and defers to a `shouldHandle` predicate while another overlay owns the keyboard.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`c183905`](https://github.com/vegastack/vegastack-design/commit/c18390507ac7e5970be148264d613576d757022a) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `sortable-list` component — reorderable rows on `ItemGroup`/`Item`, driven by
  `use-drag-reorder`: pointer drag with 2px closest-edge drop indicators, the keyboard move mode,
  per-step polite announcements, and the required lossless Move menu (up / down / to top / to
  bottom). Controlled — the host owns the order and can refuse a move by rejecting the `onReorder`
  promise (pending shimmer, announced snap-back). Deliberately owns no selection: reordering and
  multi-select on one surface make drag intent ambiguous. The `data-list` scope table's
  "drag-and-drop reordering" row is reconciled: the persisted order stays app-coupled, the mechanism
  now lives in the system. Selected for cross-engine smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`accf555`](https://github.com/vegastack/vegastack-design/commit/accf555aef523991f582b52f15f10891f180df28) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `stepper` component — a bounded linear process as an ordered list with
  `aria-current="step"`, deliberately not `Tabs` (tab semantics promise free navigation a wizard
  doesn't offer). Per-step complete/current/upcoming/**error** states map 1:1 onto `StatusIcon`'s
  vocabulary and always carry icon shape plus visually hidden text; a `blockedReason` renders against
  the current step, announces politely, and wires to the host's Next button via `aria-describedby`;
  focus moves to the new current step's label on change (never on mount); horizontal and vertical
  orientations share one DOM order; `navigable` mode turns completed steps into real buttons.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`6ce022d`](https://github.com/vegastack/vegastack-design/commit/6ce022d7ee12d72abbdd80c48404fa12f29239ae) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Give `Table` a styling hook for its scroll container, and let `DataList` pass the whole Table
  surface through.

  - `Table` gains `containerClassName` and `containerProps` (including `ref`), both forwarded to the
    existing `data-slot="table-container"` element that owns `overflow-x-auto`. Sticky headers,
    fixed-height viewports, and virtualizers finally have somewhere to attach — the `<table>` itself
    cannot own a scroll viewport.
  - `DataListProps` now extends `Omit<TableProps, "children">` instead of the raw `<table>` props, so
    `grid`, `headerTone`, `density`, and the new container hooks type-check on `DataList` (they always
    reached `Table` at runtime; TypeScript rejected them).
  - `DataListColumn` gains `cellClassName?: (row, index) => string | undefined` — a per-cell class
    hook merged after the per-column `className`.
  - A column `render` now receives an optional third argument, `DataListCellContext`
    (`{ rowId, columnKey, selected }`). Existing two-argument render functions are unaffected.

  All additive; no behaviour or visual change for existing consumers.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`2d1707f`](https://github.com/vegastack/vegastack-design/commit/2d1707ffb624196cd912513fa15258ef1efc68e8) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `timeline` component — rail geometry only, deliberately: a continuous vertical connector with a
  node per entry (`Timeline`/`TimelineItem`/`TimelineSeparator`), while rows compose the existing
  `Item` parts, timestamps are `RelativeTime`, and group headers render through `Marker`'s separator
  variant. No `TimelineTitle`/`TimelineDescription` — that would fork `Item`'s vocabulary. Entries
  carry the `content-visibility` render-skipping recipe for long feeds with zero dependencies, the
  rail is `aria-hidden` decorative geometry, and the whole family is server-safe (no `'use client'`).

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`37d31dd`](https://github.com/vegastack/vegastack-design/commit/37d31ddb57c179d5afdc0cc07aa176a265585335) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-drag-reorder` registry hook — the system's one drag-engine seam, wrapping the newly
  sanctioned `@atlaskit/pragmatic-drag-and-drop` (D3). Pragmatic owns pointer/touch mechanics and
  closest-edge hit-testing; the hook owns what must match this system's voice: a keyboard move mode
  (Space/Enter lifts, arrows commit one announced step at a time, Escape ends — Atlassian's own
  user-tested commit-per-step pattern), an overridable live-region vocabulary
  (lifted/moved/ended/rejected), a `requestMove` entry point for the mandatory menu equivalents, and
  the async drop contract no drag library models: a promise-returning `onReorder` is `pending` until
  it settles and a rejection announces + clears, so server-refused moves snap back. One API covers a
  single list and cross-container boards. Selected for cross-engine smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`abe32d8`](https://github.com/vegastack/vegastack-design/commit/abe32d8187b4783da987e7e2070f602e9281a9e7) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-file-drop` hook and `dropzone` component (D4). The hook is the one file importing the
  sanctioned `react-dropzone` engine — drag-depth handling, directory traversal, accept matching,
  keyboard activation of the drop surface — and adds the system's vocabulary on top: the paste
  path (`clipboardData.files`, the composer case) under the same accept/size/count constraints as
  drop, typed `FileDropRejection` reasons aligned with `AttachmentState`, a polite announcement
  payload that states WHY a file was refused, and a ref-counted document-level missed-drop guard
  scoped to file-bearing drags (`preventWindowDrop`). `Dropzone` is a deliberately thin shell over it: the surface is the named
  focusable control (`role="button"`), the real `<input type="file">` behind it is the picker
  bridge (the one reviewed raw-interactive exemption),
  `data-dragging`/`data-drag-invalid` styling flags, and children compose `Empty bordered` for the
  classic drop-zone look. No `attachments` prop by design — acquisition ends at a plain `File[]`
  callback where `Attachment`'s state machine takes over. Dropzone is selected for cross-engine
  smoke.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`296b3fe`](https://github.com/vegastack/vegastack-design/commit/296b3fedf005cbc13c19211279e3d1f23d16f906) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-list-nav` registry hook — roving-tabindex keyboard navigation for a list or grid of
  focusable items. One Tab stop per collection, RTL-aware ArrowLeft/Right (direction read live from
  the container), ArrowUp/Down by row via `columns`, and Home/End jumps scoped by
  `homeEndScope: "collection" | "row"` (default `"collection"`, matching the shipped pickers). A
  `shouldHandle` predicate suppresses navigation while an overlay above the list owns the arrow keys.
  Extracts the block color-picker and emoji-picker each hand-rolled; they adopt it in a follow-up.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`eb857f3`](https://github.com/vegastack/vegastack-design/commit/eb857f31a08dcbe976c8c302f91655f1b440c091) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `use-platform` registry hook — SSR-safe platform detection returning `{ os, isTouch }`
  (`os: "mac" | "windows" | "linux" | "other"`, touch from the `(pointer: coarse)` media query). The
  server render and hydration render report caller-supplied fallbacks so markup agrees on first
  paint; the real value lands in a client-only effect. Fills the hole behind `Kbd`'s manual `os`
  prop: callers run the hook and pass `os === "mac" ? "mac" : "other"` down — `Kbd` itself stays
  server-safe and unchanged.

### Patch Changes

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`76acdca`](https://github.com/vegastack/vegastack-design/commit/76acdcaa2f67d26c989ced01058f3e9bb074a4cc) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - `Kbd` mac modifier glyphs now pair the visual glyph with visually hidden spoken names ("Command",
  "Shift", "Option", "Control", "Return", "Delete") while the glyph itself goes `aria-hidden` — screen
  readers no longer hear "place of interest sign" (or nothing) for `⌘`. Non-mac word rewriting is
  unchanged. Surfaced by shortcut-overlay, the one surface built on the real `Kbd`; fixed at the root.

- [#16](https://github.com/vegastack/vegastack-design/pull/16) [`ff66002`](https://github.com/vegastack/vegastack-design/commit/ff660024e11358b44698b954cf59d08230c2755a) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - `color-picker` and `emoji-picker` adopt the shared `use-list-nav` hook for their roving-tabindex
  grids — internal refactor, no visual or API change. Both items gain `@vegastack/use-list-nav` in
  `registryDependencies`, so `check-updates` will report an update for each; it is safe to take or
  skip. Home/End behaviour is unchanged (whole-grid, the hook's default). One correction rides along:
  emoji-picker's ArrowLeft/ArrowRight are now RTL-aware, matching color-picker — previously they were
  LTR-only in RTL contexts.
- Updated dependencies [[`9d0a2ef`](https://github.com/vegastack/vegastack-design/commit/9d0a2efae46de237bf1a9f54a99bdebc4badc840), [`630ca84`](https://github.com/vegastack/vegastack-design/commit/630ca84084199e75c5a0a80184aa726552070994), [`6633fc8`](https://github.com/vegastack/vegastack-design/commit/6633fc866bf50eb6b0501ab46503437e3ee2864e)]:
  - @vegastack/design@0.3.0

## 0.3.0

### Minor Changes

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Add AnnouncementBanner, CodeBlock, ComparisonMatrix, NavigationMenu, OnboardingChecklist,
  PricingSection, PropertyList, RuledBand, Segmented, Stat, TagGroup, and ToolCallChip, and reconcile all
  96 registry components, 439 animated icons, two hooks, and the dashboard block across styling, portal
  theming, accessibility, responsive behavior, documentation, tests, and generated registry integrity.

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

- [#4](https://github.com/vegastack/vegastack-design/pull/4) [`09fa52c`](https://github.com/vegastack/vegastack-design/commit/09fa52ce0838cd8b3a48e6dd1abc29b6e47c2d0c) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Fix `Terminal`'s scrollable command pane having no visible focus indicator under
  `forced-colors: active`.

  The pane is keyboard-focusable and signalled focus with a border tint plus `outline-none`. Forced
  colors replaces `border-color` outright, so the tint vanished, and Tailwind v4's `outline-none`
  suppresses the shared `:focus-visible` outline with no forced-colors carve-out — leaving no
  indicator at all in the forced palette. The affordance is now that shared outline, inset with a
  negative offset so neither the terminal's `overflow-hidden` root nor `scroll-fade-x`'s mask can clip
  it. The layout-reserving transparent border is removed with the tint it existed for, so the pane
  renders 2px shorter.

- [#4](https://github.com/vegastack/vegastack-design/pull/4) [`7595cfd`](https://github.com/vegastack/vegastack-design/commit/7595cfd7c7eeaaafa95c7bd8d621cd4e5cb5087f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Give `Terminal`'s scrollable command pane an accessible name, and accept `aria-label` /
  `aria-labelledby` to override it.

  The pane is keyboard-focusable — a scrollable region has to be reachable without a pointer — but it
  was a bare `<div tabIndex={0}>` with no role and no name, so a screen reader announced it as an
  unnamed stop in the tab order (WCAG 4.1.2). It is now a `group` labelled by the visible `title`, so
  `title="Install"` reads as "Install, group" with no caller changes. `group` rather than `region`
  because `region` is a landmark and a page with several install snippets should not gain several
  landmarks.

  `aria-label` and `aria-labelledby` passed to `Terminal` now apply to that pane instead of the outer
  block, matching `ScrollArea`. On the outer block they had no effect — it carries no role — so nothing
  that previously worked stops working.

### Patch Changes

- Updated dependencies [[`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f), [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f), [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f)]:
  - @vegastack/design@0.2.0
  - @vegastack/design-tokens@0.2.0

## 0.2.0

### Minor Changes

- [`c7de692`](https://github.com/vegastack/vegastack-design/commit/c7de6929416086bd0d4c6ca0b1957247c6b202a7) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - New `provider` registry item — `VegaStackProvider` + `useVegaStackTheme` ship as a copy-in
  (`shadcn add @vegastack/provider`, composing the `sonner` Toaster item), closing the gap where
  downstream projects had no sanctioned install path for the app-root wiring (theme, toasts,
  tooltip coordination, direction). The private package's provider is now a documented mirror of
  the canonical registry source.

### Patch Changes

- Updated dependencies [[`9532d42`](https://github.com/vegastack/vegastack-design/commit/9532d4295807dd4f37ddefb514641249e1002911)]:
  - @vegastack/design@0.1.1

## 0.1.0 — first release (2026-07-18)

Private package — components are distributed via the **signed shadcn registry**
(`design.vegastack.com/r`), never npm. This changelog is the consumer-facing record per version;
per-component change signals are the `// @vegastack <name>@<version> sha256-…` provenance headers.

83 components on Base UI 1.6 + Tailwind v4, 525 registry items (incl. 440 animated-icon mirrors,
2 hooks, the `dashboard-01` block):

- Actions/forms: 15-variant Button family (icon-proportional ladder, in-ink loading spinner),
  full form suite with border-tint focus (no rings) and auto shake-on-invalid.
- Combobox + Command rebuilt data-driven on Base UI (cmdk removed); Select-style popup search
  (`ComboboxPopupInput`); pickers (date/color/emoji/country/region).
- Display/data: badges, cards, tables, DataList, charts (mono numerals), Empty, Item, Attachment,
  AnimatedNumber, Resizable.
- Shell: AppShell + Sidebar (Sheet mode, rail, cookie persistence), PageHeader, breadcrumbs.
- Chat: Marker, Message, Bubble, MessageScroller. Marketing: 8 `.vs-marketing` primitives.
- Every component: token-only styling, WCAG 2.1 AA, both themes, ref-as-prop, flat exports —
  audit-swept with per-variant screenshot evidence before this release.

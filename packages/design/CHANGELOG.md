# @vegastack/design

## 0.7.14

### Patch Changes

- [#245](https://github.com/vegastack/vegastack-design/pull/245) [`323e8c8`](https://github.com/vegastack/vegastack-design/commit/323e8c84dc1ebb54f44eef2bd713248e70bb4065) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Dates & times: one Intl-based module (`@/lib/date-time`) — formatRelative, formatDuration, formatDate, formatDateTime, formatDateRange, formatTimeOfDay, formatDueLabel, groupByDay, getTimeZone and the `tz` cookie script — plus `DateTime`, `Duration`, `DueLabel`, `TimeZoneProvider`/`useTimeZone`/`TimeZoneScript` beside `RelativeTime` (new `format` prop). The Relative Time docs page becomes "Dates & times" with a where-to-use table, and the design-system skill says which to pick.

- [#247](https://github.com/vegastack/vegastack-design/pull/247) [`af1194d`](https://github.com/vegastack/vegastack-design/commit/af1194d973e6c82f5beff593da9490ea2ae72526) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Inbox: `Inbox`, `InboxFilters`, `InboxGroup`, `InboxItem` (avatar or muted icon, rich titles, action chips with loading and done states, hover/focus read toggle and menu, grouped counts), `InboxEmpty`, `InboxSkeleton` and `InboxError` for notification panels.

## 0.7.13

### Patch Changes

- [#242](https://github.com/vegastack/vegastack-design/pull/242) [`5789ff6`](https://github.com/vegastack/vegastack-design/commit/5789ff6977dcc8d50cde26d39281e7913a6d374e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Sidebar rows breathe and the user menu is one standard** — `SidebarMenu` puts a 2px gap between rows so a hovered row never touches the active one, and `SidebarGroup` sits tighter so groups stack closer. The `app-shell-01` user menu is now the standard account menu: avatar, name and role on the trigger; the same row with the email as the menu header; Profile, Settings, a Theme submenu (Light · Dark · System with icons and a check), Keyboard shortcuts, and Sign out — every item with an icon. See [App shell 01](/docs/blocks/app-shell-01).

## 0.7.12

### Patch Changes

- [#243](https://github.com/vegastack/vegastack-design/pull/243) [`e5a31c1`](https://github.com/vegastack/vegastack-design/commit/e5a31c17c9b2f0aaaca9fcfd145fe821e4701086) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Command palette: `CommandFilters` row for type chips and selects, built-in `Kbd` key hints in `CommandFooter`, animated search icon in `CommandLoading`, the wide 820px palette as `CommandDialog`'s default size, and no blank space below the footer.

## 0.7.11

### Patch Changes

- [#240](https://github.com/vegastack/vegastack-design/pull/240) [`a3ddf24`](https://github.com/vegastack/vegastack-design/commit/a3ddf2470802ee9492b5cee5f19fc4d11feb02d1) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **FilterBar is a two-row table toolbar** — search, `scope`, `view` and `actions` on the first row; facets, "More" and `onClear`'s "Clear" on the second, folding into a "Filters (n)" sheet on a narrow bar. An unset facet reads just its label and a set one is a filled pill with a "Clear Status" ×; `searchPlacement` and `anyLabel` are deprecated and ignored.

- [#239](https://github.com/vegastack/vegastack-design/pull/239) [`f22ce1f`](https://github.com/vegastack/vegastack-design/commit/f22ce1f6ea20f408a9216333ba47195f13de8f87) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Overlay footers are as plain as their headers** — `DialogFooter` and `AlertDialogFooter` drop the muted, top-bordered band and sit in the popup's own padding. `SheetFooter` right-aligns its actions at every width instead of stacking them full width; give a Cancel `data-slot="sheet-cancel"` to seat it at the start edge. Secondary actions use `variant="secondary"`: `AlertDialogCancel`, `DialogFooter showCloseButton`, and `MultiStepForm`'s Back, Skip and Exit now default to it, and the `MultiStepFormActions` row is right-aligned with no divider. See [Sheet](/docs/components/sheet) and [Dialog](/docs/components/dialog).

## 0.7.10

### Patch Changes

- [#235](https://github.com/vegastack/vegastack-design/pull/235) [`c126f9f`](https://github.com/vegastack/vegastack-design/commit/c126f9f577015ba497473e6f0f66a01855368285) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **Alert has no focus ring** — an app can move focus to an error `Alert` so screen readers announce it; the alert no longer shows the focus ring, since it is not an interactive control. `SheetContent` takes `showOverlay={false}` to drop the backdrop for a non-modal panel docked beside the page.

- [#236](https://github.com/vegastack/vegastack-design/pull/236) [`499e2dd`](https://github.com/vegastack/vegastack-design/commit/499e2ddb0ecfedb962f2e4aef02d6cb9a233f45e) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Checkbox takes `shape="circle"`** — a round check for marking a task or to-do done; `square` stays the default for selection and form fields.

- [#238](https://github.com/vegastack/vegastack-design/pull/238) [`008bea6`](https://github.com/vegastack/vegastack-design/commit/008bea6b4db39564bb49bef1fd9f76d335f54c7c) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 **No focus ring on programmatic focus targets** — `AppShellContent`'s `<main>` (the skip-link and route-change focus target) no longer draws a focus outline, which showed as a line under the app header after navigation. The same applies to `SheetContent`'s popup, the `MultiStepForm` step heading and section list, and the `Stepper` summary; interactive controls keep their focus rings.

## 0.7.9

### Patch Changes

- [#233](https://github.com/vegastack/vegastack-design/pull/233) [`ac4341c`](https://github.com/vegastack/vegastack-design/commit/ac4341ca9c80c821cf9e18620e16df0c180f27f2) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Last facelift gaps** — `DataList` (and `DataGrid`) reserve the first column and every `mobile: "visible"` column before fitting the rest, so a trailing Status or actions column no longer leaves a narrow table squeezed while an earlier column that should fold stays. `tabsListVariants` and `tabsTriggerVariants` draw horizontal tabs — the list height and the line indicator — whenever the `group/tabs` ancestor is not vertical, so route tabs need no `data-orientation` at all, and a scrolling route list keeps its indicator inside the scroll box. `SearchableSelect`'s in-panel search keeps its own name inside a `Field` instead of taking the Field label, and `searchLabel` is now optional (default "Search"). [docs](https://design.vegastack.com/docs/components/data-list)

## 0.7.8

### Patch Changes

- [#231](https://github.com/vegastack/vegastack-design/pull/231) [`f15f6da`](https://github.com/vegastack/vegastack-design/commit/f15f6dacf06d6b009aab10182e40e4947f812a63) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **Facelift gaps, all opt-in and backward compatible** — `EditableCell` takes `wrap` (a page title wraps instead of truncating) and `flush` (its text lines up with the line below). `DataList` columns take `mergedRender`, so a value folded into the first column on a phone keeps its context ("4 to review", not "4") and `mergedLayout="line"` joins folded values into one compact meta line ("Today · High · Arjun Mehta"), and the list takes `rowProps` for per-row `data-*` attributes, a class and a `highlighted` state that flashes a new row. `AudioPlayer` takes `onSourceExpired`: a media error renews an expired signed URL once and resumes at the same position. `MarkdownView` takes `headingOffset`, moving every heading down that many levels (capped at h6). `tabsListVariants` scrolls a list that carries no `data-orientation` (route tabs), and only a vertical list turns the scroll box off. `Board`'s card `href` now wins over one on the `itemLinkRender` template, as `DataList`'s row link already did (the template's own ref still lands), and a card with a menu reserves end padding so a long title wraps before the ⋯ trigger. The Alert page documents a caller `role` (`role="note"`) as the way to keep a page-load alert out of every live region, and the agent skill shipped in `@vegastack/design` names the new props. [docs](https://design.vegastack.com/docs/components/data-list)

## 0.7.7

### Patch Changes

- [#226](https://github.com/vegastack/vegastack-design/pull/226) [`4178c7f`](https://github.com/vegastack/vegastack-design/commit/4178c7f1d9390fccf40a8f05519ede8b55d662bd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The `vegastack-design-system` agent skill now lists the facelift components and blocks: `SearchableSelect` `multiple` and server search, `FilterBarFacet`, `DataList` paging, row links, sections and row actions, `LoadMore`, `useAsyncSearch`, `SortableList` tiles, `Transcript` with a docked `AudioPlayer`, and a starter-blocks roster from `app-shell-01` to `status-pages-01`.

- [#225](https://github.com/vegastack/vegastack-design/pull/225) [`5f33be1`](https://github.com/vegastack/vegastack-design/commit/5f33be13532ff52ede7514459194e873031280a6) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🐛 Fixes from the consolidated review of the facelift design-system work (Regent #136–#140).

  - **Two-line rows** (Command, Select, Combobox and the three menus): the second line is read once, as the row's description, and no longer repeated inside its name. A caller's own `aria-describedby` still wins, and the second line then stays in the name. [docs](https://design.vegastack.com/docs/components/item)
  - **CommandLoading** reads "Searching…" by default. With a `progress` value it stays a labelled `progressbar`, so the value reaches assistive technology. [docs](https://design.vegastack.com/docs/components/command)
  - **LoadMore**: when the last batch arrives the footer keeps the focus its button had, instead of dropping it to the page, and reads its `endLabel` (or "End of list"). It is now a client component.
  - **SortableList and Board**: a row or card action that removes its row moves focus to the row that took its place (its handle, or its menu when the row is locked). SortableList takes the accessor as `getItemActions`, Board's name; `menuItems` is deprecated. Board takes `actionsLabel`, a lane's `loadMore` takes the footer's labels, and a read-only lane keeps a card's own actions (only the Move items go). [docs](https://design.vegastack.com/docs/components/sortable-list)
  - **RowActionsMenu**: a disabled single icon action is described by its `disabledReason`, not only in its tooltip.
  - **FilterBar**: facets have their own seat (`facets`), after the search and before the chips; an "Add filter" option with an `editor` opens it on the new chip; `FilterChip` takes `defaultEditorOpen`. **FilterBarFacet**: the pinned "Selected" group comes first and is taken when the list opens, so toggling a row no longer moves it; the facet is the bar's height (`h-8`); `removeLabel`, `selectedGroupLabel` and `moreGroupLabel` override its strings. [docs](https://design.vegastack.com/docs/components/filter-bar)
  - **FilterBuilder** (`filter-bar-managed`): `fieldPicker="searchable"` (with `fieldPickerProps`) searches the fields, an option value with more than seven options is a search picker and a several-values editor is `SearchableSelect multiple`, and a row error is tied to the field picker whenever the operator takes no value. [docs](https://design.vegastack.com/docs/components/filter-bar-managed)
  - **SearchInput**: a value reset from outside (a host's "Clear filters") drops the typed value's pending `onValueCommitted`.
  - **SearchableSelect**: a server search with no rows yet shows its loading line; `groupOrder` puts named groups first; its fallback name no longer overrides a `<label for>`; it takes `aria-invalid` and `aria-describedby`.
  - **TextEdit**: a disabled Base UI `Field` disables the editor.
  - **RelativeTime**: `formatOptions` with `dateStyle` or `timeStyle` no longer throws for another year's date or with `withTime`.
  - **useAsyncSearch**: Load more waits out a typed query's debounce instead of pairing the new query with the old cursor.
  - **Transcript**: matches after characters whose lower case is longer are highlighted exactly; segments that only add matches keep the reader's position without a new announcement; a press on the scrollbar pauses follow; the loading line is a status.
  - **AudioPlayer**: a rejected lazy `src` or a failed media load shows the player's own error line (`loadErrorLabel`); the loading glyph is `Spinner`. **AttachmentProgress** speaks a clamped percent.
  - **VegaStackProvider**: a custom `toaster={<Toaster limit timeout />}` sets the provider's queue, and a `Toaster` on another manager brings its own provider.
  - **AppShell** takes `keyboardShortcut` (or `false`), forwarded to the sidebar. **SidebarStateScript** takes a `nonce`. The sidebar docs render a collapsible menu row as the `SidebarMenuItem`, show the unavailable item's `TBD` badge and reason, and format the shortcut per platform.
  - **DataList** section rows use the group-label face; **SettingsSection** titles use the heading face; **Board** keeps one stable ref per card.
  - **Blocks**: command-search-01 keeps Enter on its scope chips and Try again, follows only http(s) links, debounces its search, announces a scope change and a settled result count once, and has all ten scopes; the Mod+K shortcuts in command-search-01 and app-shell-01 ignore text fields; list-page-01 searches on the settled query, adds an Industry facet, sets `mobile` on every column, takes `readOnly`, and moves focus to the search after "Clear filters", as board-01 does; both use one control height per row; notifications-01 and list-page-01 take `loading` / `error` (and notifications-01 `loadMore`) instead of `status` / `loadOlder`; review-split-01 keeps its player docked in its column and names its tab count; counts in tabs are muted tabular numbers with a spoken suffix.
  - **Docs**: Stat shows linked tiles; Dropzone's upload queue has per-file fields and a save retry; Pagination describes its `<a>` links; list-page-01 keeps view state in guarded `sessionStorage`.
  - **`vegastack-design doctor`** points retired `text-h1`/`text-h2` at the page and section heading faces.
  - Migration: the `data-slot` values `notification-bell-dot`, `row-action` and `row-actions-trigger` are now `notification-dot`, `row-actions-menu-action` and `row-actions-menu-trigger`. Copied blocks are yours: re-add list-page-01 or notifications-01 to take the prop renames. From 0.19.0 (not in its notes): a mixed checkbox shows a minus, disabled checkboxes and radios dim outside a Field too, and `Card` and `Empty` are client modules.

## 0.7.6

### Patch Changes

- [#214](https://github.com/vegastack/vegastack-design/pull/214) [`1786767`](https://github.com/vegastack/vegastack-design/commit/1786767749742f6b72e1267675c8cf14323e638d) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The doctrine now describes the form, toast and overlay behaviour that shipped in the facelift fixes.

  - **Forms**: the skill and design.md say `Field` wires its control through Base UI Field — label, description and error ids, and `aria-invalid` from `data-invalid` — so ids are passed only to override, and an explicit `aria-*` prop merges with the Field's. [docs](https://design.vegastack.com/docs/components/field)
  - **Toast**: one action, one toast — a repeat rewrites the live toast with `toast.update`. [docs](https://design.vegastack.com/docs/components/toast)
  - **Elevation**: one overlay width table for Dialog, Sheet and CommandDialog `size`. [docs](https://design.vegastack.com/docs/foundations/elevation)

- [#215](https://github.com/vegastack/vegastack-design/pull/215) [`ce43c9b`](https://github.com/vegastack/vegastack-design/commit/ce43c9beaa008db42c309c6500f85ed3dc02b9fe) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **useAsyncSearch** — a new hook for server search over a cursor-paged list: the query updates as you type and the request waits for `TIMINGS.searchDebounceMs` (a new 300 ms timing in `@vegastack/design`), a newer request aborts the last and late responses are dropped, `loadMore` pages with the returned cursor, and a failure keeps the loaded items with a retry. Documented in the [components guide](https://design.vegastack.com/docs/guides/components).

## 0.7.5

### Patch Changes

- [#208](https://github.com/vegastack/vegastack-design/pull/208) [`10f8d06`](https://github.com/vegastack/vegastack-design/commit/10f8d06129151232c554e448278847198dad4132) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **AudioPlayer** docks, closes, loads its source lazily and seeks from outside. `docked` pins it to the bottom of its scroll column (sticky, bordered, on the popover surface, clear of the bottom safe area) as a `region` named by `label`. `open` and `onOpenChange` hide it with a close button (`closeLabel`, "Close player") that pauses, reports `false` and returns focus to the control that opened it; a hidden player stays mounted and `inert`, and Escape does not close it. `src` also takes a function, resolved once on the first play. `loading` shows and announces "Loading audio…" (`loadingLabel`) once, and `error` renders an alert with "Try again" (`retryLabel`, `onRetry`). `actionsRef` exposes `seek(seconds, { play })`, `play()` and `pause()`; a seek before the metadata loads is applied when it does. `ref` is still the root element.
  [docs](https://design.vegastack.com/docs/components/audio-player)

- [#208](https://github.com/vegastack/vegastack-design/pull/208) [`10f8d06`](https://github.com/vegastack/vegastack-design/commit/10f8d06129151232c554e448278847198dad4132) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 **NotificationBell** exports `NotificationDot`, the one unread dot for rows, inbox items and nav items (`intent` `default` or `destructive`, decorative), and its dot mode now draws it: **the dot's default intent changes from destructive to primary**, and its `data-slot` is `notification-bell-dot` (the count pill keeps `notification-bell-badge`). A new `countLabel` words the count in the accessible name ("Notifications, 3 unread" by default). **usePlatform** now exports `formatShortcutKey` and `formatShortcut`, which turn `"mod"` into ⌘ on macOS and Ctrl elsewhere; **ShortcutOverlay** uses them and renders the same key labels as before.
  [docs](https://design.vegastack.com/docs/components/notification-bell) · [docs](https://design.vegastack.com/docs/components/shortcut-overlay)

- [#199](https://github.com/vegastack/vegastack-design/pull/199) [`88b7a1e`](https://github.com/vegastack/vegastack-design/commit/88b7a1e909c86d0de8042a891a6cfcfaedca03ee) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 Board lanes show their total as a muted count, lanes and cards have names, and cards can be links. The lane count is now muted `tabular-nums` text instead of a `Badge`, and it shows `count` (the lane's total) when the lane has loaded only some of its cards. [docs](https://design.vegastack.com/docs/components/board)

  - Names: a lane takes a plain-text `label` (required when its `title` is not a string; development warns without one), and `getItemLabel` names each card. Each lane is a region named "Open, 14 tasks" (`countLabel` supplies the noun, default "cards"), the Move menu says "Move to In progress", each card's menu control is "Move Write spec", and move announcements name the card and the lane instead of a column id.
  - Lane states: `loading` shows skeleton cards and marks the lane `aria-busy`; `emptyState` replaces the default "No cards" drop target; `defaultCollapsed` starts a lane collapsed (`collapsed` stays as its alias). "Drag a card here" shows only where a pointer drag can start.
  - Cards as links: `getItemHref` renders a card as a real link (`itemLinkRender` swaps in your router's link). Clicks and modifier clicks are the browser's own, Enter follows the link, and Space still lifts the card into move mode. Card content no longer adds a second tab stop through `TruncatedText`.

- [#196](https://github.com/vegastack/vegastack-design/pull/196) [`d7e9562`](https://github.com/vegastack/vegastack-design/commit/d7e95629a18315a85150a5861dcd15a6dc2ac62f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **LoadMore** — the one "Load more" footer for keyset lists: an outline button that keeps its width and focus while the next batch loads, an error line with Try again, and an optional `endLabel` once the list has ended. `LoadMoreState` (`hasMore`, `onLoadMore`, `loading`, `error`) is the shape lists, board lanes and data hooks pass around.
  [docs](https://design.vegastack.com/docs/components/load-more)

- [#201](https://github.com/vegastack/vegastack-design/pull/201) [`5500590`](https://github.com/vegastack/vegastack-design/commit/550059080d45eb6c11ec94fddc020cdc7a198978) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🔧 `sortable-list` keeps a locked row in the list: a row with `disabled: true` now shows a spacer the size of the handle (`data-slot="sortable-list-handle-spacer"`) and KEEPS its row menu with the Move items disabled, where it used to lose both. New props: `lockedReason` (the accessible description of a locked row's disabled Move items), `renderActions` (inline actions before the row menu), `actionsLabel` (the menu trigger's name) and `layout="grid"` (auto-fill image tiles with the handle and actions over the tile's top corners). The row menu trigger is now named "Actions for {label}" by default, where it was "Move {label}". `use-drag-reorder` gains `columns` (a number or `"auto"`, measured from where items wrap) so ↑/↓ in keyboard move mode step a whole row when a horizontal axis wraps into a grid, and `drag-item` draws the left and right drop-edge hairlines a horizontal axis reports. The component roster in the shipped `vegastack-design-system` skill describes the new surface.

- [#200](https://github.com/vegastack/vegastack-design/pull/200) [`b38e9a7`](https://github.com/vegastack/vegastack-design/commit/b38e9a7f4044afa687091e3a32e8c62a824d1966) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 Transcript is a new component for the text of a recording: timestamped, speaker-labelled lines on MessageScroller's engine.

  - The line playing at `currentTime` gets `aria-current="true"` and stays centred while following. Scrolling the list pauses following, and "Back to current line" brings it back.
  - Each timestamp is a "Play from 0:15" button that calls `onSeek`. Without `onSeek`, timestamps are plain text.
  - `TranscriptSearch` highlights matches with `<mark>`. Enter and Shift+Enter move between them, and each move announces "2 of 5" or "No matches".
  - `loading` and `emptyState` cover the states before there is any text.
  - Add it with `shadcn add @vegastack/transcript`.

## 0.7.4

### Patch Changes

- [#194](https://github.com/vegastack/vegastack-design/pull/194) [`1f11fbc`](https://github.com/vegastack/vegastack-design/commit/1f11fbcfc1ada1a42c98a9f4286b0d2852d7f242) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The docs and the agent skills now state one convention per concern: numbers, page headings, link buttons, theme choice, empty states, view switches, page spacing and the conventions for components we own.

  - Numbers (counts, dates, amounts) are the regular font with `tabular-nums`; `font-mono` is for code and identifiers only. [docs](https://design.vegastack.com/docs/foundations/typography)
  - One page heading: `PageHeader`, `font-heading text-2xl font-semibold`; a section is `font-heading text-base font-medium`.
  - One link-button recipe: `<Link className={buttonVariants({ variant, size })}>`, never `Button render={<Link/>}`. [docs](https://design.vegastack.com/docs/components/button)
  - Theme choice is a Light / Dark / System radio group in the user menu. [docs](https://design.vegastack.com/docs/guides/provider-setup)
  - Two new empty-state tiers, "No matches" and "Couldn't load", plus default copy rules. [docs](https://design.vegastack.com/docs/foundations/empty-states)
  - One view-switch rule: RadioGroup for a form value, ToggleGroup for a view or scope switch, Tabs for page regions, links for URLs.
  - A page-rhythm recipe for gutters and gaps. [docs](https://design.vegastack.com/docs/foundations/spacing)
  - `design.md` gains the conventions for components we own and a component / part / block / example decision tree; the public skill gains "Names hide abilities" and "Which component for X".
  - Registry metadata for button, label, chip, filter-bar-managed, select, command, emoji-picker, chip-input, message-scroller, badge, toggle-group and radio-group now says only what the components do.
  - The shadcn-reset decision register is tracked in git, with true counts (180 rows: 108 shadcn, 72 ours).

## 0.7.3

### Patch Changes

- [#192](https://github.com/vegastack/vegastack-design/pull/192) [`27433fe`](https://github.com/vegastack/vegastack-design/commit/27433fe24ec045ecfc9386d17e439421ab7245ad) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🗑 **Demo blocks** — the registry no longer serves 28 demo blocks that did not meet the rulebook (27 upstream compositions and our `onboarding-01`), and the `@dnd-kit` drag engine they needed is gone with them.

  - Removed: `dashboard-01`, `login-02`…`login-05`, `signup-01`…`signup-05`, `sidebar-01`…`sidebar-16`, `preview-03` and `onboarding-01`.
  - Kept: `login-01`, `app-shell-01`, `board-01`, `settings-01` and the 68 chart blocks.
  - Where each recipe went: shells and the sidebar variants → `app-shell-01` and the Sidebar page; sign-in → `login-01`; sign-up → compose it from `login-01`'s frame with Field and PasswordInput; the dashboard and `preview-03` showcase → `app-shell-01` plus the Chart and Stat pages; the getting-started checklist → the Item page's Checklist example.
  - `@dnd-kit/*` and `thesvg` leave `@vegastack/ui`; `@atlaskit/pragmatic-drag-and-drop` stays the one drag engine, and `Icon`/`BrandIcon` in `@vegastack/design` keep their own `thesvg`.
  - An installed copy of a removed block is yours and keeps working; `shadcn add` of a removed name now fails.
    [docs](https://design.vegastack.com/docs/blocks/app-shell-01)

## 0.7.2

### Patch Changes

- [#183](https://github.com/vegastack/vegastack-design/pull/183) [`c2a246e`](https://github.com/vegastack/vegastack-design/commit/c2a246ea63479a81b8a4174e62343f30caa287dd) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 `vegastack-design doctor` no longer reports a `password-input` import as retired, and the shipped skills stop listing `PasswordInput` among the retired components — it is a registry component again.

## 0.7.1

### Patch Changes

- [#181](https://github.com/vegastack/vegastack-design/pull/181) [`72741b7`](https://github.com/vegastack/vegastack-design/commit/72741b760a741ab3c782ba78ee25e1b44b996a66) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 📚 The shipped `vegastack-design-system` and `vegastack-design-audit` agent skills now name the retired vocabulary and the rules lint enforces.

  The design-system skill's Don't list adds no arbitrary text sizes (`text-[13px]`), no ring as a
  surface edge, and a table of every retired utility, token and component with what to write instead,
  pointing at `vegastack-design doctor` to find them. The audit skill runs `doctor` in its first pass
  and states one rule for copied-in components: don't edit one; if you must, it becomes yours and
  `check-updates` reports it as drifted.

- [#181](https://github.com/vegastack/vegastack-design/pull/181) [`72741b7`](https://github.com/vegastack/vegastack-design/commit/72741b760a741ab3c782ba78ee25e1b44b996a66) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🛠 `vegastack-design doctor` now fails on retired design-system vocabulary in your own source, with `file:line` and the replacement for each.

  A utility the shadcn reset retired compiles to nothing — no build error, no type error — so a
  `text-h2` heading silently renders as body text. The new check scans the project's code and
  stylesheets (skipping `node_modules`, `.next`, `dist` and the `components.json` `ui` directory) for
  `text-h1`…`text-h4`, `text-label`, `text-label-sm`, `text-mono-label`, `text-code`, `text-strong`,
  `text-display-*`, the `-subtle` steps of the four status families (`destructive`, `success`,
  `warning`, `info`), every `--alpha-*` name the system ever shipped (the reset's nineteen plus five retired before it, such as `--alpha-fill-hover`), the retired `--opacity-*` and `--z-raised`/`--z-overlay`/`--z-toast`
  names, `shadow-overlay`, `backdrop-blur-glass`, and imports of the retired `icon-button`,
  `segmented`, `password-input`, `progress-indicator`, `field-inline`, `floating-surface`,
  `section-header` and `sonner` components. Only real usage is reported: an import counts only when
  it resolves into your `components.json` `ui` directory (or `@/components/ui/…`), so your own
  `@/components/layout/section-header` is left alone; `//` and `/* */` comments and prose strings are
  skipped, while JSX text — an apostrophe, a URL, a glob — never hides the real usage after it on
  the same line, and neither does Tailwind's `!` modifier (`hidden!`); a class you define yourself (`@utility text-h2 { … }` or a `.text-strong` rule) or a custom
  property you declare (`--z-header: 30`) is yours; another library's `--z-index` or `--alpha-channel`
  is not ours to call retired; and the kept `--tag-*-subtle` tints are not reported. Every replacement
  is in [Migrating to the shadcn reset](/docs/guides/migrating-shadcn-reset).

- Updated dependencies [[`72741b7`](https://github.com/vegastack/vegastack-design/commit/72741b760a741ab3c782ba78ee25e1b44b996a66)]:
  - @vegastack/design-tokens@0.7.1

## 0.7.0

### Patch Changes

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

- Updated dependencies [[`76fa8d3`](https://github.com/vegastack/vegastack-design/commit/76fa8d3171a81226dd2bfd29ba676a699353e8e6)]:
  - @vegastack/design-tokens@0.7.0

## 0.6.1

### Patch Changes

- [#163](https://github.com/vegastack/vegastack-design/pull/163) [`997dfb8`](https://github.com/vegastack/vegastack-design/commit/997dfb89dfacff822a43bc468bb4d7b248fc2ad8) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - 🐛 Publish concrete dependency ranges so fresh npm and pnpm consumers can install the package outside the VegaStack workspace.

## 0.6.0

### Minor Changes

- [#162](https://github.com/vegastack/vegastack-design/pull/162) [`14c88ce`](https://github.com/vegastack/vegastack-design/commit/14c88ce14a3849f7f12af2720373fd78f88e388c) Thanks [@dev-mahesh-peerxp](https://github.com/dev-mahesh-peerxp)! - 📚 Teach consumers to use SearchInput for token-safe, cross-browser search clearing and FilterBar-compatible search behavior.

## 0.5.0

### Minor Changes

- [#151](https://github.com/vegastack/vegastack-design/pull/151) [`72ae827`](https://github.com/vegastack/vegastack-design/commit/72ae827666bc9b03cd6d197e27cd3e0ec9ee0044) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - ⚠️ **The shadcn `base-nova` reset — the runtime and token bridge are rebuilt on shadcn `base-nova`, with no compatibility layer.**

  The optional `lucide-react` peer range moves to `^1.47.0`, matching the version the system is built
  and tested against; a consumer on an older lucide should upgrade alongside this release.

  `cn` is plain `twMerge` again, because the custom font-size class group it extended no longer exists,
  and seven shared class-string recipes are **deleted with no alias**: `surfaceInteractive`,
  `surfaceInteractiveGroup`, `fillInteractive`, `FillTone`, `fieldControl`, `fieldControlGroup` and
  `selectedChipVariants`. Each described a system — a three-rung surface ladder, a per-tone fill map, a
  shared text-entry chrome, a raised-chip recipe — that the reset deleted; replace each with the literal
  it expanded to, or compose the upstream component it was re-deriving. `cn`, `TIMINGS`, `FLOATING`,
  `mergeRefs`, `prose`/`proseClassName`, the icon runtime, the Tailwind preset and the
  `vegastack-design` CLI are unchanged. The shipped agent skills are rewritten for the new vocabulary.

  **Who this affects:** every consumer. Nothing is deprecated first — an import of a removed export
  fails to resolve. The complete break, with a replacement for each removed export, is
  the migration guide § 6.

### Patch Changes

- Updated dependencies [[`72ae827`](https://github.com/vegastack/vegastack-design/commit/72ae827666bc9b03cd6d197e27cd3e0ec9ee0044)]:
  - @vegastack/design-tokens@0.5.0

## 0.4.1

### Patch Changes

- [#142](https://github.com/vegastack/vegastack-design/pull/142) [`6ec9d54`](https://github.com/vegastack/vegastack-design/commit/6ec9d54fd6b53e1b60c3b25705b4bfea3779be6b) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - 🧩 **Selection controls** — Give ToggleGroup, Segmented, and pill Tabs a persistent semantic boundary, and use Segmented for the documentation preview's device modes.

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

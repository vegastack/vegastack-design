# Component roster

<!-- GENERATED — do not hand-edit. Regenerated from the design system's component contract,
     which is the authority for membership and counts. -->

**126 components**, plus 467 animated-icon items, 13 hooks (`use-animation-replay`, `use-announcer`, `use-async-search`, `use-drag-reorder`, `use-file-drop`, `use-inline-edit`, `use-list-nav`, `use-media-query`, `use-mobile`, `use-modal-inert`, `use-overflow`, `use-platform`, `use-tabs-swipe`), 10 starter blocks (`app-shell-01`, `board-01`, `command-search-01`, `list-page-01`, `login-01`, `notifications-01`, `review-split-01`, `settings-01`, `settings-02`, `status-pages-01`), 68 chart blocks across 7 families, and 3 data libs (`date-time`, `geo-data`, `drag-item`) — 687 registry items in total.

Install any of them with `shadcn add @vegastack/<name>`. Animated icons install as
`@vegastack/icon-<name>`; the bare name is reserved for components, so a component whose name
starts with `icon-` is a component and never an icon.

## Actions

- **`button`** — Trigger an action — upstream's six variants and eight sizes, plus a loading state (API-5).
- **`button-group`** — Joins buttons, inputs, selects and dropdowns into one connected control group — horizontal or vertical, with a separator and a text addon.
- **`copy-button`** — Copy a value to the clipboard with transient check feedback — a ghost icon button that swaps Copy → Check and fires onCopied.
- **`toggle`** — A two-state button that can be pressed on or off, with a loading state (API-5).
- **`toggle-group`** — Toggle buttons sharing one selection — single or multiple, horizontal or vertical.

## Form

- **`auto-save-input`** — An input that debounces edits and persists them via an async onSave, with an inline idle/saving/saved/error status.
- **`calendar`** — A date-field calendar on React DayPicker — single, multiple and range selection.
- **`checkbox`** — A binary (or indeterminate) toggle on Base UI Checkbox, with a 24px invisible hit area (A11Y-2).
- **`chip-input`** — Free-token entry field — Enter/comma/paste commits chips, Backspace removes, per-chip validation marks invalid entries instead of dropping them. InputGroup field chrome + real Tag chips.
- **`color-picker`** — A swatch-triggered popover presenting a grid of preset colors — pick one, fire onValueChange, mark the selection.
- **`combobox`** — A filterable listbox behind a text input — grouped items, an announced empty state and a chips mode.
- **`country-select`** — A searchable country picker returning the ISO 3166-1 alpha-2 code, with flag + name. A thin wrapper over SearchableSelect fed by the geo-data item.
- **`date-picker`** — Pick a single date or a date range from a calendar popover — token-styled, keyboard-navigable, with optional quick presets.
- **`dropzone`** — File acquisition surface — drop, click-to-browse, and paste — as a thin shell over use-file-drop; the surface is the named focusable control over a hidden picker-bridge input; data-dragging/data-drag-invalid styling flags.
- **`editable-cell`** — Inline-editable value whose edit mode looks like view — same box, inherited type, no border — with optimistic saves, a delayed spinner, rollback plus a Retry toast on failure, required, multiline, table-cell and heading variants, and a typed text/select/custom editor registry.
- **`emoji-picker`** — A popover with a searchable, category-grouped grid of emoji that returns the selected character via onValueChange (curated set, not full Unicode).
- **`field`** — The form-field scaffold — label, description, error, legend, separator and choice-card layouts.
- **`input`** — A styled Base UI input for every text-entry type, with the text-entry focus border tint (FOC-3).
- **`input-group`** — An input or textarea with addons — icons, text, buttons, kbd hints and spinners on one surface.
- **`input-otp`** — A one-time-password field with per-character slots, driven by one hidden input.
- **`label`** — A styled native label for form controls.
- **`native-select`** — The platform <select>, tokenized — the OS picker on mobile, with option groups.
- **`number-field`** — Locale-aware numeric input on Base UI's NumberField in upstream's InputGroup chrome, with full-height flanking steppers.
- **`password-input`** — A password field with a show/hide toggle, composed from InputGroup, forwarding native input props and the ref to the inner input.
- **`radio-group`** — Mutually-exclusive options with arrow-key navigation and a 24px invisible hit area (A11Y-2).
- **`record-chip`** — A pill that shows the record something belongs to and picks another: icon, name and a chevron as a picker trigger, plus an arrow link to the record.
- **`region-select`** — A searchable picker of states/provinces for a country, with a free-text fallback for countries with no subdivisions. A thin wrapper over SearchableSelect fed by the geo-data item.
- **`search-input`** — A token-safe search field with a consistent clear action and controlled or uncontrolled native input semantics.
- **`searchable-select`** — The Select-shaped Combobox preset: a full-width trigger, an in-panel search field, a tick on the selected row (matched by key, so async options tick too), a standard person option (name plus muted email, both searched) and an optional clear control. Single or multiple, controlled through value/onValueChange.
- **`select`** — A dropdown for one value — trigger, grouped scrollable popup and item-aligned positioning.
- **`slider`** — A number or range over a continuous track — horizontal or vertical, any number of thumbs.
- **`switch`** — An on/off toggle for instant settings — two sizes and a 24px invisible hit area (A11Y-2).
- **`textarea`** — A styled native textarea that grows with its content, with the text-entry focus border tint (FOC-3).

## Display

- **`chip`** — The one labelled pill primitive — 10 decorative hues, two tiers, an optional selection rung, and a real 24x24 remove control. Behind Tag and FilterChip; ComboboxChip is Base UI's own chip, not this primitive.
- **`code-block`** — A code panel with a language header and copy affordance — the shared code surface for chat transcripts, docs, and examples.
- **`meta-line`** — An icon + text meta line under a record title: wrapping facts such as type, date and time, duration and owner, in the muted ink.
- **`stat`** — A labelled value block — muted label over a value, honest faint empty state, optional delta line. Two scales.
- **`tag-group`** — Hue-tinted label chips on the 10-hue tag palette, with +N overflow collapsing and removable tags.

## Data display

- **`accordion`** — A vertically stacked set of interactive headings that each reveal a section of content — one open at a time, or several.
- **`animated-number`** — A number display that tweens from its previous value to a new one on every change — Intl.NumberFormat-aware (currency/percent/compact), instant under reduced motion, the dashboard stat-card counter.
- **`avatar`** — A circular user or entity image with a fallback, a badge, and an overlapping group.
- **`badge`** — A compact label or status chip — upstream's six variants plus our four status tones (COL-12).
- **`card`** — A content surface with composable header, content, footer and action parts.
- **`carousel`** — A slide track with previous and next controls — horizontal or vertical, any slide size or spacing, Embla options, events and plugins.
- **`chart`** — A themed Recharts wrapper — a ChartConfig that maps each series to a colour and a label, a bordered tooltip and legend, and Recharts' own built-in keyboard + screen-reader layer.
- **`collapsible`** — An interactive component which expands and collapses a panel, with an animated height and a trigger you supply.
- **`empty`** — A zero-data placeholder — always an icon (the icon prop, Inbox by default), title, description and a content slot, with a compact sm size for inline empties. The one empty-state markup: DataList's emptyState and noResults (SearchX, "No matches", Clear filters) are built on it.
- **`item`** — A composable row for list and feed content — media, title, description, actions — with a highlighted flash for a just-changed row.
- **`kbd`** — A keyboard-key chip, and a group that lays several of them out inline.
- **`markdown-view`** — Render a markdown string to safe, token-styled HTML — headings, lists, code, blockquotes, links, GFM tables — XSS-safe, no raw HTML.
- **`priority-icon`** — A flag marking priority — urgent, high, medium, low, none — each in a semantic color with filled, outline or dashed fill.
- **`relative-time`** — One Intl-based dates & times module — formatRelative, formatDuration, formatDate, formatDateTime, formatDateRange, formatTimeOfDay, formatDueLabel, groupByDay, time-zone cookie + provider — and the RelativeTime, DateTime, Duration and DueLabel components with absolute-time tooltips.
- **`status-icon`** — A small status indicator icon — todo, in progress, blocked, done, cancelled — each mapping to a lucide icon and semantic color.
- **`table`** — A responsive table component — caption, header, body, footer, row, head and cell parts over semantic table markup.
- **`timeline`** — Rail geometry for chronological records — a continuous connector with a node per entry. Rows compose Item parts; separators render through Marker; entries carry content-visibility render skipping.
- **`truncated-text`** — Truncate text to one line or N lines with an ellipsis, revealing the full text in a tooltip only when it overflows — with per-region control over the tab stop.

## Data

- **`board-card`** — A work item as a board card — a round completion tick, a two-line title, a muted context line, and a bottom row with the due chip (destructive when overdue, warning when due today), the priority chip, a source icon and the assignee's avatar.
- **`data-grid`** — The full-parity grid — TanStack-sorted multi-key sort, column picker with responsive revelation, collapsible grouping, keyboard-continuous load-more, opt-in virtualization, and an APG grid keyboard layer with inline cell editing.
- **`data-list`** — A generic, typed data table — configurable columns, row selection, sortable columns (indicator, custom compare and first direction, client or manual), a standard rowActions ⋯ column always last, untinted-link rows (no underline), loading, and Empty-based emptyState and noResults states.
- **`data-list-pager`** — A controlled paging footer for DataList — a tabular-numeral range summary, a rows-per-page Select, and a windowed Pagination that hides on a single page.
- **`data-table-parts`** — The chrome DataList and DataGrid share — sort header, selection cells, skeleton rows, the empty row, column class rules, and the selection/sort/controlled-state hooks.
- **`filter-bar`** — The two-row toolbar above a list or table — search (~320px) left; a Filters (n) toggle, scope Tabs and the view switch right; compact rounded-md filter chips (FilterBarFacet, DateRangeFilter with presets) on a toggled row 12px below that scrolls sideways on a phone.
- **`filter-bar-managed`** — The controlled nested and/or filter builder — host-injected field grammar (vocabulary + per-type value editors), depth and condition caps, focus-managed removal, and a removable FilterChip summary.
- **`load-more`** — The shared Load more footer for keyset lists — an outline button that keeps its width while loading, an error line with Try again, and an optional end caption.
- **`media-card`** — A record as a card — an image, the title, a meta line, a badge and a ⋯ menu — where the whole card is one link.
- **`person-hover-card`** — Stacked avatars with a hover card per person — a compact card with a 32px avatar, with the name and muted email beside it — and the rest behind "+N".
- **`property-list`** — Record-facts rows: an icon+label column beside a value column, as an accessible definition list.
- **`record-aside`** — The cards of a record page's right rail — titled sections of inline properties, people, linked records and full-width action rows.
- **`sortable-list`** — Reorderable rows or tiles on ItemGroup/Item via use-drag-reorder — pointer drag with drop indicators, keyboard move mode, a lossless row menu, locked rows, inline actions, a grid layout, and server-refusable moves. Controlled; the host owns the order.
- **`thumbnail`** — A small rounded, cover-fit image, 32 or 48px, with a fallback for records that have no image.
- **`view-toggle`** — The Grid | List | Board icon switch for a list page, labels hidden on a phone.

## Overlay

- **`alert-dialog`** — A modal that interrupts for a decision — an optional media slot, two sizes and an action/cancel footer.
- **`context-menu`** — The same menu vocabulary opened by right-click, positioned at the pointer.
- **`dialog`** — A modal overlay — backdrop, centred popup, a plain right-aligned footer and an optional close button; opens onto the first field or the popup, never the close ×.
- **`drawer`** — A swipeable panel with snap points — four directions, a swipe handle, nesting and a non-modal mode.
- **`dropdown-menu`** — An anchored action menu — items, submenus, checkboxes, radio groups, shortcuts and a destructive variant.
- **`hover-card`** — A preview surface that opens on hover or focus, with configurable delays and sides.
- **`panel-search`** — The sticky, box-free search row a filtering popup puts at the top of its panel (decision OVL-11) — shared by EmojiPicker and ShortcutOverlay.
- **`popover`** — An anchored, dismissible surface for secondary content, with a header, title and description.
- **`sheet`** — A panel that slides in from any edge — Dialog semantics with a side, a header and a footer; opens onto the first field, never the close ×; a left sheet can dock beside the sidebar rail (beside).
- **`shortcut-overlay`** — The ?-triggered dialog listing keyboard shortcuts, rendered from a declaration registry (keys, label, category, when) — grouped, filterable, platform-aware via use-platform + Kbd.
- **`tooltip`** — A floating label on hover or focus, portaled inside the theme scope (OVL-13).

## Navigation

- **`breadcrumb`** — A hierarchical navigation trail — links, separators, the current page, and ellipsis collapse for long paths.
- **`command`** — A searchable command palette — filtered, grouped items with keyboard navigation, optionally inside a ⌘K dialog.
- **`menubar`** — A persistent horizontal bar of menus — application-style File / Edit / View navigation.
- **`multi-step-form`** — A guarded, branching flow around a Stepper — conditional steps, sync and async advance guards, locking, reachability-derived deep links and resume, and a phone layout chosen from the same predicate. Owns no fields and no validator.
- **`navigation-menu`** — A collection of links for navigating websites — triggers that open one shared panel, and plain links styled to match.
- **`page-header`** — The standardized header at the top of a page — back button, breadcrumb trail, title, description, actions, secondary menu, and a favorite star — plus SectionHeading for in-page section titles (sm and md sizes, a muted eyebrow variant, trailing actions).
- **`pagination`** — Page navigation — previous/next, numbered page links, an ellipsis for long ranges, and the active page.
- **`sidebar`** — A collapsible app navigation rail — header/content/footer, labelled groups, menu items with active and open (menu-trigger) states, and an expand/collapse trigger.
- **`stepper`** — A bounded linear process as an ordered list — seven step states on a numbered rail that fills in behind you, aria-current=step, orientation chosen from the step count, and a compact summary below a container width.
- **`tabs`** — Layered content sections — default (segmented) or line variants, compact size, optional leading icons and counts, horizontal or vertical, full keyboard navigation. Toolbar switches use default Tabs: scope (My tasks | Team tasks) and views, whose List/Board/Grid switch is ViewToggle (default Tabs with icons). The one component that keeps a focus ring.

## Feedback

- **`action-bar`** — Floating contextual bar — status region + action children, CSS-only enter/exit, raised band. Bulk selection, unsaved changes, and batch progress are recipes over it.
- **`alert`** — A status banner — upstream's two variants plus our three extra status tones (COL-12); buttons inside a status alert hover in the family's own tint and ink, never white.
- **`progress`** — Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.
- **`provider`** — The single app-root wrapper — theme (next-themes), Base UI toasts, tooltip delays, and text direction in one mount-once component.
- **`skeleton`** — A pulsing placeholder that reserves layout space while content loads.
- **`spinner`** — An indeterminate loading indicator that inherits its host's ink.
- **`status-line`** — A slim inline status: info, progress (spinner) or error (destructive ink, role=alert), with an optional inline action.
- **`toast`** — Brief, non-blocking notifications — a stacking Base UI Toast surface with typed icons, actions and promise toasts.

## Layout

- **`app-shell`** — The shared dashboard layout — a skip-linked sidebar + header + scrollable main region, composing Sidebar/SidebarTrigger into one reusable, hash-tracked shell.
- **`aspect-ratio`** — Constrains its children to a given width-to-height ratio.
- **`board`** — Kanban lanes — full-height lanes that scroll their cards inside, sticky headers with a collapse menu, + Add at each lane's foot, Nothing here / Drop here empty zones, per-lane skeletons and load-on-scroll paging; live pointer and touch drag (lift, make room, settle, edge auto-scroll), a keyboard pick-up/move/drop model, a per-card ⋯ menu of the card's own actions, optimistic moves with rollback and a toast, and one lane at a time on a phone.
- **`direction`** — Base UI's DirectionProvider and useDirection — the text-direction context components read.
- **`record-layout`** — A record page's main column beside a sticky right rail of cards, with an ⓘ Details sheet in its place on small screens.
- **`resizable`** — Accessible resizable panel groups and layouts with keyboard support — horizontal or vertical, nestable, with an optional visible grip.
- **`scroll-area`** — Augments native scroll functionality for custom, cross-browser styling — a viewport, an auto-hiding scrollbar, and a corner.
- **`separator`** — A thin rule dividing content — horizontal or vertical, built on Base UI.
- **`settings-row`** — A borders-only settings layout — titled sections, bordered cards, and label-plus-control rows.

## Media

- **`audio-player`** — A compact custom audio transport with play/pause, skip, seek, a tappable speed control, and keyboard shortcuts — a single line on a wide player, two lines with an optional transcript control on a narrow, mobile-width player; a floating pill variant and a global AudioPlayerProvider + useGlobalPlayer that keep one recording playing across routes.
- **`image`** — A presentational framed image with aspect-ratio, rounding, a loading skeleton, and an error fallback.
- **`inbox`** — The notification Inbox: frame with header actions, All | Unread chips, sticky day groups, full-bleed rows with avatar or icon and an unread tint (no dot), rich titles, action chips, a fixed right column with the time over the hover actions (read toggle and menu), and empty, loading and error states.
- **`media-player-controls`** — The shared media transport — play/pause, skip, seek, elapsed/duration, mute + volume, playback speed, and one keyboard shortcut map (useMediaShortcuts) — composed by Audio Player and Video Player.
- **`notification-bell`** — A bell icon button with an unread-count badge overlay, plus the shared NotificationDot unread marker. Presentational — the app supplies the count.
- **`video-player`** — A framed video player with the same grouped custom transport controls as Audio Player.

## Rich text

- **`text-edit`** — A Tiptap-based rich-text editor with a compact, token-styled toolbar (bold, italic, strike, heading, lists, blockquote, code) — controlled HTML in, HTML out. Collaboration deferred.

## Chat

- **`tool-call-chip`** — An agent-activity chip — tool action label + muted result meta, optionally rendered as a button.

## Communication

- **`attachment`** — A file chip / thumbnail card for chat, record-file and upload-queue surfaces — media slot, name + meta, idle/uploading/processing/error/done states, determinate progress, a muted tile, an actions row, a full-bleed trigger, and a scrolling or grid group.
- **`bubble`** — A chat speech bubble - 7 token-driven variants (incl. brand-tinted), start/end alignment, interactive content, and a floating reactions chip.
- **`marker`** — An inline conversation marker - status lines, system notes, and labelled dividers. 3 variants, Base UI render-polymorphic.
- **`message`** — Layout primitives for a conversation row - avatar anchoring, content column, header/footer slots, start/end alignment. Server-safe.
- **`message-scroller`** — An auto-scrolling conversation viewport (not virtualised) - pins to the latest message, preserves position on prepend, tracks the anchor, and a floating scroll-to-end button.
- **`questionnaire`** — A guided one-question-at-a-time form — choices, freeform answers, skip, shortcuts, validation, resume and conditional items, built on the @shadcn/react questionnaire state machine.
- **`transcript`** — A timestamped, speaker-labelled transcript on MessageScroller's primitive - turns with a coloured speaker dot, the line playing at currentTime followed with a Back to current line button, seek from each timestamp, highlighted announced search, speaker chips with rename, and progressive mounting of long transcripts.

## Marketing

- **`announcement-banner`** — A dismissible one-line announcement — the full-width inverse page-top band (in-content notices use Alert variant=strip).
- **`terminal`** — A dark mono command block with a phosphor prompt glyph and a composed copy button.

# Component roster

<!-- GENERATED — do not hand-edit. Regenerated from the design system's component contract,
     which is the authority for membership and counts. -->

**128 components**, plus 467 animated-icon items, 11 hooks (`use-animation-replay`, `use-announcer`, `use-drag-reorder`, `use-file-drop`, `use-inline-edit`, `use-list-nav`, `use-media-query`, `use-mobile`, `use-modal-inert`, `use-overflow`, `use-platform`), 1 starter block (`dashboard-01`), and 2 data libs (`geo-data`, `drag-item`) — 609 registry items in total.

Install any of them with `shadcn add @vegastack/<name>`. Animated icons install as
`@vegastack/icon-<name>`; the bare name is reserved for components, so `icon-button` is the
component and never an icon.

## Actions

- **`button`** — Trigger an action — upstream's six variants and eight sizes, plus a loading state (API-5).
- **`button-group`** — Joins buttons, inputs, selects and dropdowns into one connected control group — horizontal or vertical, with a separator and a text addon.
- **`copy-button`** — Copy a value to the clipboard with transient check feedback — a ghost icon button that swaps Copy → Check and fires onCopied.
- **`icon-button`** — A square or round icon-only action button — a thin Button wrapper that requires an accessible label.
- **`segmented`** — Segmented control — a single-select, always-one-selected view/mode switcher on a muted track with a raised active chip.
- **`split-button`** — A primary action joined to a dropdown of related secondary actions — one default click, plus a chevron menu.
- **`toggle`** — A two-state button that can be pressed on or off, with a loading state (API-5).
- **`toggle-group`** — Toggle buttons sharing one selection — single or multiple, horizontal or vertical.

## Form

- **`auto-save-input`** — An input that debounces edits and persists them via an async onSave, with an inline idle/saving/saved/error status.
- **`calendar`** — A date-field calendar on React DayPicker — single, multiple and range selection.
- **`checkbox`** — A binary (or indeterminate) toggle on Base UI Checkbox, with a 24px invisible hit area (A11Y-2).
- **`checkbox-group`** — Shared state for a set of checkboxes, with first-class “select all” — parent, mixed, and the whole-set toggle, built on Base UI Checkbox Group.
- **`chip-input`** — Free-token entry field — Enter/comma/paste commits chips, Backspace removes, per-chip validation marks invalid entries instead of dropping them. Combobox field chrome + real Tag chips.
- **`color-picker`** — A swatch-triggered popover presenting a grid of preset colors — pick one, fire onValueChange, mark the selection.
- **`combobox`** — A filterable listbox behind a text input — grouped items, an announced empty state and a chips mode.
- **`country-select`** — A searchable country picker returning the ISO 3166-1 alpha-2 code, with flag + name. A thin wrapper over SearchableSelect fed by the geo-data item.
- **`date-picker`** — Pick a single date or a date range from a calendar popover — token-styled, keyboard-navigable, with optional quick presets.
- **`dropzone`** — File acquisition surface — drop, click-to-browse, and paste — as a thin shell over use-file-drop; the surface is the named focusable control over a hidden picker-bridge input; data-dragging/data-drag-invalid styling flags.
- **`editable-cell`** — Inline-editable value with an async commit lifecycle — optimistic display, saving/saved/error status, revert on a rejected write, and a typed text/select/custom editor registry.
- **`emoji-picker`** — A popover with a searchable, category-grouped grid of emoji that returns the selected character via onSelect (curated set, not full Unicode).
- **`field`** — The form-field scaffold — label, description, error, legend, separator and choice-card layouts.
- **`field-inline`** — Click-to-edit text — displays a value, swaps to a focused input on click, commits on Enter or blur, cancels on Escape.
- **`input`** — A styled Base UI input for every text-entry type, with the text-entry focus border tint (FOC-3).
- **`input-group`** — An input or textarea with addons — icons, text, buttons, kbd hints and spinners on one surface.
- **`input-otp`** — A one-time-password field with per-character slots, driven by one hidden input.
- **`label`** — A styled native label for form controls.
- **`native-select`** — The platform <select>, tokenized — the OS picker on mobile, with option groups.
- **`number-field`** — Locale-aware numeric input on Base UI's NumberField in Input's field chrome — Intl formatting (money is a format prop), min/max/step, keyboard stepping, wheel scrub, full-height steppers.
- **`otp-input`** — A multi-slot one-time-passcode input — keyboard navigation, paste distribution, masking, disabled, built on Base UI OTP Field.
- **`password-input`** — A password field with a show/hide eye toggle and an optional live requirements checklist.
- **`radio-group`** — Mutually-exclusive options with arrow-key navigation and a 24px invisible hit area (A11Y-2).
- **`region-select`** — A searchable picker of states/provinces for a country, with a free-text fallback for countries with no subdivisions. A thin wrapper over SearchableSelect fed by the geo-data item.
- **`searchable-select`** — The Select-shaped Combobox preset: a full-width trigger, an in-panel search field, a check on the selected row and an optional clear control. Single-select, controlled through value/onValueChange.
- **`select`** — A dropdown for one value — trigger, grouped scrollable popup and item-aligned positioning.
- **`slider`** — A number or range over a continuous track — horizontal or vertical, any number of thumbs.
- **`switch`** — An on/off toggle for instant settings — two sizes and a 24px invisible hit area (A11Y-2).
- **`textarea`** — A styled native textarea that grows with its content, with the text-entry focus border tint (FOC-3).

## Display

- **`chip`** — The one labelled pill primitive — 10 decorative hues, two tiers, an optional selection rung, and a real 24x24 remove control. Behind Tag, FilterChip and Combobox chips.
- **`code-block`** — A code panel with a language header and copy affordance — the shared code surface for chat transcripts, docs, and examples.
- **`onboarding-checklist`** — A getting-started card — segmented progress + step rows, collapsible to a progress pill.
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
- **`empty`** — A zero-data placeholder — media, title, description and a content slot.
- **`item`** — A composable row for list and feed content — media, title, description, actions.
- **`kbd`** — A keyboard-key chip, and a group that lays several of them out inline.
- **`markdown-view`** — Render a markdown string to safe, token-styled HTML — headings, lists, code, blockquotes, links, GFM tables — XSS-safe, no raw HTML.
- **`relative-time`** — Render a date as a human-relative string ("2 hours ago", "yesterday") with native Intl.RelativeTimeFormat — self-updating, with an absolute-date tooltip.
- **`status-icon`** — A small status indicator icon — todo, in progress, blocked, done — each mapping to a lucide icon and semantic color.
- **`table`** — A responsive table component — caption, header, body, footer, row, head and cell parts over semantic table markup.
- **`timeline`** — Rail geometry for chronological records — a continuous connector with a node per entry. Rows compose Item parts; separators render through Marker; entries carry content-visibility render skipping.
- **`truncated-text`** — Truncate text to one line or N lines with an ellipsis, revealing the full text in a tooltip only when it overflows — with per-region control over the tab stop.

## Data

- **`data-grid`** — The full-parity grid — TanStack-sorted multi-key sort, column picker with responsive revelation, collapsible grouping, keyboard-continuous load-more, opt-in virtualization, and an APG grid keyboard layer with inline cell editing.
- **`data-list`** — A generic, typed data table — configurable columns, row selection, sortable headers, plus loading and empty states.
- **`data-table-parts`** — The chrome DataList and DataGrid share — sort header, selection cells, skeleton rows, the empty row, column class rules, and the selection/sort/controlled-state hooks.
- **`filter-bar`** — A row of removable filter chips, an "Add filter" dropdown, and an optional search input — for list and table filter toolbars.
- **`filter-bar-managed`** — The stateful nested and/or filter builder — host-injected field grammar (vocabulary + per-type value editors), depth and condition caps, focus-managed removal, and a removable FilterChip summary.
- **`property-list`** — Record-facts rows: an icon+label column beside a value column, as an accessible definition list.
- **`sortable-list`** — Reorderable rows on ItemGroup/Item via use-drag-reorder — pointer drag with drop indicators, keyboard move mode, a lossless Move menu, and server-refusable moves. Controlled; the host owns the order.

## Overlay

- **`alert-dialog`** — A modal that interrupts for a decision — an optional media slot, two sizes and an action/cancel footer.
- **`context-menu`** — The same menu vocabulary opened by right-click, positioned at the pointer.
- **`dialog`** — A modal overlay — a backdrop, a centred popup, an optional close button and a sticky footer band.
- **`drawer`** — A swipeable panel with snap points — four directions, a swipe handle, nesting and a non-modal mode.
- **`dropdown-menu`** — An anchored action menu — items, submenus, checkboxes, radio groups, shortcuts and a destructive variant.
- **`floating-surface`** — The shared floating-overlay module: one Portal/Positioner/Popup composer, the popup surface recipes, the list-item recipe, and the in-panel search row.
- **`hover-card`** — A preview surface that opens on hover or focus, with configurable delays and sides.
- **`popover`** — An anchored, dismissible surface for secondary content, with a header, title and description.
- **`sheet`** — A panel that slides in from any edge — Dialog semantics with a side, a header and a footer.
- **`shortcut-overlay`** — The ?-triggered dialog listing keyboard shortcuts, rendered from a declaration registry (keys, label, category, when) — grouped, filterable, platform-aware via use-platform + Kbd.
- **`tooltip`** — A floating label on hover or focus, portaled inside the theme scope (OVL-13).

## Navigation

- **`breadcrumb`** — A hierarchical navigation trail — links, separators, the current page, and ellipsis collapse for long paths.
- **`command`** — A searchable command palette — filtered, grouped items with keyboard navigation, optionally inside a ⌘K dialog.
- **`menubar`** — A persistent horizontal bar of menus — application-style File / Edit / View navigation.
- **`navigation-menu`** — A collection of links for navigating websites — triggers that open one shared panel, and plain links styled to match.
- **`page-header`** — The standardized header at the top of a page — back button, breadcrumb trail, title, description, actions, secondary menu, and a favorite star.
- **`pagination`** — Page navigation — previous/next, numbered page links, an ellipsis for long ranges, and the active page.
- **`sidebar`** — A composable, themeable and customizable sidebar — a provider, a collapsible panel with header, content and footer, labelled groups, menu rows with actions, badges and submenus, a rail and a trigger.
- **`stepper`** — A bounded linear process as an ordered list — complete/current/upcoming/error states on StatusIcon's vocabulary, aria-current=step, advance-gating message, focus follows the process.
- **`tabs`** — A set of layered sections of content — known as tab panels — that are displayed one at a time.

## Feedback

- **`action-bar`** — Floating contextual bar — status region + action children, CSS-only enter/exit, raised band. Bulk selection, unsaved changes, and batch progress are recipes over it.
- **`alert`** — A status banner — upstream's two variants plus our three extra status tones (COL-12).
- **`progress`** — Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.
- **`progress-indicator`** — A compact circular pie-fill progress indicator (0–100%) with optional visible percentage variants.
- **`provider`** — The single app-root wrapper — theme (next-themes), Base UI toasts, tooltip delays, and text direction in one mount-once component.
- **`skeleton`** — A pulsing placeholder that reserves layout space while content loads.
- **`sonner`** — The sonner toaster, themed onto the token contract — an alternative notification engine with its own imperative API.
- **`spinner`** — An indeterminate loading indicator that inherits its host's ink.
- **`toast`** — Brief, non-blocking notifications — a stacking Base UI Toast surface with typed icons, actions and promise toasts.

## Layout

- **`app-shell`** — The shared dashboard layout — a skip-linked sidebar + header + scrollable main region, composing Sidebar/SidebarTrigger into one reusable, hash-tracked shell.
- **`aspect-ratio`** — Constrains its children to a given width-to-height ratio.
- **`board`** — Kanban columns over use-drag-reorder — content/chrome split (host renders card content only), pointer drag, keyboard move mode + roving focus, lossless per-card Move menu with lock reasons, server-refusable moves, collapsed lanes, Empty-bordered drop targets.
- **`direction`** — Base UI's DirectionProvider and useDirection — the text-direction context components read.
- **`resizable`** — Accessible resizable panel groups and layouts with keyboard support — horizontal or vertical, nestable, with an optional visible grip.
- **`scroll-area`** — Augments native scroll functionality for custom, cross-browser styling — a viewport, an auto-hiding scrollbar, and a corner.
- **`separator`** — A thin rule dividing content — horizontal or vertical, built on Base UI.
- **`settings-row`** — A borders-only settings layout — titled sections, bordered cards, and label-plus-control rows.

## Media

- **`audio-player`** — A custom audio transport with play/pause, skip, seek, a tappable speed control, and keyboard shortcuts (mute on the M key); a single line on a wide player, two lines with an optional transcript control on a narrow, mobile-width player.
- **`image`** — A presentational framed image with aspect-ratio, rounding, a loading skeleton, and an error fallback.
- **`media-player-controls`** — The shared media transport — play/pause, skip, seek, elapsed/duration, mute + volume, playback speed, and one keyboard shortcut map (useMediaShortcuts) — composed by Audio Player and Video Player.
- **`notification-bell`** — A bell icon button with an unread-count badge overlay. Presentational — the app supplies the count.
- **`video-player`** — A framed video player with the same grouped custom transport controls as Audio Player.

## Rich text

- **`text-edit`** — A Tiptap-based rich-text editor with a compact, token-styled toolbar (bold, italic, strike, heading, lists, blockquote, code) — controlled HTML in, HTML out. Collaboration deferred.

## Chat

- **`tool-call-chip`** — An agent-activity chip — tool action label + muted result meta, optionally rendered as a button.

## Communication

- **`attachment`** — A file chip / thumbnail card for chat and message-compose surfaces — media slot, name + meta, idle/uploading/processing/error/done states, an actions row and a full-bleed trigger.
- **`bubble`** — A chat speech bubble - 7 token-driven variants (incl. brand-tinted), start/end alignment, interactive content, and a floating reactions chip.
- **`marker`** — An inline conversation marker - status lines, system notes, and labelled dividers. 3 variants, Base UI render-polymorphic.
- **`message`** — Layout primitives for a conversation row - avatar anchoring, content column, header/footer slots, start/end alignment. Server-safe.
- **`message-scroller`** — A virtualised, auto-scrolling conversation viewport - pins to the latest message, preserves position on prepend, tracks the anchor, and a floating scroll-to-end button.
- **`questionnaire`** — A guided one-question-at-a-time form — choices, freeform answers, skip, shortcuts, validation, resume and conditional items, built on the @shadcn/react questionnaire state machine.

## Marketing

- **`announcement-banner`** — A dismissible one-line announcement — the full-width inverse page-top band (in-content notices use Alert variant=strip).
- **`comparison-matrix`** — A plan-feature matrix with accessible ✓/− availability cells and a highlighted plan column.
- **`figure-frame`** — A sharp-cornered media frame with an optional mono FIG-annotation caption.
- **`logo-row`** — A muted logo/wordmark strip — alpha-dimmed at rest, restoring on hover for linked items.
- **`marketing-surface`** — Opts a subtree into the brand's dark warm ground, independent of the page's .dark class.
- **`particle-field`** — A deterministic, very-low-alpha canvas field of drifting phosphor dots — hero atmosphere only.
- **`pricing-section`** — Marketing plan cards — mono price display, check feature lists, highlighted-plan treatment.
- **`ruled-band`** — A hairline-bounded editorial strip with mono-label ends — the changelog/serial-number furniture.
- **`section-header`** — A marketing section lead-in — mono uppercase eyebrow, display-scale title, optional description.
- **`terminal`** — A dark mono command block with a phosphor prompt glyph and a composed copy button.
- **`testimonial`** — A pull-quote — a serif-italic quote over a mono uppercase attribution line.

## Marketing motion

- **`staggered-text-reveal`** — Display text whose words rise in on mount, staggered one motion-enter-up step apart — CSS-only.

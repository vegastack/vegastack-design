# Component roster

<!-- GENERATED — do not hand-edit. Regenerated from the design system's component contract,
     which is the authority for membership and counts. -->

**103 components**, plus 439 animated-icon items, 4 hooks (`use-animation-replay`, `use-list-nav`, `use-mobile`, `use-platform`), and 1 starter block (`dashboard-01`) — 547 registry items in total.

Install any of them with `shadcn add @vegastack/<name>`. Animated icons install as
`@vegastack/icon-<name>`; the bare name is reserved for components, so `icon-button` is the
component and never an icon.

## Actions

- **`button`** — Trigger an action. 15 variants × 8 sizes, with loading + Base UI Button semantics.
- **`copy-button`** — Copy a value to the clipboard with transient check feedback — a ghost icon button that swaps Copy → Check and fires onCopied.
- **`icon-button`** — A square, icon-only action button — a thin Button wrapper that requires an accessible label.
- **`segmented`** — Segmented control — a single-select, always-one-selected view/mode switcher on a muted track with a raised active chip.
- **`split-button`** — A primary action joined to a dropdown of related secondary actions — one default click, plus a chevron menu.
- **`toggle`** — A two-state button that can be pressed on or off — bold/italic, mute, pin.
- **`toggle-group`** — Joined toggle buttons sharing one selection — single or multiple, variants/sizes, horizontal/vertical, full keyboard navigation.

## Form

- **`auto-save-input`** — An input that debounces edits and persists them via an async onSave, with an inline idle/saving/saved/error status.
- **`checkbox`** — A binary (or tri-state) toggle — checked, unchecked, indeterminate, disabled, built on Base UI Checkbox.
- **`chip-input`** — Free-token entry field — Enter/comma/paste commits chips, Backspace removes, per-chip validation marks invalid entries instead of dropping them. Combobox field chrome + real Tag chips.
- **`color-picker`** — A swatch-triggered popover presenting a grid of preset colors — pick one, fire onValueChange, mark the selection.
- **`combobox`** — A filterable, keyboard-navigable listbox behind a text input — type-to-filter, grouped items, async status, and a multi-select chip mode.
- **`country-select`** — A searchable country combobox returning the ISO 3166-1 alpha-2 code, with flag + name. Built on Combobox.
- **`date-picker`** — Pick a single date or a date range from a calendar popover — token-styled, keyboard-navigable, with optional quick presets.
- **`editable-cell`** — Inline-editable value with an async commit lifecycle — optimistic display, saving/saved/error status, revert on a rejected write, and a typed text/select/custom editor registry.
- **`emoji-picker`** — A popover with a searchable, category-grouped grid of emoji that returns the selected character via onSelect (curated set, not full Unicode).
- **`field`** — A form-field wrapper — label, inline label action, description, and error/success message, built on Base UI Field.
- **`field-inline`** — Click-to-edit text — displays a value, swaps to a focused input on click, commits on Enter or blur, cancels on Escape.
- **`input`** — A styled Base UI input — all input types, Field state data attributes, error and disabled states, focus-visible ring, and optional prefix/suffix addons.
- **`label`** — A styled native label for form controls — htmlFor association, disabled dimming, optional required indicator.
- **`number-field`** — Locale-aware numeric input on Base UI's NumberField in Input's field chrome — Intl formatting (money is a format prop), min/max/step, keyboard stepping, wheel scrub, full-height steppers.
- **`otp-input`** — A multi-slot one-time-passcode input — keyboard navigation, paste distribution, masking, disabled, built on Base UI OTP Field.
- **`password-input`** — A password field with a show/hide eye toggle and an optional live requirements checklist.
- **`radio-group`** — A set of mutually-exclusive options — single selection, arrow-key navigation, disabled, built on Base UI Radio Group.
- **`region-select`** — A searchable combobox of states/provinces for a country, with a free-text fallback for countries with no subdivisions.
- **`select`** — A dropdown for choosing one option — trigger with value and chevron, grouped scrollable popup, full keyboard navigation, animated enter/exit.
- **`slider`** — Pick a number or a [from, to] range from a continuous track — keyboard accessible, with optional steps. Built on Base UI Slider.
- **`switch`** — An on/off toggle for instant, self-saving binary settings — built on Base UI Switch.
- **`textarea`** — A styled native textarea for multi-line text — error/disabled states, a focus-visible ring, and an optional auto-grow mode.

## Display

- **`code-block`** — A code panel with a language header and copy affordance — the shared code surface for chat transcripts, docs, and examples.
- **`onboarding-checklist`** — A getting-started card — segmented progress + step rows, collapsible to a progress pill.
- **`stat`** — A labelled value block — muted label over a value, honest faint empty state, optional delta line. Two scales.
- **`tag-group`** — Hue-tinted label chips on the 10-hue tag palette, with +N overflow collapsing and removable tags.

## Data display

- **`accordion`** — A stack of collapsible sections — single or multiple open, animated height, a rotating chevron, full keyboard support.
- **`animated-number`** — A number display that tweens from its previous value to a new one on every change — Intl.NumberFormat-aware (currency/percent/compact), instant under reduced motion, the dashboard stat-card counter.
- **`avatar`** — A circular user/entity image with an initials fallback, five sizes, and an overlapping AvatarGroup stack.
- **`badge`** — A compact status or label chip. 3 variants × semantic colors × 4 sizes, with dot, loading, and icon support.
- **`card`** — A borders-only content surface — no shadows, with composable header, content, and footer parts.
- **`chart`** — A themed Recharts wrapper — token-only series colors (--chart-1…--chart-8), a bordered tooltip/legend, and Recharts' own built-in keyboard + screen-reader layer.
- **`collapsible`** — A single toggleable open/close region with an animated height, built on Base UI Collapsible.
- **`empty`** — A zero-data placeholder — icon, title, description, actions, with intent tints and an optional dashed border.
- **`item`** — A compact anatomy row for list/feed content — media, title, description, actions, groupable with dividers.
- **`kbd`** — A styled keyboard-key indicator — OS-aware modifier glyphs, a keys array, and small sizes.
- **`markdown-view`** — Render a markdown string to safe, token-styled HTML — headings, lists, code, blockquotes, links, GFM tables — XSS-safe, no raw HTML.
- **`relative-time`** — Render a date as a human-relative string ("2 hours ago", "yesterday") with native Intl.RelativeTimeFormat — self-updating, with an absolute-date tooltip.
- **`status-icon`** — A small status indicator icon — todo, in progress, blocked, done — each mapping to a lucide icon and semantic color.
- **`table`** — Styled semantic table primitives — a scrollable container plus header, body, footer, row, head, cell, caption.
- **`timeline`** — Rail geometry for chronological records — a continuous connector with a node per entry. Rows compose Item parts; separators render through Marker; entries carry content-visibility render skipping.
- **`truncated-text`** — Truncate text to one line or N lines with an ellipsis, revealing the full text in a tooltip only when it overflows.

## Data

- **`data-list`** — A generic, typed data table — configurable columns, row selection, sortable headers, plus loading and empty states.
- **`filter-bar`** — A row of removable filter chips, an "Add filter" dropdown, and an optional search input — for list and table filter toolbars.
- **`property-list`** — Record-facts rows: an icon+label column beside a value column, as an accessible definition list.

## Overlay

- **`alert-dialog`** — A modal confirmation dialog with four semantic intents — non-dismissable, forcing a deliberate Cancel/confirm choice.
- **`context-menu`** — A menu of actions revealed by right-click (or long-press) — items, submenus, separators, labels, shortcuts, checkbox/radio.
- **`dialog`** — A modal overlay — five sizes, a header/footer layout, focus trapping, and animated enter/exit.
- **`dropdown-menu`** — A menu of actions triggered by a button — items, submenus, separators, labels, shortcuts, and checkbox/radio selections.
- **`hover-card`** — A rich preview panel that opens on hover or focus — interactive content, four directions, forgiving delays.
- **`popover`** — A click-triggered floating panel for arbitrary content — positioning, an optional arrow, and built-in dismiss.
- **`sheet`** — A dialog that slides in from a screen edge — four sides, header/footer layout, focus trapping, animated slide.
- **`shortcut-overlay`** — The ?-triggered dialog listing keyboard shortcuts, rendered from a declaration registry (keys, label, category, when) — grouped, filterable, platform-aware via use-platform + Kbd.
- **`tooltip`** — A floating label on hover or focus — smart shared delay, rich content, optional keyboard hints, collision-aware positioning.

## Navigation

- **`breadcrumb`** — A hierarchical navigation trail — links, separators, the current page, and ellipsis collapse for long paths.
- **`command`** — A searchable command palette — filtered, grouped items with keyboard navigation, optionally inside a ⌘K dialog.
- **`navigation-menu`** — Site-nav mega-dropdown on the Base UI NavigationMenu primitive — chip triggers, one shared sliding panel, grid links.
- **`page-header`** — The standardized header at the top of a page — back button, breadcrumb trail, title, description, actions, secondary menu, and a favorite star.
- **`pagination`** — Page navigation — previous/next, numbered page links, an ellipsis for long ranges, and the active page.
- **`sidebar`** — A collapsible app navigation rail — header/content/footer, labelled groups, menu items with active state, and an expand/collapse trigger.
- **`stepper`** — A bounded linear process as an ordered list — complete/current/upcoming/error states on StatusIcon's vocabulary, aria-current=step, advance-gating message, focus follows the process.
- **`tabs`** — Layered content sections — line or pill variants, optional icons and count badges, horizontal or vertical, full keyboard navigation.

## Feedback

- **`action-bar`** — Floating contextual bar — status region + action children, CSS-only enter/exit, raised band. Bulk selection, unsaved changes, and batch progress are recipes over it.
- **`alert`** — A status banner — five semantic variants, an optional icon, and an optional dismiss button.
- **`progress`** — A determinate horizontal progress bar for measurable, ongoing tasks — built on Base UI Progress.
- **`progress-indicator`** — A compact circular pie-fill progress indicator (0–100%) — a server-safe SVG glyph in circle or squircle shapes.
- **`provider`** — The single app-root wrapper — theme (next-themes), Sonner toasts, tooltip coordination, and text direction in one mount-once component.
- **`skeleton`** — A token-driven loading placeholder — line, circle, rect, card shapes, configurable count, reduced-motion-aware pulse.
- **`sonner`** — Brief, non-blocking notifications — a token-styled Sonner toaster with success/error/warning/info variants that follows the theme.
- **`spinner`** — An indeterminate loading indicator — a spinning icon inheriting currentColor, four sizes, role=status by default.

## Layout

- **`app-shell`** — The shared dashboard layout — a skip-linked sidebar + header + scrollable main region, composing Sidebar/SidebarTrigger into one reusable, hash-tracked shell.
- **`resizable`** — Draggable, keyboard-resizable split panes — horizontal or vertical, nestable, with an optional collapsible panel. Built on react-resizable-panels.
- **`scroll-area`** — A scroll container with custom, auto-hiding scrollbars — dual-axis, token-styled, built on Base UI ScrollArea.
- **`separator`** — A thin rule dividing content — horizontal or vertical, decorative by default, built on Base UI.
- **`settings-row`** — A borders-only settings layout — titled sections, bordered cards, and label-plus-control rows.

## Media

- **`image`** — A presentational framed image with aspect-ratio, rounding, a loading skeleton, and an error fallback.
- **`notification-bell`** — A bell icon button with an unread-count badge overlay. Presentational — the app supplies the count.

## Rich text

- **`text-edit`** — A Tiptap-based rich-text editor with a compact, token-styled toolbar (bold, italic, strike, heading, lists, blockquote, code) — controlled HTML in, HTML out. Collaboration deferred.

## Chat

- **`tool-call-chip`** — An agent-activity chip — tool action label + muted result meta, optionally rendered as a button.

## Communication

- **`attachment`** — A file chip / thumbnail card for chat and message-compose surfaces - media slot, name + meta, uploading/error/complete states, remove/download actions.
- **`bubble`** — A chat speech bubble - 7 token-driven variants (incl. brand-tinted), start/end alignment, interactive content, and a floating reactions chip.
- **`marker`** — An inline conversation marker - status lines, system notes, and labelled dividers. 3 variants, Base UI render-polymorphic.
- **`message`** — Layout primitives for a conversation row - avatar anchoring, content column, header/footer slots, start/end alignment. Server-safe.
- **`message-scroller`** — A virtualised, auto-scrolling conversation viewport - pins to the latest message, preserves position on prepend, tracks the anchor, and a floating scroll-to-end button.

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

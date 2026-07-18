# Coverage Scorecard + Cross-Cutting Sweeps

## Scorecard — all 68 components

Coverage % is the auditing subagent's estimate of *how much of the real API surface is demonstrated in live previews*. Severity: ⛔ Major · ◑ Moderate · ✓ Strong (polish only). Effort: S/M/L. Section = proposed taxonomy (`01`).

| Component | Section | Cov | Sev | Effort | Headline gap |
|---|---|---:|:--:|:--:|---|
| button | Buttons & Actions | ~100% | ✓ | S | optional variant×size matrix only |
| icon-button | Buttons & Actions | ~90% | ✓ | S | `iconButtonStates` middle item shows no state |
| copy-button | Buttons & Actions | ~50% | ⛔ | M | no Variants/Sizes/States; success/disabled/variant never shown |
| split-button | Buttons & Actions | ~80% | ◑ | S–M | 7/15 variants shown; no disabled action item |
| toggle | Buttons & Actions | ~95% | ✓ | S | "Variants" export misnamed (no variant axis) |
| toggle-group | Buttons & Actions | ~80% | ◑ | S–M | vertical + Sizes are code-only; stale preview comment (P0) |
| input | Forms & Inputs | ~80% | ◑ | S | **stale ring claim (P0)**; addon disabled/invalid not shown |
| textarea | Forms & Inputs | ~80% | ◑ | S | `autoGrow` only in states grid, no live Auto-grow preview |
| password-input | Forms & Inputs | ~80% | ◑ | S | **stale ring claim (P0)**; revealed state never shown statically |
| otp-input | Forms & Inputs | ~80% | ◑ | S–M | invalid state, custom length/separator undemonstrated |
| auto-save-input | Forms & Inputs | ~75% | ◑ | M | **stale ring claim (P0)**; saving/saved/error invisible at rest |
| text-edit | Forms & Inputs | ~80% | ◑ | M | invalid state + `onSubmit` (Cmd/Ctrl+Enter) missing from keymap |
| field | Forms & Inputs | ~85% | ✓ | M | horizontal error/success + disabled field not shown |
| field-inline | Forms & Inputs | ~80% | ◑ | S | empty/`"Edit value"` fallback never shown |
| label | Forms & Inputs | ~55% | ⛔ | M | **4× stale asterisk prose (P0)**; States has no preview |
| slider | Forms & Inputs | ~90% | ✓ | S | `getThumbAriaLabel`, vertical orientation untouched |
| checkbox | Selection Controls | ~75% | ⛔ | M | `size="sm"` code-only; invalid state never shown |
| radio-group | Selection Controls | ~75% | ◑ | S–M | horizontal orientation code-only; invalid not shown |
| switch | Selection Controls | ~80% | ◑ | S | off-state at sm/lg not shown; invalid not shown |
| select | Selection Controls | ~90% | ✓ | S | `multiple` ambiguity (P0 #11); invalid trigger not shown |
| country-select | Selection Controls | ~45% | ⛔ | M | data API undocumented; no Anatomy; thinnest page |
| state-select | Selection Controls | ~60% | ⛔ | M | data API undocumented; toggle-to-clear undocumented |
| date-picker | Pickers | ~70% | ◑ | M | `disabledDates`, `calendarProps`, disabled state not shown |
| color-picker | Pickers | ~65% | ⛔ | M | **"round swatch" (P0)**; custom palette/columns code-only |
| emoji-picker | Pickers | ~70% | ◑ | M | empty state, `closeOnSelect=false`, EMOJI type not shown |
| dialog | Overlays | ~90% | ✓ | S | `showCloseButton=false`, scrollable content not shown |
| alert-dialog | Overlays | ~92% | ✓ | S | scrollable content only |
| sheet | Overlays | ~90% | ✓ | S | close-button/width overrides not shown |
| popover | Overlays | ~70% | ◑ | M | sides/arrow/align/`modal=false` all undemonstrated |
| hover-card | Overlays | ~90% | ✓ | S | `align`, delay-tuning not shown |
| tooltip | Overlays | ~92% | ✓ | S | `align`, `sideOffset` fn, `delay` not shown |
| dropdown-menu | Menus & Commands | ~95% | ✓ | S | `inset` only undemonstrated |
| context-menu | Menus & Commands | ~95% | ✓ | S | `inset` only undemonstrated |
| command | Menus & Commands | ~92% | ✓ | S | disabled item only in test, not preview |
| breadcrumb | Navigation | ~88% | ✓ | S | custom separator not shown |
| pagination | Navigation | ~85% | ◑ | S | Sizes grid shows 2/4; no last-page disabled-Next |
| tabs | Navigation | ~85% | ◑ | S | vertical+`line` rail (prose-promised) never rendered |
| sidebar | Navigation | ~75% | ◑ | M | `side="right"`, button sizes, controlled mode; **a11y ring (P0 #8)** |
| page-header | Navigation | ~80% | ◑ | M | `onBack` button + `secondaryMenu` code-only |
| accordion | Disclosure | ~95% | ✓ | S | **`data-open` prose bug (P0 #7)** |
| collapsible | Disclosure | ~95% | ✓ | S | controlled mode snippet only |
| card | Layout & Structure | ~90% | ✓ | S | `size="sm"` never shown |
| separator | Layout & Structure | ~95% | ✓ | S | essentially complete |
| scroll-area | Layout & Structure | ~85% | ◑ | S–M | `orientation="both"` (corner) not shown |
| settings-row | Layout & Structure | ~75% | ◑ | S | `controlId` demo missing; orphaned preview export |
| table | Data Display | ~85% | ◑ | S | overflow-scroll headline feature + checkbox column not shown |
| data-list | Data Display | ~75% | ◑ | M/L | toolbar slot, `interactive` column not shown; **Anatomy omits `interactive?` (P0 #10)** |
| filter-bar | Data Display | ~75% | ◑ | M | custom `addFilterMenu`, sub-type tables missing |
| avatar | Data Display | ~80% | ◑ | S | `spacing` matrix, error-path fallback, `fallbackDelay` |
| image | Data Display | ~75% | ◑ | S–M | `rounded` axis + default `auto` ratio never shown |
| badge | Data Display | ~90% | ✓ | S | `minimal×6 colors` row missing; solid+dot |
| alert | Feedback & Status | ~70% | ◑ | M | **stale token (P0 #3)**; icon/Actions/controlled-dismiss |
| toast (sonner) | Feedback & Status | ~85% | ✓ | S | `loading`/`message`/`custom`/`closeButton`/`position` |
| progress | Feedback & Status | ~70% | ◑ | M | indeterminate + custom-scale code-only; fill override |
| progress-indicator | Feedback & Status | ~90% | ✓ | S | custom-scale code-only |
| spinner | Feedback & Status | ~85% | ✓ | S | labelled + colored examples code-only |
| skeleton | Feedback & Status | ~85% | ✓ | S | `count` (Line count) code-only |
| status-icon | Feedback & Status | ~85% | ◑ | S | `label=""` next-to-text pattern; status×size grid |
| empty-state | Feedback & Status | ~55% | ⛔ | M | **stale token (P0 #3)**; size/surface/bordered/icon-less unshown |
| notification-bell | Feedback & Status | ~90% | ✓ | S | IconButton pass-through props not noted |
| markdown-view | Content & Typography | ~80% | ◑ | S | h4–h6, `ol`, `hr`, `img` never rendered |
| kbd | Content & Typography | ~85% | ◑ | S | live `os="other"` never shown (code comment only) |
| truncated-text | Content & Typography | ~60% | ⛔ | M | `IconText` + `TableCellText` have ZERO live previews |
| relative-time | Content & Typography | ~85% | ◑ | S–M | live `refresh`, `locale` never demonstrated |
| marker | Chat & Communication | ~90% | ✓ | S | `MarkerIconProps`/`MarkerContentProps` tables missing |
| message | Chat & Communication | ~85% | ✓ | S | subcomponent div-props note; ghost-bubble padding |
| bubble | Chat & Communication | ~90% | ✓ | S | `BubbleContentProps` (the `render` prop) table missing |
| message-scroller | Chat & Communication | ~85% | ✓ | M | Provider/Item prop tables; `last-anchor` not shown |

**MAJOR (⛔) — 8 components:** copy-button, label, checkbox, country-select, state-select, color-picker, empty-state, truncated-text. These deliver the biggest reader payoff per fix — do first in Part B (P1).

---

## Cross-cutting sweeps (fix once, systematically — P2)

The same shapes recur across many components. Each is cheaper and more consistent done as a single pass than ad-hoc per page.

### Sweep A — Reconcile the copy-pasted focus-ring a11y line (12 pages)
The line `:focus-visible` shows a 2px ring (`outline-ring`) — never `outline: none`. is **copy-pasted onto 12 pages** but is only TRUE where the component actually sets the ring. Verified offenders so far: **input, password-input, auto-save-input** (no ring — P0 #2); **sidebar** (P0 #8). The other 8 pages carrying the line must each be checked against their component's real focus classes and corrected or kept:
`auto-save-input`, `checkbox`, `field-inline`, `icon-button`, `input`, `password-input`, `otp-input`, `radio-group`, `slider`, `toggle`, `switch`, `textarea`.
> **Action:** for each, grep the canonical for `outline-ring` / `focus-visible:ring`; if absent, rewrite the a11y bullet to the real treatment (`focus:border-ring/70`, `focus-visible:text-foreground`, etc.). Consider a shared, accurate boilerplate per focus-treatment family so this doesn't drift again.

### Sweep B — Promote "code-fence-only" examples to live `<ComponentPreview>`
Documented variants/states that exist only as static code blocks (the reader never sees them rendered). Confirmed instances:
`toggle-group` (Sizes, Orientation) · `radio-group` (Orientation) · `checkbox` (Sizes) · `textarea` (Auto-grow) · `otp-input` (Grouped, With-a-label) · `progress` (Indeterminate, Custom scale) · `progress-indicator` (Custom scale) · `skeleton` (Line count) · `kbd` (os="other") · `color-picker` (custom palette, columns) · `data-list` (toolbar) · `page-header` (onBack, secondaryMenu, favorite-controlled) · `breadcrumb` (custom separator) · `pagination` (routing) · `spinner` (labelled/colored).
> **Action:** add the matching preview export(s) and swap the code fence for `<ComponentPreview>` (keep a code snippet too where it aids copy-paste).

### Sweep C — Complete AutoTypeTable / TypeTable coverage of exported types
Public exported types/data/subcomponents missing from API Reference:
- `date-picker`: `DatePreset`, `DateRangePreset`, re-exported `DateRange`, `Matcher`, `defaultDatePresets()/defaultRangePresets()`
- `color-picker`: `ColorOption`, enumerate `DEFAULT_COLORS`
- `emoji-picker`: `EmojiEntry`, `EmojiCategory`, `EMOJI` shape
- `data-list`: `SortState`, `SortDirection`
- `filter-bar`: `FilterBarFilter`, `FilterBarAddOption`, `FilterBarSearch`
- `country-select` / `state-select`: `getCountryByCode`/`COUNTRIES`/`Country`, `hasStates`/`getStatesByCountry`/`STATES_BY_COUNTRY`/`State`
- `marker`: `MarkerIconProps`, `MarkerContentProps`
- `bubble`: `BubbleContentProps` (carries the `render` prop — highest value)
- `message-scroller`: `MessageScrollerProvider` + `MessageScrollerItem` props (aliased primitive types — may need `<TypeTable>` if AutoTypeTable can't resolve)
- `message`: the 5 layout subcomponents — add a "accept standard `div` props" note (AutoTypeTable can't table bare pass-throughs)
- `notification-bell`: note inherited `IconButtonProps` (`size`/`variant`) pass-through
> **Action:** add `<AutoTypeTable>` where the type introspects; fall back to hand-written `<TypeTable>` for aliased/cmdk/primitive types; add a one-line "standard element props" note where there's nothing to table.

### Sweep D — Invalid / error state on form controls
The `aria-invalid` destructive-border state is supported but **never demonstrated** on: `checkbox`, `switch`, `radio-group`, `otp-input`, `text-edit`, `select` (trigger). 
> **Action:** add an invalid example to each (often a one-line `<Field error=…>` wrap or `aria-invalid` prop).

### Sweep E — The positioning-overlay `align` matrix
`align` (start/center/end) is undemonstrated across **all three** floating panels (`popover`, `hover-card`, `tooltip`), each despite having an `align` AutoTypeTable row. Additionally `popover` alone lacks **sides** and **arrow** previews that hover-card/tooltip both ship.
> **Action:** add an `align` example (or a side×align note) to each; bring `popover` up to parity (4-side preview + arrow example + `modal={false}`).

### Sweep F — Stale status-token recipe (`bg-X/10`)
Verified scoped to `alert.mdx` + `empty-state.mdx` only (P0 #3). Fold into the sweep so any future occurrence is caught: grep all mdx for `bg-[a-z]+/10` and reconcile against canonical `-subtle`.

### Sweep G — "Documented-but-not-demonstrated" prop tail
Low-stakes props named in prose/tables but never shown, often inherently hard to show statically. Decide per case: quick preview, or trim from prose. Examples: dialog/sheet `showCloseButton=false`/`closeLabel`; tooltip/hover-card delays; sonner `closeButton`/`expand`/`position`/`toast.message`/`toast.custom`; relative-time `tooltipDelay`/live `refresh`/`locale`; message-scroller `last-anchor`/`scrollPreviousItemPeek`.
> **Action:** add a single explicitly-labeled "live" example for the headline behaviors that *can't* be frozen (relative-time refresh, sonner toasts); trim or snippet the rest.

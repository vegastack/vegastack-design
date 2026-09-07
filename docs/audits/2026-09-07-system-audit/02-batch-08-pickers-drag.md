# 02 — Batch 8: pickers and drag

**Items:** date-picker (+ Calendar, DateRangePicker) · color-picker · emoji-picker · country-select ·
region-select · board · sortable-list · dropzone · auto-save-input · password-input · split-button ·
action-bar
**Evidence:** source read; five-lane captures (all twelve, incl. board/date-picker at 320px);
overlay probes for date/emoji/color/country panels in both themes; axe from the sweep (no
violations in this batch); tests, previews and docs inventories.

Overall: the behavioural cores are strong (the drag hook's lossless menu path, the roving emoji
grid, the dropzone's honest a11y model, the auto-save baseline logic). The findings are one
dependency that was never sanctioned, one pair of components that duplicate each other around an
embedded 50 KB dataset, styling that leaks between the two drag consumers, and the same
hand-rolled-control and magic-width habits seen in earlier batches.

## Findings

### B8-01 · HIGH · dependency · `react-day-picker` is an unsanctioned headless primitive

- **Where:** `date-picker.tsx:14`, `packages/ui/package.json:51` (`^10.0.1`),
  `registry.json:2295`. AGENTS.md §Sanctioned dependency exceptions lists exactly four headless
  primitives plus the measurement and renderer engines; `react-day-picker` is in none of them, yet
  it owns the calendar's entire interaction core (keyboard grid navigation, focus management,
  range selection state, matchers). The file comment still says "v9" (`:30`) while the installed
  major is 10.
- **Fix:** an explicit MK decision, either way (**Doubt D25**). Recommended: sanction it as the
  fifth headless primitive, isolated behind the `date-picker` item exactly like the other four,
  and record the sign-off in AGENTS.md. Building an APG-compliant calendar grid ourselves is
  ~600 lines of state machine we would then own forever. Update the "v9" comment.

### B8-02 · HIGH · bloat · `CountrySelect` and `RegionSelect` are one component and a dataset

- **Where:** `country-select.tsx:330-380` and `region-select.tsx:140-230` both build the same
  "Select-shaped Combobox" (trigger with `ComboboxValue` + chevron, `w-(--anchor-width)` panel,
  search input, check on the selected row). `region-select-data.ts` is 50 KB / 1,389 lines of
  regions embedded in a component file; the country list is another 20 KB inside
  `country-select.tsx`. The generated `region-select.json` weighs 67 KB — every consumer copies
  the world's regions into their tree to get one dropdown.
- **Drift:** `region-select.tsx` imports `region-select-data`, which the graph pass found is
  listed in `registry.json` only as a file of `region-select`, not as an item any other component
  could depend on — a second consumer of the data would have to copy it again.
- **Behaviour smell:** `region-select.tsx:218-225` computes toggle-to-clear inside each item's
  `onClick` and leaves the Combobox root's `onValueChange` deliberately unwired (`:32-33`). That
  bypasses Base UI's selection model (keyboard Enter on a highlighted item goes through the root,
  not the click), so keyboard and pointer selection follow two code paths.
- **Fix:** one `SearchableSelect` composition (a Combobox preset with the trigger look) that both
  components are thin wrappers over; move both datasets to a `registry:lib` item
  (`geo-data`) declared as a `registryDependencies` entry so they are installed once; wire
  selection through `onValueChange` and add an explicit clear affordance (the `X` on the trigger
  when a value is set) instead of the click-again-to-clear toggle. Country select's `w-64`
  docs examples become `w-full` like every other field.

### B8-03 · MEDIUM · consistency · Date triggers have fixed widths and magic paddings

- `date-picker.tsx:555` `w-56` (single) and `:761` `w-72` (range) — the only form controls in the
  system with a fixed width; `Input`, `Select`, `Combobox` are `w-full`. At 320px the range trigger
  is wider than the content area. `:146` caption `px-7` is a hand-tuned clearance for the two nav
  buttons; a three-column grid (`auto 1fr auto`) needs no padding. Day buttons use
  `buttonVariants({ variant: "ghost", size: "icon" })` on a native `<button>` (`:307`) — rename
  with P2/B1-05 (`icon-md`).
- **Fix:** `w-full` triggers (consumers constrain via a parent), grid caption, and the selected
  day uses the P2 `solid` recipe rather than its own `bg-primary` literal.

### B8-04 · MEDIUM · consistency · Three "search inside a panel" recipes

- `emoji-picker.tsx:619` renders a full bordered `Input type="search"` inside a `border-b` row;
  `country-select.tsx` uses `ComboboxInput` with a leading search icon and a bottom hairline
  (`captures/_overlays/country-select__light.png`); `Command` has a third recipe (B3). Measured
  in the dark overlay capture: the emoji search is a boxed field inside a boxed panel — two
  nested borders.
- **Fix:** one panel-search recipe (leading `Search` icon, no box, hairline below, `h-(--size-md)`)
  shared by Command, Combobox panels and EmojiPicker — the Geist/Linear/Raycast convention.

### B8-05 · MEDIUM · bloat · Drag styling is copied into every consumer

- `board.tsx:448-455` and `sortable-list.tsx:177-188` carry the identical six-utility recipe
  (drop-edge `::before` hairlines top/bottom, `data-dragging:opacity-(--opacity-dim)`,
  `data-drag-pending:animate-pulse` + `motion-reduce`). A third consumer would copy it again.
- **Fix:** the hook keeps returning data attributes; a tiny `drag-item.tsx` (`DragItem` slot or
  an exported `dragItemClasses` string) owns the recipe next to the hook. Same class as B5-05
  (the live-region announcer is also duplicated across `use-drag-reorder`, `use-file-drop`,
  `editable-cell`, `chip-input`, `data-grid` — one `use-announcer` serves all five).

### B8-06 · MEDIUM · UX · Board cards claim a drag they may not have

- `board.tsx:490` sets `cursor-grab` on every card surface even when `pointerDisabled` is true
  (`dragDisabled` or below 768px, `:220`); only `readOnly` resets it. On a tablet at 767px the
  cursor promises a drag that never starts. Also `hover:bg-accent` on a `bg-card` card (`:491`) is
  the invisible hover from B1 — resolved by P1's `surface-2`.
- The column body's `max-h-[calc(100dvh-var(--spacing)*64)]` (`:400`) is a magic viewport
  reservation (256px) that assumes a specific shell height; expose `columnMaxHeight` (CSS length,
  like `columnWidth`) and default it to a token.
- **Fix:** `cursor-grab` only when `!pointerDisabled && !readOnly`; P1 hover; `columnMaxHeight`.

### B8-07 · MEDIUM · coupling · Dropzone's drag feedback only works with an `Empty` child

- `dropzone.tsx:134-135` tints `[&_[data-slot=empty]]` — the surface itself never changes. Any
  child that is not `Empty` (an image, a custom card) shows no drag-over state at all. The
  disabled state uses `pointer-events-none` + `opacity` (consistent), but `aria-disabled` on a
  `role="button"` that still has `tabIndex=0` is right; fine.
- **Fix:** put the outline on the surface (`data-dragging:outline-2 outline-primary/…` with the
  `rounded-lg` already there) and let `Empty bordered` pick it up via `group-data-dragging/dropzone`
  as the docs already advertise.

### B8-08 · MEDIUM · consistency · Hand-rolled toggle in PasswordInput; stray class strings

- `password-input.tsx:90-106` is another raw `<button>` (see B3-05, B6-05, B7-06) — use
  `IconButton variant="ghost" size="xs"`, which already owns the 24px target and focus grammar.
  `:39` and `:101` end class strings with a trailing space (lint should catch it). The 20-line
  comment defending `motion-pop-in` on the eye toggle (`:107-125`) describes a real gap: the
  vocabulary has no plain cross-fade. Decision: eye swap needs **no** motion (Geist/Linear swap
  the glyph instantly); delete the `hasToggledRef` machinery.
- `requirements` checklist: unmet rows are `text-muted-foreground` with an `X`; met rows are
  success. Fine; note the pattern for Batch 9's `Field` messaging.

### B8-09 · LOW · hygiene · AutoSaveInput leftovers

- `auto-save-input.tsx:266` `className={cn(className)}` is a no-op wrapper; `:77` `size-4` is a
  raw size for the status slot → `size-(--icon-default)`; `:235` `<Spinner label="">` passes an
  empty label to silence the built-in announcement because the parent already announces — give
  `Spinner` a `decorative` prop instead of an empty string. `{@link Input}` in TS JSDoc is fine
  (the MDX rule does not apply).

### B8-10 · LOW · API · SplitButton's size map is a shadow of Button's

- `split-button.tsx:74-80` hard-codes the chevron width per Button size; every P2/B1-05 rename
  breaks it. Derive from `buttonVariants` (export `buttonSizeToIconSize`) or make the trigger an
  `IconButton` of the same `size` with `rounded-s-none`. The `data-loading:pointer-events-none`
  trick is fine but should be `disabled` semantics (`aria-disabled`) so AT knows the half is
  inert. The docs page has a "Playground" section between Usage and Anatomy; 15 pages carry one —
  sanction it in the canon (recommended) or fold into Examples (**Doubt D26**).

### B8-11 · LOW · motion · ActionBar exits slower than it enters

- `action-bar.tsx:181` enter `duration-base` + `ease-emphasized`, exit `duration-slow` +
  `ease-exit` with `scale-95`. Every reference (Vercel, Linear, Base UI defaults) exits at or
  faster than it enters. Per the overlay timing decision (B3), enter 150ms, exit 100ms, and drop
  the scale on a bottom-docked bar — translate + fade is enough. `role="group"` → Base UI
  `Toolbar` (roving focus) with B4-10.

### B8-12 · LOW · docs/tests · Coverage and structure

- `board` (2 previews, no keyboard-move or locked-lane fixture the contract lane can see),
  `sortable-list` (2 previews), `dropzone` (2 previews). `board`/`sortable-list`/`dropzone`/
  `action-bar` carry the "Scope" section (D19). `color-picker` (4 previews, 17 tests) and
  `emoji-picker` (7 previews, 15 tests) are healthy.

### Verified fine

Calendar: token-styled, selected day is a flat filled square, outside days are faint, weekday
labels 12px, nav is a real pair of icon buttons, presets reuse react-day-picker's matcher so they
obey `disabledDates`, same-day range close handled (`:718`). ColorPicker: sanctioned inline style
for the swatch, RTL-aware roving grid via `useListNav`. EmojiPicker: single Tab stop, whole-grid
roving, RTL-aware arrows, polite result count, `justify-items-center` grid. Board: lossless menu
path with per-target lock reasons, ragged roving model documented, live region outside the
scroller, empty columns as `Empty bordered` drop targets, no drag shadow (doctrine). SortableList:
controlled, promise-gated snap-back, required menu path. Dropzone: input is a sibling of the
surface (no nested-interactive), refs merged not overwritten. AutoSaveInput: external value
resets the baseline, in-flight save cancelled on revert, keyed status icons. SplitButton: single
spinner, `-ms-px` seam, one focus ring per half. ActionBar: `aria-busy` while pending, status
region polite.

## Motion register — Batch 8

| id   | where                         | motion                                           | verdict                                    |
| ---- | ----------------------------- | ------------------------------------------------ | ------------------------------------------ |
| M-39 | action-bar enter/exit         | translate+scale+fade base in / slow out          | change: 150 in / 100 out, no scale (B8-11) |
| M-40 | drag pending (board/sortable) | `animate-pulse` while a server move is in flight | keep                                       |
| M-41 | drag lift                     | opacity dim on the origin item                   | keep                                       |
| M-42 | password eye toggle           | `motion-pop-in` after first toggle               | remove (B8-08)                             |
| M-43 | auto-save status              | keyed `motion-pop-in` on saved/error             | keep                                       |
| M-44 | date picker panel             | popover enter/exit (inherits Popover)            | keep                                       |

## Doubts for MK (Batch 8)

| id  | question                  | options                                                                                                                  | recommendation                                                            |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| D25 | `react-day-picker`        | (a) sanction as the fifth headless primitive, isolated behind `date-picker` · (b) replace with an in-house calendar grid | **(a)** — a calendar state machine is the textbook case for the exception |
| D26 | "Playground" docs section | (a) sanction it in the section canon (after Usage) · (b) fold into Examples                                              | **(a)** — 15 pages already use it consistently                            |
| D27 | Geo datasets              | (a) one `geo-data` lib item shared by country/region select · (b) keep both embedded                                     | **(a)**                                                                   |

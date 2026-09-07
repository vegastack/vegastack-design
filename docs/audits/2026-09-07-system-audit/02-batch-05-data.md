# 02 — Batch 5: data

**Items:** table · data-grid · data-list · editable-cell · filter-bar (+ FilterChip) ·
filter-bar-managed (FilterBuilder) · pagination (+ PaginationPager) · property-list ·
comparison-matrix · chart · tag-group (+ Tag) · chip-input
**Evidence:** source read; five-lane captures (incl. data-grid at 320px); axe results from the
sweep (`table`, `pagination`, `dashboard-01`); consumer grep.

Overall: strong behaviour (APG grid layer, honest empty/loading states, per-chip validation,
host-injected filter grammar, token-only charts). The costs are duplication — two table
implementations sharing no parts, four chip implementations, three hand-rolled live regions — plus
two accessibility gaps the sweep caught and one responsive default that loses data.

## Findings

### B5-01 · HIGH · a11y · Table scroll containers are unreachable by keyboard

- **Where:** `table.tsx:82-92` renders `overflow-x-auto` with no `tabIndex`; axe flags
  `scrollable-region-focusable` on the Table page and the dashboard block. A wide table can only be
  scrolled with a pointer. `ComparisonMatrix` (`comparison-matrix.tsx:75-81`) and `Terminal` already
  do it right (`role="region"`, `tabIndex=0`, `aria-label`, `focus-visible:-outline-offset-2`).
- **Fix:** the Table container becomes the same focusable, labelled region (name from the caption or
  an `aria-label` prop). DataList/DataGrid inherit it. Contract lane: add a wide-table fixture.

### B5-02 · HIGH · bloat · DataList and DataGrid share no code

- **Where:** `data-list.tsx` (692) and `data-grid.tsx` (1,262) each implement the sort header button
  with its hover-revealed icon (`data-list.tsx:496-525`, `data-grid.tsx:984-1007`), the select-all /
  per-row selection maths (`:388-417` / `:789-805`), skeleton rows (`:536-559` / `:1093-1111`), the
  empty-row `Empty` (`:560-580` / `:1112-1132`), `alignClass`, and toolbar/footer slots.
- **Fix:** an internal `data-table-parts.tsx` (`SortHeaderButton`, `SelectionCell`,
  `SelectAllHead`, `SkeletonRows`, `EmptyRow`, `useRowSelection`) consumed by both. The doctrinal
  split (DataList presentational, DataGrid earns engines) stays; ~300 lines go.

### B5-03 · HIGH · bloat · Four chips

- `Tag` (`tag-group.tsx:82-120`), `FilterChip` (`filter-bar.tsx:197-274`), `ComboboxChip` +
  `ComboboxChipRemove` (`combobox.tsx:795-847`), and `Badge bordered` are four recipes for "a
  removable/labelled pill". Their remove buttons differ: `Tag` uses a `::before` hit area,
  `FilterChip` grows the real box to 24px with margin arithmetic (and 20 lines of comment about why
  the pseudo-element failed), `ComboboxChipRemove` is a bare 16px box with **no hit-area expansion**
  — a WCAG 2.5.8 failure the contract lane has not caught (the `comboboxMultiple` fixture's chips
  need a target-size probe).
- **Fix:** one `Chip` primitive (`hue`, `size: sm|md`, `active`, `onRemove` with the 24px real-box
  remove control) used by Tag, FilterChip, ChipInput and ComboboxChip via `render`. Then P1's hover/
  pressed ladder applies to all chips at once.

### B5-04 · MEDIUM · UX/doctrine · DataGrid hides columns by default at narrow widths

- **Where:** `data-grid.tsx:149` `mobile` defaults to `"hidden"`. Measured at 320px
  (`captures/data-grid/dataGridEditable__320-light-ltr.png`): only "Name" survives; Stage and Amount
  are gone with no affordance. `design.md` §DataGrid: "responsive revelation hides or merges columns
  by declared budget — data is never silently lost".
- **Fix:** default `mobile: "merge"` (stack into the primary cell), and always render a
  "N columns hidden" hint in the toolbar when the revelation dropped anything.

### B5-05 · MEDIUM · consistency · Live-region announcer is hand-rolled three times

- `editable-cell.tsx:216-226`, `chip-input.tsx:195-206`, `data-grid.tsx:655-661` each keep a
  `{text, seq}` state and render `<span role="status"><span key={seq}>…`. Same pattern, same comment.
- **Fix:** `use-announcer` hook (`announce(text)` + `<Announcer/>` node) in the hooks family; also
  used by SortableList/Board (Batch 8) and CopyButton.

### B5-06 · MEDIUM · doctrine · ComparisonMatrix tints the promoted plan with `info`

- `comparison-matrix.tsx:98,207` `bg-info/(--alpha-surface-faint)`. `design.md`: `info` is links and
  informational UI only; selection/promotion is `primary`/`accent`. Use the surface ladder's
  `surface-2` (or `primary` alpha) for the highlighted column.

### B5-07 · MEDIUM · UX · Tables never wrap

- `table.tsx:226,255` set `whitespace-nowrap` on every head and cell, so any long cell forces the
  whole table to scroll rather than wrap at word boundaries. Vercel's brand CSS lets body cells wrap
  (`overflow-wrap: break-word`, min column widths) and reserves scrolling for genuinely wide ledgers.
- **Fix:** default wrap; `nowrap` becomes an opt-in per column (`DataListColumn.nowrap`) and stays
  the default only for numeric/`mono` columns. **Doubt D18.**

### B5-08 · MEDIUM · a11y · Pagination landmark collides with itself

- `pagination.tsx:51-57` hardcodes `role="navigation" aria-label="pagination"`; two on a page (the
  docs show six) trigger axe `landmark-unique`. `<nav>` needs no explicit role.
- **Fix:** drop the role; `aria-label` prop defaults to "Pagination" and the docs name each one.
  `PaginationPager` should compose `IconButton variant="ghost" size="sm"` instead of raw `<button>`s
  wearing `paginationLinkVariants` (`:341-364`).

### B5-09 · MEDIUM · API · DataGrid always shows the "Columns" picker

- `data-grid.tsx:1033` renders the picker whenever `columns.length > 0` — i.e. always, even for a
  three-column grid with no toolbar. Add `columnPicker?: boolean` (default `true`) and put the picker
  in the toolbar's trailing slot so hosts can compose.

### B5-10 · LOW · consistency · Header rows take the row hover tint

- `TableRow` (`table.tsx:194`) applies `hover:bg-accent` to every `<tr>`, including the header row
  DataList/DataGrid render with `TableRow`. Hovering a header should not tint it. Scope the hover to
  `tbody` rows (`group-data-[slot=table-body]`) or give the header row `hover:bg-transparent`.

### B5-11 · LOW · API · Two ways to reach the Table container

- `containerClassName` and `containerProps.className` (`table.tsx:35,42`) do the same thing. Keep
  `containerProps`.

### B5-12 · LOW · responsiveness · PropertyList label track is fixed

- `property-list.tsx:55` `grid-cols-[calc(var(--spacing)*28)_minmax(0,1fr)]` (112px) regardless of
  container; at 320px the value column truncates aggressively. Use
  `grid-cols-[minmax(calc(var(--spacing)*20),max-content)_minmax(0,1fr)]` and a `@container`
  stack below `@xs`. Only 4 tests and one preview.

### B5-13 · LOW · type · Chart ticks/tooltips are 11px

- `chart.tsx:194,320` `text-xs` (11px) for axis ticks and tooltip. Geist charts label at 12–13px.
  Move to `text-sm` (12) and `text-code-sm` for the mono numerals.

### B5-14 · LOW · docs · "Scope" sections and JSDoc defects

- `data-grid`, `editable-cell`, `filter-bar-managed`, `chip-input` (and `number-field`, `text-edit`)
  carry a "Scope" section between Usage and Examples. Either sanction it in the section canon or fold
  it into Usage — decide once (**Doubt D19**). `filter-bar.tsx:133` has a corrupted JSDoc default
  (`@default = null && "ml-auto")`). `property-list`/`comparison-matrix`/`tag-group` are thin on
  previews (1–2) and tests (4–8).

### Verified fine

APG grid layer (roving gridcell, Enter/F2 edit, Escape restore, RTL arrows, Home/End, Ctrl+Home/End);
`aria-rowindex`/`aria-colcount` geometry over hidden columns; virtualization keeps real `<tr>`s;
grouped sections are real `<tbody>`s; DataList's first-cell activation button keeps table semantics;
select-all preserves off-view selections; ChipInput never drops invalid entries and never commits
mid-IME; FilterBuilder's nested fieldsets, visible cap reasons and removal-focus policy;
ComparisonMatrix's honest unknown cells and true `colSpan`; charts are token-only with
`accessibilityLayer` on; Tag hues are AA-gated.

## Motion register — Batch 5

| id   | where                     | motion                                 | verdict |
| ---- | ------------------------- | -------------------------------------- | ------- |
| M-25 | sort icon on header hover | opacity 150ms                          | keep    |
| M-26 | EditableCell status swap  | `motion-pop-in` keyed                  | keep    |
| M-27 | ChipInput invalid         | `motion-shake` (moves to Field per D5) | keep    |
| M-28 | Tag remove hover          | opacity 150ms                          | keep    |

## Doubts for MK (Batch 5)

| id  | question             | options                                                                      | recommendation                            |
| --- | -------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- |
| D18 | Table cell wrapping  | (a) wrap by default, `nowrap` opt-in per column · (b) keep nowrap everywhere | **(a)**                                   |
| D19 | "Scope" docs section | (a) sanction it (after Usage) in the section canon · (b) fold into Usage     | **(a)** — it documents G7 boundaries well |

# BATCH 5 — Pickers / Data Display / Typography audit

## BATCH SUMMARY

All 6 components have all four files present (canonical, test, mdx, preview). No missing pages, no missing previews. Coverage is generally strong; the gaps are mostly **un-demonstrated props in previews** and **incomplete AutoTypeTable coverage** (sub-types like `DatePreset`, `DateRangePreset`, `ColorOption`, `EmojiEntry`, `EmojiCategory`, `SortState`, `SortDirection`, `DataListColumn` align/interactive axes) plus a few stale/over-claimed prose lines.

| Metric | Count |
| --- | --- |
| Components audited | 6 |
| Files missing | 0 |
| Components with AutoTypeTable gaps | 5 (date-picker, color-picker, emoji-picker, settings-row partial, data-list) |
| Components with stale/inaccurate prose | 3 (color-picker, date-picker, emoji-picker) |
| Components with un-demonstrated props/states | 6 (all) |
| Effort to close all gaps | S×2 (kbd, settings-row), M×3 (color-picker, emoji-picker, date-picker), M/L×1 (data-list) |

### Proposed categories

| Component | Category | Reason |
| --- | --- | --- |
| date-picker | Pickers | Calendar-popover date/range selection control |
| color-picker | Pickers | Swatch-popover color selection control |
| emoji-picker | Pickers | Searchable emoji-grid popover selection control |
| settings-row | Data Display (Layout) | Presentational settings-screen layout primitives (section/card/row) |
| data-list | Data Display | Generic typed data table with selection/sort/states |
| kbd | Typography & Content | Inline keyboard-key indicator chip |

---

## date-picker
- files: canonical ✓ | test ✓ | mdx (`date-picker.mdx`) ✓ | preview ✓
- exports/subcomponents: `Calendar`, `CalendarDayButton`, `DatePicker`, `DateRangePicker`, `defaultDatePresets()`, `defaultRangePresets()`; interfaces `DatePreset`, `DateRangePreset`, `DatePickerProps`, `DateRangePickerProps`; types `CalendarProps`, `CalendarDayButtonProps`; re-exported `DateRange`, `Matcher` (canonical:752)
- proposed category: Pickers — calendar-popover date/range selection control

### API surface (ground truth)
- **Calendar** (`CalendarProps`, canonical:80–92): every `DayPicker` prop intersected + `showOutsideDays` (default true), `ref`. `mode` single/range/multiple supported via DayPicker union.
- **DatePicker** (`DatePickerProps`, canonical:420–468): `value`, `onValueChange`, `placeholder` (default "Pick a date"), `formatOptions`, `locale`, `presets`, `disabledDates` (Matcher | Matcher[]), `calendarProps` (Omit mode/selected/onSelect/disabled), `disabled`, `side` (default "bottom"), `align` (default "start"), `className`, `aria-label`.
- **DateRangePicker** (`DateRangePickerProps`, canonical:580–633): same + `numberOfMonths` (default 2). Closes only when both ends chosen (canonical:671).
- **Presets:** disabled-date gating reuses react-day-picker matcher evaluators; preset whose date/range intersects `disabledDates` is rendered disabled and refuses to emit (canonical:535–560, 707–735).
- States: empty (placeholder + `data-empty`), selected, disabled, today (ring), range start/middle/end, outside days, disabled days (opacity-50), `captionLayout="dropdown"`, `numberOfMonths`, controlled-only (`value`/`onValueChange`).

### Currently demonstrated
- preview exports: `datePicker` (single picker + inline Calendar), `datePickerPresets` (Today/Tomorrow rail), `datePickerRange` (range + Last 7/30 presets), `calendarInline` (bare Calendar).
- mdx sections: Installation, Usage, Anatomy, Examples (With presets / Date range / Inline calendar), API Reference (4 AutoTypeTables: DatePickerProps, DateRangePickerProps, CalendarProps, CalendarDayButtonProps), Accessibility (+ full key table), Do/Don't.
- API table status: 4 AutoTypeTables present — good coverage of the prop interfaces.

### GAPS
- [VARIANT] `disabledDates` is a TRUTH-critical feature (whole preset-gating subsystem + 4 dedicated tests) but **no preview demonstrates it**. No example shows blocked days in the grid or a disabled preset. (canonical:439–440, 540–560; tests:149–259)
- [VARIANT] `disabled` (whole-control disabled trigger) is never shown in a preview — date-picker has no States example unlike color-picker. (canonical:452–453)
- [VARIANT] `calendarProps` knobs (`captionLayout: 'dropdown'`, `timeZone`, `startMonth`/`endMonth`, `footer`) are mentioned in mdx Anatomy (mdx:39, 51) and tested (test:132–147) but **not demonstrated** in any preview. The dropdown month/year caption is a notable visual the user can't see.
- [VARIANT] `numberOfMonths` override on `DateRangePicker` (default 2, can be 1) is tested (test:283–306) but never shown.
- [VARIANT] `formatOptions` / `locale` custom formatting never demonstrated (only default short format shown).
- [API] No AutoTypeTable for `DatePreset` / `DateRangePreset` interfaces (canonical:314–327) — consumers passing custom `presets` get no documented shape. `defaultDatePresets()`/`defaultRangePresets()` helper signatures are also undocumented in a TypeTable.
- [API] Re-exported `DateRange` and `Matcher` types (canonical:752) are used in the public API (`value`, `disabledDates`) but not surfaced.
- [MATRIX] No grid contrasting single vs range, with-presets vs without — minor; the three examples cover the main axes.
- [PROSE] mdx:116 a11y prose claims day buttons carry `aria-label`s like "Saturday, June 21st, 2026" — this is react-day-picker default behavior, accurate, but the ordinal format ("21st") is locale/version-dependent; low-risk but worth verifying against the pinned rdp v9.
- [STRUCTURE] Standard sections all present and well-ordered.

### Verdict
- coverage: ~70% (strong API tables; missing the disabled-dates story, disabled state, and calendarProps visuals)
- effort: M
- top 3 fixes: (1) add a "Disabled dates" preview showing blocked grid days + a gated preset; (2) add a States/Disabled preview + a `captionLayout="dropdown"` example; (3) add AutoTypeTable/TypeTable for `DatePreset` + `DateRangePreset` and surface `DateRange`/`Matcher`.

---

## color-picker
- files: canonical ✓ | test ✓ | mdx (`color-picker.mdx`) ✓ | preview ✓
- exports/subcomponents: `ColorPicker`, `DEFAULT_COLORS` (14-color palette), interface `ColorOption`, interface `ColorPickerProps` (canonical:38, 63, 80, 134)
- proposed category: Pickers — swatch-popover color selection control

### API surface (ground truth)
- **ColorPickerProps** (canonical:80–119): `value` (matched against `ColorOption.name`), `onValueChange` (emits `name`), `colors` (default `DEFAULT_COLORS`), `columns` (default 7), `disabled` (default false), `aria-label` (default "Pick a color"), `className`, `ref` (to trigger button).
- Controlled-only. Selected swatch → `aria-pressed="true"` + `border-purple` + check badge (`bg-background`). Trigger is `icon-sm` outline `Button` with a `rounded-sm` fill chip.
- States: selected, empty (`value=""` → transparent trigger), disabled. `DEFAULT_COLORS` = 14 named options all using semantic tokens.

### Currently demonstrated
- preview exports: `colorPicker` (interactive default), `colorPickerStates` (selected / empty / disabled).
- mdx sections: Installation, Usage, Palette (custom `colors` + `columns` code), Examples (States), API Reference (1 AutoTypeTable: ColorPickerProps), Accessibility (+ key table), Do/Don't.
- API table status: 1 AutoTypeTable (`ColorPickerProps`).

### GAPS
- [VARIANT] `columns` prop (default 7) is documented in the Palette code block (mdx:49) but **no live preview** renders a non-default column count — the `--swatch-cols` dynamic-grid behavior is unverified visually.
- [VARIANT] Custom `colors` palette (the headline "data backed by tokens" feature) has a code sample (mdx:36–51) but **no ComponentPreview** — readers can't see a custom palette rendered.
- [API] No AutoTypeTable for `ColorOption` (canonical:38–56). The Palette section explains `{ name, label, color }` in prose, but the public interface (used whenever `colors` is passed) is not in a type table. `DEFAULT_COLORS` (the exported palette) is not enumerated in the docs.
- [PROSE] **STALE/CONTRADICTORY:** mdx:27 says "The trigger is a **round swatch**" and mdx:82-area context implies round, but canonical:156 comment explicitly states "Trigger is a control → `rounded-md` (Button's native radius); **no `rounded-full`**" and the preview comment (preview:10) says "click the `rounded-md` trigger". The mdx Usage prose calling the trigger "round" is stale — the trigger is `rounded-md`/`rounded-sm`, only the in-grid swatches are `rounded-full`. QUOTE (mdx:27): *"The trigger is a round swatch showing the current selection"*.
- [PROSE] Accessibility key table (mdx:90–94) lists `Tab` / `Shift+Tab` to "Move focus between swatches in the open grid." Each grid swatch is a `Button` so this is plausible, but there is no arrow-key roving-tabindex (it's plain tab order) — accurate as written.
- [STRUCTURE] No standalone "Examples" beyond States; the custom-palette and columns demos belong under Examples. Sections otherwise present.

### Verdict
- coverage: ~65% (states covered; custom palette + columns only in code, not previews; ColorOption untyped in tables)
- effort: M
- top 3 fixes: (1) fix the stale "round swatch" trigger description (mdx:27) — it's `rounded-md`; (2) add a custom-palette + `columns={3}` ComponentPreview; (3) add AutoTypeTable for `ColorOption` and document/enumerate `DEFAULT_COLORS`.

---

## emoji-picker
- files: canonical ✓ | test ✓ | mdx (`emoji-picker.mdx`) ✓ | preview ✓
- exports/subcomponents: `EmojiPicker`, `EMOJI` (dataset record), interface `EmojiEntry`, type `EmojiCategory`, interface `EmojiPickerProps` (canonical:31, 41, 57, 422, 484)
- proposed category: Pickers — searchable emoji-grid popover selection control

### API surface (ground truth)
- **EmojiPickerProps** (canonical:422–473): `onSelect` (required), `trigger` (custom element), `triggerLabel` (default "Pick an emoji"), `searchPlaceholder` (default "Search emoji"), `open` (controlled), `onOpenChange`, `closeOnSelect` (default true), `side` (default "bottom"), `align` (default "start"), `className`, `ref` (to trigger).
- Controlled + uncontrolled open supported (canonical:498–507). Search filters by name + keywords (canonical:415–419). Empty state + live `role="status"` result count announcement (canonical:528–534, 580–587). 9 categories, ~300 curated emoji.
- States: closed (default), open, searching/filtered, empty (no match), custom trigger, controlled open.

### Currently demonstrated
- preview exports: `emojiPicker` (controlled `open` default-open demo + value display), `emojiPickerInput` (append to Input), `emojiPickerCustomTrigger` (Button trigger, `align="center"`).
- mdx sections: Installation, Usage, default preview, How it works, Examples (Insert into a field / Custom trigger), API Reference (1 AutoTypeTable: EmojiPickerProps), Accessibility (+ key table), Do/Don't.
- API table status: 1 AutoTypeTable (`EmojiPickerProps`).

### GAPS
- [VARIANT] `closeOnSelect={false}` (stay-open-after-pick) is tested (test:124–138) but never demonstrated in a preview.
- [VARIANT] `searchPlaceholder` / `triggerLabel` customization never shown.
- [VARIANT] `side` prop never demonstrated (only default-bottom and one `align="center"`).
- [VARIANT] The **empty state** ("No emoji found.") and the live result-count status are core UX (tested test:69–102) but no preview surfaces them — reader can't see the empty/no-results state without typing gibberish themselves.
- [API] No AutoTypeTable/TypeTable for `EmojiEntry` (canonical:31–38), `EmojiCategory` (canonical:41–50), or the `EMOJI` dataset shape — yet the mdx explicitly tells consumers to "extend or replace the exported `EMOJI` record" (mdx:39). The shape they'd extend is undocumented in a type table.
- [PROSE] **POTENTIALLY STALE:** mdx:34-35 says "a few hundred of the most common emoji grouped into **nine** categories" — count check: canonical `EMOJI` has 9 keys (Smileys, People, Animals, Food, Activities, Travel, Objects, Symbols, Flags) ✓ accurate. But note the "Animals" category (canonical:191–222) also contains plants/flowers (cherry blossom, rose, sunflower, tree, cactus) — minor data-quality note, not a doc gap.
- [PROSE] Usage (mdx:20) shows bare `<EmojiPicker onSelect={...} />`; default preview uses controlled `open`/`onOpenChange` — both fine, but the uncontrolled-open path (the simplest usage) is never visually demonstrated opening (the default preview force-opens via `open={true}`).
- [STRUCTURE] All standard sections present.

### Verdict
- coverage: ~70% (good prop table + 3 previews; missing empty-state demo, closeOnSelect, and EMOJI/EmojiEntry type tables)
- effort: M
- top 3 fixes: (1) add AutoTypeTable for `EmojiEntry` + document `EmojiCategory`/`EMOJI` shape (consumers are told to extend it); (2) add a preview showing the empty/no-results state and result-count status; (3) demonstrate `closeOnSelect={false}` (multi-pick reaction bar).

---

## settings-row
- files: canonical ✓ | test ✓ | mdx (`settings-row.mdx`) ✓ | preview ✓
- exports/subcomponents: `SettingsSection`, `SettingsCard`, `SettingsRow`; interfaces `SettingsSectionProps`, `SettingsRowProps`, type `SettingsCardProps` (canonical:6, 67, 94)
- proposed category: Data Display (Layout) — presentational settings-screen layout primitives

### API surface (ground truth)
- **SettingsSection** (canonical:6–15): `title`, `description` (+ all `section` props sans `title`), forwarded ref. Renders `<h3>` title.
- **SettingsCard** (canonical:67): plain `div` props; collapses last row border.
- **SettingsRow** (canonical:94–117): `label` (required), `description`, `children` (control slot), `controlId` (→ renders real `<label htmlFor>`), `labelProps` (merged onto label), + all `div` props.
- Responsive: stacks `flex-col` on narrow, `sm:flex-row` horizontal (canonical:140). Control slot only renders when `children != null` (canonical:162).
- No CVA, no enum variants — purely structural/presentational, server-safe.

### Currently demonstrated
- preview exports: `settingsRow` (card with Switch + Select + Switch rows), `settingsSection` (titled section with 3 switch rows).
- mdx sections: Installation, Usage, Anatomy, Examples (one preview: `settingsSection`), API Reference (3 AutoTypeTables: SettingsRowProps, SettingsCardProps, SettingsSectionProps), Accessibility (+ key table), Do/Don't.
- API table status: all 3 prop interfaces have AutoTypeTables. **Strong.**

### GAPS
- [VARIANT] `controlId` (the accessibility headline — renders a real `<label htmlFor>`, tested test:31–39) is documented in prose (mdx:84-86) and Accessibility but **not demonstrated in any preview** with a native input + matching id. Both previews use `aria-label` on composite controls instead.
- [VARIANT] `labelProps` merge prop (canonical:116) is never demonstrated.
- [VARIANT] The "various control types" matrix is partially shown (Switch, Select) but the doc/JSDoc also lists `Input`, `Button`, badge, and **read-only value** as valid controls (canonical:106, mdx:55-56) — none of Input/Button/badge/read-only-value are demonstrated.
- [VARIANT] `SettingsRow` with **no `children`** (label-only row, valid per canonical:162) is never shown.
- [MISSING] The mdx Examples section references only `settingsSection` (mdx:65). The preview file also exports `settingsRow` (a card with mixed Switch/Select controls) which is **not surfaced by any ComponentPreview in the mdx** — an existing demo is orphaned. The default `preview: settingsRow` frontmatter (mdx:4) drives the page hero, but the `settingsRow` export is never shown via an inline `<ComponentPreview>` in the body.
- [MATRIX] A control-type matrix (Switch / Input / Select / Button / read-only) would reveal real layout differences — currently only switch+select shown.
- [API] Complete — all three sub-part prop interfaces documented.
- [PROSE] mdx:59 "All three are flat named exports — there is no dotted namespace." Accurate. Sections all present.

### Verdict
- coverage: ~75% (excellent API tables; missing the controlId demo, control-type variety, and label-only row)
- effort: S
- top 3 fixes: (1) add a preview using `controlId` + a native `Input` (the documented a11y path); (2) add a control-variety example (Input / Button / read-only value / badge); (3) surface the existing `settingsRow` export via a `<ComponentPreview>` (or remove it).

---

## data-list
- files: canonical ✓ | test ✓ | mdx (`data-list.mdx`) ✓ | preview ✓
- exports/subcomponents: `DataList<T>`; types `SortDirection`, `SortState`, interfaces `DataListColumn<T>`, `DataListProps<T>` (canonical:21, 24, 35, 74)
- proposed category: Data Display — generic typed data table with selection/sort/states

### API surface (ground truth)
- **DataListProps<T>** (canonical:74–159): `columns`, `data`, `getRowId` (default index), `selectable` (default false), `selectedIds` + `onSelectionChange` (controlled selection, Set<string>), `sort` + `onSortChange` (controlled sort), `loading` (default false), `loadingRows` (default 5), `emptyState` (override), `onRowClick` (activatable rows), `toolbar` slot, `footer` slot, + all `table` props.
- **DataListColumn<T>** (canonical:35–72): `key`, `header`, `render?`, `sortable?` (default false), `align?` ("start"|"end", default start), `className?`, `headerClassName?`, `interactive?` (default false — skips injected row-action button on first column).
- **SortState** (canonical:24–29): `{ key, direction }`; **SortDirection** = "asc"|"desc".
- States/behaviors: header tri-state select-all (checked/indeterminate/unchecked), off-page selection preservation (union/clear semantics), sort cycle asc→desc→cleared, loading skeletons + `aria-busy` + live status, empty state (default + custom), row activation with injected first-cell `<button>` (preserves table semantics), `interactive` first-column skip, toolbar/footer composition slots.

### Currently demonstrated
- preview exports: `dataList` (sortable, custom renders, Badge/font-mono cells), `dataListSelectable` (selectable + pre-selected + sort), `dataListClickable` (onRowClick + footer status), `dataListLoading` (loading, 4 rows), `dataListEmpty` (default empty state).
- mdx sections: Installation, Usage, default preview, Anatomy, Selection, Sorting, Row activation (+ Activation accessibility), Loading & Empty states, Scope (G7 split table), API Reference (2 AutoTypeTables: DataListProps, DataListColumn), Accessibility (+ key table), Do/Don't. **Very thorough prose.**
- API table status: 2 AutoTypeTables (`DataListProps`, `DataListColumn`).

### GAPS
- [VARIANT] `column.interactive` (first-column-renders-own-control → skip injected action button; tested test:392–421, 484–524) is a real behavioral axis with no preview. The clickable example (`dataListClickable`) uses the injected-button path only; no example shows a first column with a link + `interactive: true`.
- [VARIANT] `column.align="end"` is used in the preview (amount column, preview:51) ✓. `headerClassName` and per-column `className` are not individually demonstrated (minor).
- [VARIANT] `toolbar` slot is documented (Scope table, mdx:164) and tested (test:555–577) but **no preview** mounts a real toolbar (search/filter bar). `dataListClickable` uses `footer` only. The toolbar+footer composed example (the headline Scope story) is absent from previews.
- [VARIANT] Custom `emptyState` override (canonical:129, tested test:299–311) — only the default empty state is shown; no preview of a custom empty node.
- [VARIANT] Uncontrolled selection / uncontrolled sort (omit `selectedIds`/`sort`) is the documented default path but every preview is controlled. Not shown.
- [VARIANT] `getRowId` defaulting to index vs a real id — the Do/Don't warns about index-based ids, but no contrast example.
- [MATRIX] A **selectable × loading** or **selectable × empty** combination is not shown (selectable column behavior during loading/empty — skeleton checkbox cell, disabled select-all when 0 rows — is real, canonical:411, 481–485). Worth a matrix only if it reveals the disabled select-all + skeleton checkbox.
- [API] No TypeTable for `SortState` / `SortDirection` (canonical:21–29) — these are public types a controlled-sort consumer must construct. Referenced in Usage/Sorting code but not in a type table.
- [API] `DataListColumn<T>` AutoTypeTable present ✓ but generic `<T>` rendering in AutoTypeTable may not surface the `render(row, index)` signature clearly — verify it renders.
- [PROSE] Anatomy code block (mdx:47–58) lists column fields `{ key, header, render?, sortable?, align?, className?, headerClassName? }` but **omits `interactive?`** (canonical:71) — the column shape in the doc is incomplete. QUOTE (mdx:48): *"columns={[{ key, header, render?, sortable?, align?, className?, headerClassName? }]}"*.
- [STRUCTURE] All sections present, well-ordered, unusually complete.

### Verdict
- coverage: ~75% (rich prose + 5 previews; missing toolbar demo, interactive-column, custom empty, SortState type table; one stale column-shape line)
- effort: M/L
- top 3 fixes: (1) add the headline composed example — `toolbar` (search) + `footer` (pagination) around the table; (2) add a `column.interactive` example (first column is a link) + add `interactive?` to the Anatomy column shape (mdx:48); (3) add a TypeTable for `SortState`/`SortDirection` and a custom-`emptyState` preview.

---

## kbd
- files: canonical ✓ | test ✓ | mdx (`kbd.mdx`) ✓ | preview ✓
- exports/subcomponents: `Kbd`, `KbdGroup`, `kbdVariants` (CVA); interfaces `KbdProps`, `KbdGroupProps` (canonical:14, 49, 88, 137, 150)
- proposed category: Typography & Content — inline keyboard-key indicator chip

### API surface (ground truth)
- **kbdVariants** (canonical:14–26): one CVA axis `size` = `xs` | `sm` | `default` (default `default`).
- **KbdProps** (canonical:49–71): `size` ("xs"|"sm"|"default"), `keys` (readonly string[] — each token its own chip, takes precedence over children), `os` ("mac"|"other", default "mac"), `children` (single key), + all `kbd` props, ref.
- **KbdGroup** (canonical:137, 150): flex-row wrapper, span props + ref.
- OS rewriting: MODIFIER_MAP (canonical:33–41) rewrites `⌘→Ctrl, ⇧→Shift, ⌥→Alt, ⌃→Ctrl, ⏎→Enter, ↵→Enter, ⌫→Bksp` when `os="other"`. Single-string child is also rewritten.
- Non-interactive `<kbd>`, `pointer-events-none`, `select-none`. Multi-key ref lands on group root, not fanned.

### Currently demonstrated
- preview exports: `kbd` (single ⌘/K/Esc), `kbdCombos` (keys arrays incl. `⌘⇧P`, `⌘⏎`, + a `KbdGroup` with `⌃⌫`), `kbdSizes` (xs/sm/default).
- mdx sections: Installation, Usage, Anatomy, Combos, Sizes, Platform Labels (mac vs other code), API Reference (2 AutoTypeTables: KbdProps, KbdGroupProps), Accessibility (+ key table noting it's non-interactive), Do/Don't.
- API table status: 2 AutoTypeTables (`KbdProps`, `KbdGroupProps`). All sizes demonstrated.

### GAPS
- [VARIANT] `os="other"` (the Windows/Linux word-rewrite — `⌘→Ctrl`, the component's distinguishing feature, tested test:26–31) is shown only in a **static code comment** (mdx:59–61), **never in a live ComponentPreview**. Reader cannot see the rendered `Ctrl K` chips. The `kbdCombos` preview hardcodes `os` default (mac); no preview passes `os="other"`.
- [VARIANT] Single-string-child OS rewriting (canonical:121–122 — `<Kbd os="other">⌘</Kbd>` → "Ctrl") is not demonstrated.
- [VARIANT] `kbdVariants` is exported (canonical:14) but not mentioned in docs (minor — consistent with other CVA components, but flagging for completeness).
- [API] Both prop interfaces documented via AutoTypeTable. Complete.
- [PROSE] Accessibility key table (mdx:78–80) correctly states Kbd is presentational with no keyboard behavior — accurate, good. All prose matches reality.
- [STRUCTURE] All standard sections present and ordered well.

### Verdict
- coverage: ~85% (sizes + combos + groups all shown, full API tables; the only real miss is a *live* `os="other"` preview)
- effort: S
- top 3 fixes: (1) add a live `os="mac"` vs `os="other"` side-by-side ComponentPreview (currently only a code comment); (2) demonstrate single-child OS rewriting; (3) optionally note `kbdVariants` export for advanced styling.

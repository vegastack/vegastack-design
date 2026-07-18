# BATCH 04 — Select family (field-inline, select, country-select, state-select, command, filter-bar)

## BATCH SUMMARY

All six components have a complete file quartet (canonical + test + mdx + preview), and every preview module is barrel-exported in `apps/docs/components/preview/index.tsx`. No missing pages, no missing previews. The two **selection comboboxes built on Command+Popover (country-select, state-select) are the thinnest docs** in the batch: country-select has no Anatomy and omits its public helper/data API entirely; both bury the visible-empty / disabled / scrollable variants. `select`, `command`, and `filter-bar` are well covered. `field-inline` is solid but does not demonstrate its empty/fallback state and a11y-name resolution chain — the single biggest API+test focus of that component.

Counts:
- Components audited: 6
- Files present: 24/24 (6× canonical, test, mdx, preview)
- Components with material gaps: 6 (severity varies; country-select is the worst)
- Components essentially clean: select (1)
- AutoTypeTable issues: command intentionally uses hand-written `<TypeTable>` (cmdk types don't introspect) — acceptable but unverified-by-tooling; country-select omits exported helper/data API from docs entirely.

| Component | Proposed category | One-line reason |
| --- | --- | --- |
| field-inline | Form & Inputs | Click-to-edit text field; commit/cancel single-value editing. |
| select | Selection Controls | Single-choice listbox dropdown (Base UI Select) with groups. |
| country-select | Selection Controls | Searchable country combobox returning ISO code. |
| state-select | Selection Controls | Searchable subdivision combobox with free-text fallback. |
| command | Menus & Navigation | Searchable command palette (cmdk) + ⌘K dialog. |
| filter-bar | Data Display & Toolbars | Removable filter chips + add-filter menu + search toolbar. |

---

## field-inline
- files: canonical ✓ | test ✓ | mdx (`field-inline.mdx`) ✓ | preview ✓
- exports/subcomponents: `FieldInline` (single component; no subcomponents). Renders a `<span role="button">` in display mode, an `Input` (`data-slot="field-inline"`) in edit mode.
- proposed category: Form & Inputs — a presentational click-to-edit single-value text field; `onCommit` is the persistence hand-off.
### API surface (ground truth)
- CVA axes: none.
- boolean props: `borderless` (default false).
- key props: `value` (req), `onCommit` (req), `placeholder`, `label`, `aria-label`, `aria-labelledby`, `className`, `ref` (forwards to display `<span>` idle / edit `<input>`).
- States: display vs edit mode swap; hover affordance (`hover:bg-muted`); focus-visible ring; empty-value fallback rendering (`value===""` → `placeholder` muted, else `"Edit value"`); Enter/blur commit (fires only when changed, once — double-commit guard); Escape cancel; focus+select-all on entering edit.
- A11y name resolution chain (canonical:147-158, heavily tested): `aria-labelledby` → `aria-label` → `label` → `placeholder` → `"Edit value"`.
### Currently demonstrated
- preview exports: `fieldInline` (default; "Untitled task", label+placeholder, helper text) — used only as the frontmatter page-hero (`preview: fieldInline`). `fieldInlineBorderless` ("Q3 planning doc", borderless + larger font) — the only inline `<ComponentPreview>`.
- mdx sections: Installation, Usage, Borderless, API Reference (AutoTypeTable `FieldInlineProps` ✓), Accessibility (excellent — documents full name-resolution chain + focus ring), Do/Don't.
- API table status: AutoTypeTable present and correct (`FieldInlineProps`).
### GAPS (one per line, tagged)
- [VARIANT] Empty/fallback state never demonstrated in any preview — both previews seed a non-empty `value`. The `value===""` path (muted placeholder, then the generic `"Edit value"` fallback when placeholder also absent) is the component's most a11y-sensitive branch (own test `renders a named fallback button when value and placeholder are empty`) and is invisible to a docs reader.
- [VARIANT] The display→edit→commit/cancel interaction (the core behavior) is only reachable by interacting with the live preview; no static "states" grid or annotated edit-mode shot. Acceptable for an interactive widget but worth a Usage note that the hero IS interactive.
- [PROSE] Accessibility section is strong, but Usage prose says "swaps in a focused `Input`" without noting the double-commit guard / "fires only when changed" — that nuance lives only in the Do/Don't `dont`. Minor.
- [API] none — single interface, fully tabled.
- [STRUCTURE] No "Examples" heading; the two previews are split across frontmatter-hero + a single "Borderless" section. Fine for a one-component page.
- [MISSING] none.
### Verdict
- coverage: ~80% (interaction-complete, but empty/fallback state undemonstrated)
- effort: S
- top 3 fixes: (1) add a preview/example showing the empty `value=""` state (placeholder + `"Edit value"` fallback); (2) add a one-line note that the hero example is interactive (click to edit); (3) optionally show the `label` vs `placeholder` accessible-name distinction visibly.

---

## select
- files: canonical ✓ | test ✓ | mdx (`select.mdx`) ✓ | preview ✓
- exports/subcomponents: `Select` (root, Base UI `Select.Root`), `SelectValue`, `SelectGroup`, `SelectTrigger` (CVA `size`), `SelectList`, `SelectContent`, `SelectItem`, `SelectLabel`, `SelectSeparator`. Plus exported `selectTriggerVariants`.
- proposed category: Selection Controls — single-choice (or `multiple`) listbox dropdown.
### API surface (ground truth)
- CVA axes: `selectTriggerVariants.size` = `sm` (h-7) | `default` (h-8) | `lg` (h-10).
- key props: `Select` is generic `<Value, Multiple>` — `value`/`defaultValue`/`onValueChange`, `items` (label map), `name`, `disabled`, `modal` (default true), and **`multiple`** (the `Multiple` type param). `SelectContent`: `side`, `align`, `sideOffset`, `alignItemWithTrigger` (default true), `positionerProps`, `listProps`. `SelectItem`: `value`, `disabled`. `SelectTrigger`: `size`, reflects `aria-invalid`/`disabled`.
- States: placeholder/empty, selected (check indicator), highlighted (keyboard/hover), disabled item, disabled root/trigger, grouped+labelled+separated, scrollable (scroll arrows), open/closed (chevron flip), invalid (`aria-invalid`/`data-invalid` destructive border).
### Currently demonstrated
- preview exports: `select` (flat list; empty + `defaultValue` pre-selected pair), `selectGroups` (3 labelled groups + 2 separators + 1 disabled item + pre-selected), `selectSizes` (sm/default/lg), `selectStates` (disabled trigger + 30-item scrollable list).
- mdx sections: Installation, Usage, Anatomy (full part-by-part), Groups & separators, Sizes, States, Form integration (Field), API Reference (8 AutoTypeTables — every subcomponent ✓), Accessibility (combobox/listbox roles, `aria-selected`, full keyboard table incl. type-ahead, focus return), Do/Don't.
- API table status: complete — all 8 subcomponent Props interfaces tabled.
### GAPS (one per line, tagged)
- [VARIANT] `multiple` mode is part of the typed API (`SelectProps<Value, Multiple>`, canonical:44-47/64) but is **neither tested nor demonstrated nor mentioned in prose**. The Do/Don't even says "never use a Select for picking multiple values inline (use checkboxes)" — which contradicts the existence of the `multiple` type parameter. Either document multi-select or note it's intentionally unsupported; right now it's a silent API surface.
- [VARIANT] `aria-invalid` / `data-invalid` destructive trigger state (canonical:23) is described in Accessibility prose but never shown in a preview (no error-state example, despite "Form integration" section).
- [API] none — AutoTypeTable coverage is exemplary.
- [PROSE] Do/Don't `dont` re: "picking multiple values inline" reads as stale/contradictory against the `multiple` generic param. QUOTE: `"...or for picking multiple values inline (use checkboxes)..."`.
- [STRUCTURE] none — sections complete and well ordered.
- [MISSING] none.
### Verdict
- coverage: ~90%
- effort: S
- top 3 fixes: (1) resolve the `multiple` ambiguity — demo it or explicitly mark unsupported and drop the contradictory Don't; (2) add an invalid/error-state trigger preview (ties Form integration to the documented `aria-invalid` tint); (3) optionally show `alignItemWithTrigger={false}` visually (only documented in prose).

---

## country-select
- files: canonical ✓ | test ✓ | mdx (`country-select.mdx`) ✓ | preview ✓
- exports/subcomponents: `CountrySelect` (composite: `Button`+`Popover`+`Command`), plus exported data API: `COUNTRIES` (198-entry array), `getCountryByCode()`, and the `Country` interface. No subcomponents of its own.
- proposed category: Selection Controls — searchable country combobox returning the ISO 3166-1 alpha-2 code.
### API surface (ground truth)
- CVA axes: none (trigger is a `Button variant="outline"`).
- key props: `value` (ISO code, controlled), `onValueChange(code)`, `placeholder` (default "Select country"), `disabled`, `countries` (override array, default `COUNTRIES`), `aria-label`, `className`, `ref` (→ trigger button).
- Exported helpers/data (public surface): `COUNTRIES: Country[]` (198, unique codes — tested), `getCountryByCode(code)` (case-insensitive — tested), `Country { code; name; flag }`.
- States: closed trigger (placeholder muted OR selected flag+name), open searchable popover, filtered list, empty-results ("No country found."), selected row check, disabled, custom `countries`.
### Currently demonstrated
- preview exports: `countrySelect` (default; US pre-selected + a disabled `value="FR"`), `countrySelectEmpty` (nothing selected, muted placeholder).
- mdx sections: Installation, Usage, **Examples** (single `<ComponentPreview name="countrySelectEmpty">` only), API Reference (AutoTypeTable `CountrySelectProps` ✓), Accessibility, Do/Don't.
- API table status: `CountrySelectProps` tabled — but the exported **data API is entirely undocumented**.
### GAPS (one per line, tagged)
- [API] `getCountryByCode()`, `COUNTRIES`, and the `Country` interface are public exports (and tested as load-bearing for billing/address use) but appear **nowhere in the mdx**. A consumer can't discover the lookup helper or the data shape from the docs.
- [VARIANT] The "Examples" section embeds only `countrySelectEmpty`. The richer default preview (`countrySelect` — selected flag+name + disabled side-by-side) is the frontmatter hero but is **not referenced inline**, so the selected and disabled states are only visible at the very top, not under "Examples".
- [VARIANT] Open/search/empty-results states never shown statically — "No country found." (canonical:336) and the filter behavior are only reachable by driving the live hero. No mention in prose of the empty-results copy.
- [VARIANT] `countries` override prop (custom dataset) is in the API table but never demonstrated, despite being a tested capability.
- [PROSE] No mention that the trigger is a full-width `Button variant="outline"` sized via `className` (consumer wraps in `w-64` in the preview) — a layout footgun (defaults to `w-full`).
- [STRUCTURE] **No Anatomy section** (unlike select/state-select/command/filter-bar), and no keyboard table — only a 1-line Accessibility bullet list. Thinnest page in the batch (1355 bytes).
- [MISSING] page exists but is thin; data-API documentation missing.
### Verdict
- coverage: ~45%
- effort: M
- top 3 fixes: (1) document the exported data API (`getCountryByCode`, `COUNTRIES`, `Country`) — add a TypeTable/section; (2) reference the default `countrySelect` preview inline under Examples (currently selected+disabled states are hero-only); (3) add Anatomy + width/`className` note + an empty-results / `countries`-override example.

---

## state-select
- files: canonical ✓ | test ✓ | mdx (`state-select.mdx`) ✓ | preview ✓
- exports/subcomponents: `StateSelect` (composite: `Button`/`Popover`/`Command` for countries with data, falls back to `Input`), plus exported data API: `STATES_BY_COUNTRY` (45 countries / 1187 subdivisions), `getStatesByCountry()`, `hasStates()`, and the `State` interface.
- proposed category: Selection Controls — searchable subdivision combobox with a free-text fallback.
### API surface (ground truth)
- CVA axes: none.
- key props: `country` (req, drives dataset + combobox-vs-fallback), `value` (subdivision code, controlled), `onValueChange`, `placeholder` (default "Select state"), `disabled`, `id`, `aria-label`, `className` (→ trigger/input), `containerClassName` (→ root wrapper), `ref` (→ root `<div>`).
- Exported helpers/data: `STATES_BY_COUNTRY`, `getStatesByCountry()` (case-insensitive, `[]` for unknown), `hasStates()`, `State { code; name }`.
- States: combobox (country with data) — closed (placeholder/selected via `MapPin`), open, filtered, empty-results ("No state found."), selected check, **toggle-off** (re-selecting selected clears to `""`, canonical:1576), keyboard Enter-selects-highlighted; free-text fallback (country w/o data, e.g. SG) with `MapPin` leading icon; disabled (both modes).
### Currently demonstrated
- preview exports: `stateSelect` (default US, empty start), `stateSelectCountries` (US/CA/AU side-by-side, two pre-selected), `stateSelectStates` (SG free-text fallback + disabled US `value="CA"`).
- mdx sections: Installation, Usage, Countries, States, API Reference (AutoTypeTable `StateSelectProps` ✓ + a prose note re: `className` vs `containerClassName`), Accessibility (combobox role, full keyboard table, fallback note), Do/Don't.
- API table status: `StateSelectProps` tabled; `className`/`containerClassName` distinction explained in prose.
### GAPS (one per line, tagged)
- [API] Exported data API (`STATES_BY_COUNTRY`, `getStatesByCountry`, `hasStates`, `State`) is undocumented in the mdx — same omission pattern as country-select, and these are tested as load-bearing.
- [VARIANT] **Toggle-to-clear** (selecting the already-selected state fires `onValueChange("")` — a deliberate, tested behavior, canonical:1576/test:60-69) is neither demonstrated nor mentioned in prose. Non-obvious UX a consumer would not expect.
- [VARIANT] Empty-results state ("No state found.") and the open/filter flow are only reachable via the live hero; not shown statically nor quoted in prose.
- [VARIANT] The `MapPin` leading icon appears in both the combobox trigger and the fallback input — a small but distinctive visual the prose never calls out.
- [PROSE] Accessibility says "associate a label via `id` for both modes" but the `aria-label` default-from-selection behavior (combobox can't take name-from-content) is only in the canonical JSDoc, not surfaced — minor.
- [STRUCTURE] No Anatomy section (it's a single composite, so arguably N/A), but given it composes Command+Popover+Input a one-line composition note would help. Otherwise sections are complete and ordered.
- [MISSING] none (page complete; data-API docs missing).
### Verdict
- coverage: ~60%
- effort: M
- top 3 fixes: (1) document the exported data API (`hasStates`/`getStatesByCountry`/`STATES_BY_COUNTRY`/`State`); (2) demonstrate or at least document the toggle-to-clear behavior (surprising and tested); (3) add an empty-results note/example and call out the `MapPin` affordance.

---

## command
- files: canonical ✓ | test ✓ | mdx (`command.mdx`) ✓ | preview ✓
- exports/subcomponents: `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandLoading`, `CommandGroup`, `CommandItem`, `CommandSeparator`, `CommandShortcut`, and `useCommandState` (re-export). Built on cmdk.
- proposed category: Menus & Navigation — searchable command palette + ⌘K overlay.
### API surface (ground truth)
- CVA axes: none.
- key props (cmdk pass-through): `Command`: `filter`, `shouldFilter`, `loop`, `value`/`onValueChange`, `defaultValue`, `label`, `disablePointerSelection`, `vimBindings`. `CommandDialog`: `open`/`defaultOpen`/`onOpenChange`, `title` (default "Command Menu"), `description`, `className`, `commandProps`. `CommandItem`: `value`, `keywords`, `forceMount`, `disabled`, `onSelect`. `CommandGroup`: `heading`, `value`, `forceMount`. `CommandSeparator`: `alwaysRender` + `aria-hidden` (a11y fix). `CommandLoading`: `progress`, `label`. `CommandInput`: `value`/`onValueChange`, `aria-label` (placeholder fallback).
- States: empty (`CommandEmpty`), loading (`CommandLoading` progressbar), filtered, group auto-hide, disabled item, selected/highlighted (`data-selected` → `bg-accent`), keyword match, `forceMount` pinned, dialog open/closed.
### Currently demonstrated
- preview exports: `command` (inline; 2 groups + separator + shortcuts + icons), `commandDialog` (⌘K-bound overlay with toggle button), `commandAsync` (CommandLoading ↔ loaded results toggle), `commandAdvanced` (custom `filter`, `loop`, `keywords`, `alwaysRender` separator, `useCommandState` custom empty).
- mdx sections: Installation, Usage, dependency/primitive-exception callouts, Anatomy (every part), Command dialog (⌘K), Async results, Advanced filtering, API Reference (10× hand-written `<TypeTable>` — every subcomponent + `useCommandState`), Accessibility (listbox/option, `aria-controls`/`aria-activedescendant`, dialog focus trap, full keyboard table), Do/Don't.
- API table status: complete via `<TypeTable>` (not AutoTypeTable — cmdk types aren't introspectable; this is the documented convention for the cmdk exception).
### GAPS (one per line, tagged)
- [API] Tables are hand-written `<TypeTable>` rather than `<AutoTypeTable>` — correct for cmdk-derived types, but the values are unverified by tooling and can silently drift from cmdk. Not a defect, just a maintenance note.
- [VARIANT] Disabled `CommandItem` is tested (`Billing`, test:36-39/83-92) and shown in the `command` preview (`Billing` is NOT disabled there — the preview's Billing item is enabled). The **disabled** item state is therefore demonstrated in the test but **not** in any preview. Minor.
- [VARIANT] `vimBindings` and `disablePointerSelection` are tabled but never demonstrated or tested — low priority (pass-through cmdk flags).
- [PROSE] Anatomy says `CommandSeparator` "Pass `alwaysRender`…" while canonical adds `aria-hidden` for the listbox a11y fix — the prose mentions `alwaysRender` but not the (well-commented) `aria-hidden` rationale; the Accessibility section also doesn't mention the separator-hiding fix. Minor (it's a correct, invisible fix).
- [STRUCTURE] none — most complete page in the batch.
- [MISSING] none.
### Verdict
- coverage: ~92%
- effort: S
- top 3 fixes: (1) add a disabled-item to a preview (currently only in the test); (2) optional: note in Accessibility that `CommandSeparator` is `aria-hidden` (decorative) so the listbox stays valid; (3) optional: a tiny note that the API tables are hand-maintained for cmdk.

---

## filter-bar
- files: canonical ✓ | test ✓ | mdx (`filter-bar.mdx`) ✓ | preview ✓
- exports/subcomponents: `FilterBar` (root `role="group"`), `FilterChip` (standalone removable pill). Composes `Button`, `DropdownMenu`, `Input`. Interfaces: `FilterBarFilter`, `FilterBarAddOption`, `FilterBarSearch`, `FilterBarProps`, `FilterChipProps`.
- proposed category: Data Display & Toolbars — list/table filter toolbar (chips + add menu + search).
### API surface (ground truth)
- CVA axes: none (FilterChip uses an `active` boolean for purple-vs-neutral tint).
- key props: `FilterBar`: `filters[]` (each `{id,label,value?,icon?,onRemove,active?}`), `addFilters[]` + `onAddFilter`, `addFilterMenu` (custom, wins over declarative), `addFilterLabel`, `addFilterMenuAlign`, `search` (`{value,onValueChange,placeholder?,aria-label?}`), `searchInputProps`, `trailing`, `aria-label`/`aria-labelledby`. `FilterChip`: `label`, `value?`, `icon?`, `onRemove`, `removeLabel?`, `active` (default true).
- States: per-chip active (purple) vs inactive (neutral) tint; presence-only chip (no `value`); chip with icon; declarative add-menu vs custom `addFilterMenu`; disabled add-option; with/without search; with/without trailing; empty (no filters).
### Currently demonstrated
- preview exports: `filterBar` (3 chips — 1 active purple + 2 inactive neutral, icons, declarative add-menu filtered to unused, Clear-all trailing), `filterBarSearch` (1 active chip + add-menu + search input), `filterBarEmpty` (no chips, add-menu + search only).
- mdx sections: Installation, Usage, Anatomy (3 regions), Examples (With search, Empty), **Scope (presentational core)** (records the requirements §12 consumer-owned-state decision + composition paths for clear-all / editable chip popovers / AI suggestions), API Reference (AutoTypeTable `FilterBarProps` ✓ + `FilterChipProps` ✓), Accessibility (group role, remove-button names, keyboard table), Do/Don't.
- API table status: `FilterBarProps` + `FilterChipProps` tabled. Note: the nested object interfaces (`FilterBarFilter`, `FilterBarAddOption`, `FilterBarSearch`) are referenced from `FilterBarProps` but not separately tabled — AutoTypeTable may inline them or render them as opaque types.
### GAPS (one per line, tagged)
- [API] `FilterBarFilter`, `FilterBarAddOption`, and `FilterBarSearch` (the shapes consumers must construct for `filters`, `addFilters`, `search`) are exported interfaces but have **no dedicated AutoTypeTable** — a consumer reading `filters: FilterBarFilter[]` in the table can't see the per-filter `{id,label,value,icon,onRemove,active}` fields without opening source. Worth adding 3 sub-tables.
- [VARIANT] `addFilterMenu` (fully-custom menu slot, e.g. submenus/checkbox multi-select) is tabled + tested (test:93-106) but **never demonstrated** — the more powerful of the two add-filter paths is invisible.
- [VARIANT] `searchInputProps`, `addFilterMenuAlign`, `removeLabel`, and a `disabled` add-option are all tabled/tested but undemonstrated in previews. Disabled add-option especially (it changes menu nav).
- [VARIANT] Presence-only chip (a `FilterChip` with no `value`, label-only) is supported (canonical:221-223) and is the explicit purpose of `active={false}` neutral chips, but every preview chip has a `value` — the value-less variant isn't shown.
- [PROSE] none of note — Scope section is unusually thorough and honest about the presentational boundary.
- [STRUCTURE] Examples covers "With search" + "Empty" but not the default `filterBar` (hero only) nor a custom-menu example. Otherwise complete and well ordered.
- [MISSING] none.
### Verdict
- coverage: ~75%
- effort: M
- top 3 fixes: (1) add AutoTypeTables (or TypeTables) for `FilterBarFilter` / `FilterBarAddOption` / `FilterBarSearch` so the chip/option/search shapes are discoverable; (2) demonstrate the `addFilterMenu` custom-menu path (its whole reason to exist); (3) show a presence-only (value-less) chip and a disabled add-option to round out the chip/menu variants.

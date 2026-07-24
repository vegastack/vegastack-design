# Part B — Per-Component Fixes

Grouped by the proposed taxonomy (`01`). Each component lists concrete actions: **+preview** (new named export(s) in `preview/<name>.tsx` + a `<ComponentPreview>` in the mdx), **+API** (AutoTypeTable/TypeTable rows), **prose** (text fixes), **matrix** (combination grids — your "full matrix where useful" bar). ⛔ = MAJOR (P1, do first). ✨ = polish only (P4). P0 items cross-reference `02`.

---

## 1. Buttons & Actions

### button ✨

- matrix (optional): small variant×size grid (default/outline/destructive × xs/default/lg) for padding/text-size interplay. Marginal — skip if trimming.
- Otherwise **complete** (15 variants + 8 sizes + states all shown).

### icon-button

- +preview: fix `iconButtonStates` — the middle item is `purple` with no state; replace with a clean idle vs disabled vs loading triple.
- prose (optional): name `purple`/`glass`/`link` in Variants.

### copy-button ⛔ (P1)

- +preview `copyButtonStates`: static idle (Copy) + copied (Check, `text-success-text`, `data-copied`) + disabled — the success state currently only appears if the reader clicks.
- +preview `copyButtonVariants`/sizes: demonstrate forwarded `variant`/`size` (e.g. `variant="outline"`, `size="icon"`).
- +preview: a live `onCopied`→toast example.
- prose: add **States** section (idle/copied/disabled) + short Variants/Sizes note (page currently only has a single "Examples").

### split-button

- +preview: extend `splitButtonVariants` from 7 → all 15 (esp. `ghost`, `link`, `glass` — the seam/border renders differently).
- +preview: add a `disabled` action item (`SplitButtonAction.disabled`).
- +API: verify the `SplitButtonProps` discriminated union renders `actions`/`menu` in AutoTypeTable; if not, add a manual `<TypeTable>`.

### toggle

- prose/rename: export `toggleVariantsExample` → `toggleSizesAndStates` and section "Variants" → "Sizes & States" (component has **no** variant axis).

### toggle-group

- **P0**: fix stale "fills solid primary" comments at `preview/toggle-group.tsx:10,42` (see `02` #6).
- +preview `toggleGroupVertical`: `orientation="vertical"` is code-only — render the stacked geometry (Sweep B).
- +preview: wire a live preview into the **Sizes** section (currently code-only).
- +preview (optional): a disabled _whole group_ (only a disabled item is shown today).

---

## 2. Forms & Inputs

### input

- **P0**: fix the "focus-visible ring"/"2px ring" claims — Input has no ring (see `02` #2). Frontmatter + `:54`.
- +preview: add a disabled/invalid **addon** row to `inputWithAddon` (exercises `has-disabled`/`has-aria-invalid` group reactions).
- +preview (optional): an `onValueChange`/`render` example to back the Base UI prose.

### textarea

- +preview `textareaAutoGrow`: the Auto-grow section is code-only; render the grow-to-content behavior + a `rows` starting height (Sweep B).

### password-input

- **P0**: fix the "2px ring on both field and toggle" claim (see `02` #2) — field has no ring, toggle uses `focus-visible:text-foreground`.
- +preview: a statically **revealed** field (EyeOff icon, `aria-pressed=true`) and/or a fully-met requirements example (success rows visible without typing).
- prose: add a **States** heading (masked/disabled/invalid) to match Input/Textarea.

### otp-input

- +preview: add an **invalid** cell to `otpInputStates` (`data-invalid` → destructive border — Sweep D).
- +preview: a non-default `length` (e.g. 4) and/or custom `separator`.
- +preview: convert "Grouped" / "With a label" code blocks to live previews (Sweep B).

### auto-save-input

- **P0**: fix inherited ring claim (`:76-77`, see `02` #2).
- +preview: make saving/saved/error indicators visible at rest (an illustrative row, or a clearly-labeled "edit me" note) — today every field renders idle until typed into.
- +preview: a controlled `value`/`onValueChange` example showing the record-switch baseline reset (the signature, heavily-tested feature).

### text-edit

- +preview: an **invalid** editor (`aria-invalid` + `aria-describedby` error) — destructive container ring has zero coverage (Sweep D).
- prose: add the Cmd/Ctrl+Enter **`onSubmit`** shortcut to the keymap table (it's a headline feature, currently absent) and demonstrate it.
- +preview: `minHeight`/`maxHeight` scrolling content area.

### field

- +preview: a **horizontal** field carrying an `error`/`success` (exercises the `basis-full` row — all error/success previews are vertical today).
- +preview: a `<Field disabled>` example (group-dim at Field level).
- +preview: `borderless` on a textarea or select trigger (override map covers them; only input shown).

### field-inline

- +preview: the empty `value=""` state (muted placeholder, then `"Edit value"` fallback) — the most a11y-sensitive branch, never shown.
- prose: note the hero example is interactive (click to edit).

### label ⛔ (P1)

- **P0**: rewrite all 4 asterisk references (see `02` #1) — the component renders **no** asterisk.
- +preview: give **States** its own preview exercising both `peer-disabled` and `group-data-[disabled]` dimming.
- +preview: reconcile `labelRequired` with the corrected prose (it currently implies a visible indicator).

### slider ✨

- prose/+preview: demo or note `getThumbAriaLabel` (dynamic alternative to `thumbAriaLabels`).
- prose: clarify vertical `orientation` support (document or state out-of-scope).
- +preview (optional): a disabled **range** (two dimmed thumbs).

---

## 3. Selection Controls

### checkbox ⛔ (P1)

- +preview `checkboxSizes`: `size="sm"` is documented but **code-only** — render it (Sweep B).
- +preview: an invalid checkbox (`aria-invalid`/inside `<Field error>`) (Sweep D).
- matrix: a `state × size` grid (`sm`/`default` × unchecked/checked/indeterminate) — the icon scales with the box, so this reveals real difference.

### radio-group

- +preview `radioGroupHorizontal`: `orientation="horizontal"` is code-only — render the wrapping row (Sweep B).
- +preview: invalid state (Sweep D).
- matrix: horizontal group containing a disabled item (orientation × disabled, one preview closes both gaps).

### switch

- +preview: show `sm`/`lg` in the **off** state too (currently only `on`).
- +preview: invalid state (Sweep D).
- matrix: a 3×2 `size × on/off` grid (thumb-travel geometry differs per size).

### select

- **P0/Decision #5**: resolve the `multiple` ambiguity (see `02` #11) — demo it or mark unsupported + drop the contradictory Don't.
- +preview: an invalid/error-state trigger (ties Form-integration to the documented `aria-invalid` tint) (Sweep D).
- +preview (optional): `alignItemWithTrigger={false}`.

### country-select ⛔ (P1)

- +API: document the exported **data API** — `getCountryByCode()`, `COUNTRIES`, `Country` (Sweep C). Entirely undocumented today.
- +preview: reference the default `countrySelect` (selected flag+name + disabled) inline under Examples — currently hero-only; show open/search/empty-results + a `countries` override.
- prose: add **Anatomy** + a width/`className` note (trigger defaults to `w-full` — a layout footgun). Thinnest page in the system (~1.3 KB).

### state-select ⛔ (P1)

- +API: document the exported data API — `hasStates`, `getStatesByCountry`, `STATES_BY_COUNTRY`, `State` (Sweep C).
- prose/+preview: document/demonstrate **toggle-to-clear** (re-selecting the selected state fires `onValueChange("")` — deliberate, tested, surprising).
- +preview: empty-results ("No state found.") + call out the `MapPin` affordance.

---

## 4. Pickers

### date-picker

- +preview "Disabled dates": `disabledDates` gating (the whole preset-gating subsystem + 4 tests, zero previews) — blocked grid days + a gated preset.
- +preview: a disabled (whole-control) state + a `captionLayout="dropdown"` calendar.
- +API: AutoTypeTable/TypeTable for `DatePreset`, `DateRangePreset`; surface re-exported `DateRange`, `Matcher` (Sweep C).
- +preview (optional): `numberOfMonths={1}`, `formatOptions`/`locale`.

### color-picker ⛔ (P1)

- **P0**: fix "round swatch" (`:27`, see `02` #5).
- +preview: a custom `colors` palette + `columns={3}` (the headline "data backed by tokens" feature is code-only) (Sweep B).
- +API: AutoTypeTable for `ColorOption`; enumerate `DEFAULT_COLORS` (Sweep C).

### emoji-picker

- +API: AutoTypeTable/TypeTable for `EmojiEntry`, `EmojiCategory`, the `EMOJI` shape (the mdx tells consumers to extend `EMOJI` but never documents it) (Sweep C).
- +preview: the empty/no-results state + result-count status.
- +preview: `closeOnSelect={false}` (multi-pick); optionally `side`/`triggerLabel`/`searchPlaceholder`.

---

## 5. Overlays

### dialog

- +preview: `showCloseButton={false}` and a scrollable/overflowing-content example (Sweep G).
- +preview (optional): `closeLabel` override.

### alert-dialog ✨

- +preview: a scrollable/long-body example.
- prose (optional): note that `intent` on Content is metadata-only; the visible tint comes from the Action button.

### sheet

- +preview: `showCloseButton={false}` or a width override (`className="max-w-md"` — canonical caps at `max-w-sm`).
- (No side×size matrix — Sheet has no `size` prop; correctly N/A.)

### popover ◑ (weakest overlay)

- +preview `popoverSides`: a 4-side preview (matching hover-card/tooltip — popover ships none) (Sweep E).
- +preview: an `arrow` example (popover has `PopoverArrow` + table but no demo) (Sweep E).
- +preview: `align` (start/center/end) and/or `modal={false}` (Sweep E).

### hover-card ✨

- +preview: an `align` example (Sweep E).
- +preview (optional): a fast-delay (`openDelay`/`closeDelay`) example.

### tooltip ✨

- +preview: an `align` example (Sweep E).
- +preview (optional): a `sideOffset`/offset-function example (backs the prose claim) + a `delay` example.

---

## 6. Menus & Commands

### dropdown-menu ✨

- +preview (optional): a small `inset`-alignment example (prose-only today). Reference-grade otherwise.

### context-menu ✨

- +preview (optional): an `inset` example. Reference-grade otherwise.

### command ✨

- +preview: make the `Billing` item (or another) actually `disabled` so the disabled state shows in a preview (currently only in the test).
- prose (optional): note API tables are hand-maintained `<TypeTable>` for cmdk types; note `CommandSeparator` is `aria-hidden`.

---

## 7. Navigation

### breadcrumb

- +preview: a custom separator (`BreadcrumbSeparator` with `children`, e.g. `/`) — documented, never shown (Sweep B).
- +preview (optional): a dropdown-backed ellipsis to match the Anatomy prose.

### pagination

- +preview: extend `paginationSizes` to include `default` and `icon` (currently loops only `sm`/`lg` though prose enumerates four) — or reword `:103`.
- +preview: a last-page (disabled-**Next**) edge state (today only first-page disabled-Previous).

### tabs

- +preview `tabsVerticalLine`: `orientation="vertical" variant="line"` — the Orientation prose sells the "left-rail indicator" but every vertical preview uses `pill`; the left-rail underline is never rendered. (Or make `tabsVertical` a 2×2 orientation×variant grid.)
- +preview: a disabled trigger (tested, never shown).

### sidebar ◑

- **P0 #8**: the `outline-ring` a11y claim (`:157-158`) is aspirational — recommend **fixing the component** to apply `focus-visible:outline-ring` on `SidebarMenuButton`/`SidebarTrigger` (canonical edit → `registry:build`), then the prose becomes true.
- +preview: a `side="right"` sidebar (prop + `border-l`/`order-last` never shown).
- +preview/matrix: a `SidebarMenuButton` size grid (`sm`/`default`/`lg`).
- +preview: a controlled-mode / `useSidebar()` external-trigger example.

### page-header

- +preview: an `onBack` example (renders the `<button>` back affordance — only `backHref` link is shown; different elements) (Sweep B).
- +preview: a `secondaryMenu` rendered example; optionally a controlled/disabled favorite.
- +preview (optional): a minimal title-only header to anchor progressive composition.

---

## 8. Disclosure

### accordion ✨

- **P0 #7**: fix the `data-open` claim at `:59` (canonical uses `data-panel-open`).
- +preview/snippet (optional): a controlled-mode (`value`/`onValueChange`) example.

### collapsible ✨

- +snippet (optional): controlled mode + `keepMounted`/`hiddenUntilFound`. Excellent otherwise.

---

## 9. Layout & Structure

### card

- +preview: a `size="sm"` example (or a default-vs-sm pair) — the only real variant axis, never shown.
- matrix (optional): default vs sm grid (padding/gap/title-size delta).

### separator ✨

- prose (optional): note the first preview's default horizontal rule is decorative, to make the decorative-vs-semantic contrast explicit. Essentially complete.

### scroll-area

- +preview `scrollAreaBoth`: `orientation="both"` (dual scrollbars + corner) — the most visually distinct case, never shown (Sweep B). A vertical|horizontal|both trio is the one matrix that reveals real difference.

### settings-row

- +preview: a `controlId` + native `<Input>` example (the documented a11y headline; both previews use `aria-label` on composites instead).
- +preview: a control-type variety row (Input / Button / read-only value / badge) + a label-only (no children) row.
- cleanup: the `settingsRow` preview export is orphaned (not referenced by any `<ComponentPreview>`) — surface it or remove it.

---

## 10. Data Display

### table

- +preview: a table that actually **overflows horizontally** (the `overflow-x-auto` container is the headline feature, never demonstrated overflowing).
- +preview: a selectable/`[role=checkbox]` column (exercises the `pr-0` padding rule + `data-selected`).
- prose: add `TableFooter`/`TableCaption` to the Usage import snippet (`:18-25`).

### data-list

- **P0 #10**: add `interactive?` to the Anatomy column shape (`:48`).
- +preview: the headline composed example — `toolbar` (search) + `footer` (pagination) around the table (toolbar slot is documented + tested, never shown).
- +preview: a `column.interactive` example (first column is a link).
- +API: `<TypeTable>` for `SortState`/`SortDirection` (Sweep C). +preview a custom `emptyState`.

### filter-bar

- +API: sub-tables for `FilterBarFilter` / `FilterBarAddOption` / `FilterBarSearch` (Sweep C) — consumers can't see the shapes they must construct.
- +preview: the custom `addFilterMenu` path (its whole reason to exist; tested, never shown).
- +preview: a presence-only (value-less) chip + a disabled add-option.

### avatar

- matrix: an `AvatarGroup` spacing grid (`tight`/`default`/`loose` side-by-side — overlap difference is invisible today).
- +preview: a broken-`src` avatar (error→initials fallback — the "never a broken-image icon" guarantee, never shown).
- prose/+preview: mention/demo `fallbackDelay`.

### image

- +preview: a `rounded` scale row (`none`→`full`, esp. `full` for circular) — the whole axis is undemonstrated.
- +preview: an `aspectRatio="auto"` example (the **default** value, currently invisible — both previews force square/video).
- prose: note the loading skeleton can't be statically previewed (or add a slow-loading demo).

### badge ✨

- matrix: add the `minimal × 6 colors` row to the Colors matrix (currently subtle×6 + solid×6 — 6 of 18 compound pairs never render).
- +preview: a `solid` + `dot` example (uses the special `bg-current` dot branch).
- prose (optional): note `dot` is ignored while `loading`.

---

## 11. Feedback & Status

### alert

- **P0 #3**: fix `bg-X/10` → `bg-X-subtle` (`:46`).
- +preview: an `Alert.Actions` + controlled `onDismiss` example (action-row layout never shown; only self-dismiss path shown).
- +preview: a `hideIcon` and/or custom `icon` example.
- matrix: variant × (with-icon / with-actions) so the icon gutter + action row interaction reads per tone.
- prose: note `purple` is the rationed accent, not just another status.

### toast (sonner) ✨

- +preview: `toast.loading` + dismiss.
- +preview/snippet: `closeButton`/`position` (e.g. a local `<Toaster closeButton position="top-center" />`) — the docs Toaster is mounted once in the provider, so these can't be seen otherwise.
- prose: show `toast.message`/`toast.custom` or drop them from the prose list.

### progress

- +preview: promote **Indeterminate** from code block to live `<ComponentPreview>` (animated, no valuenow — code can't show it) (Sweep B).
- +preview: a live custom-scale (`max`) example.
- +preview: an `indicatorClassName` status-colored fill (indicator is hardwired `bg-purple`; the override is prose-only).

### progress-indicator ✨

- +preview (optional): promote the custom-scale code block to live; a shape×value mini-grid. Strongest doc in the batch.

### spinner ✨

- +preview: a labelled spinner paired with visible "Saving…" text (recommended pattern, code-only).
- +preview: a colored/in-button spinner to show `currentColor` inheritance.

### skeleton ✨

- +preview: convert the "Line count" code block to a live `count` preview (Sweep B).
- matrix (optional): `shape × count` (documents the line-only last-row shorten).

### status-icon

- +preview: a status icon next to a text label with `label=""` (the documented a11y pattern, never shown).
- matrix (optional): `status × size` so the `progress` spin reads at multiple sizes.

### empty-state ⛔ (P1)

- **P0 #3**: fix `bg-X/10 text-X` → `bg-X-subtle text-X-text` (`:53`).
- +preview: cross `size` (sm/default/lg) and `surface` (card vs transparent) — at minimum show the `card` surface (filled panel, never shown) and an `lg` full-page empty.
- +preview: a `bordered={false}` (the CVA default!) and an icon-less variant.
- matrix: a `size × surface` (or `bordered × surface`) grid — the three root axes only ever appear in one combination today.

### notification-bell ✨

- prose: one-line note that IconButton props (`size`/`variant`) pass through.
- +preview (optional): `count={99}` vs `count={100}` boundary.

---

## 12. Content & Typography

### markdown-view

- +preview: add **h4/h5/h6**, an **ordered list**, **`hr`**, and **`img`** to a sample (these styled elements never render in any preview); ideally one consolidated kitchen-sink preview.
- +preview: an internal (relative) link alongside the external one (external opens new tab — the distinction is never shown).

### kbd

- +preview: a live `os="mac"` vs `os="other"` side-by-side (the Windows/Linux word-rewrite is the distinguishing feature, currently only a code comment) (Sweep B).
- +preview (optional): single-string-child OS rewriting.

### truncated-text ⛔ (P1)

- +preview `iconText` + `tableCellText`: **both subcomponents have ZERO live previews** (code-block only; the preview file doesn't even import them) — two of three exported components are never rendered.
- +preview: `TableCellText` `mono` + `width` (the IDs/paths use case); optionally `tooltipSide` variation.

### relative-time

- +preview: one **live** (non-frozen `now`) example so `refresh` actually ticks (the headline feature — every preview freezes the clock via `now={NOW}`) (Sweep G).
- +preview: a `locale="de-DE"` example to back the localization claim (Do/Don't praises it; no preview passes `locale`).
- +preview (optional): `tooltipDelay`.

---

## 13. Chat & Communication

### marker ✨

- +API: AutoTypeTables for `MarkerIconProps` + `MarkerContentProps` (only `MarkerProps` is tabled) (Sweep C).
- verify: the `/docs/utilities/shimmer` and `/docs/components/spinner` cross-links resolve (both target pages exist — confirm).

### message ✨

- +API/prose: one-liner that the 5 layout subcomponents accept standard `div` props (AutoTypeTable can't table pass-throughs) (Sweep C).
- +preview (optional): header/footer with a `ghost` bubble (padding-drop behavior).

### bubble ✨

- +API: `<AutoTypeTable name="BubbleContentProps">` — documents the `render` prop (the interactive-bubble API; shown in examples, absent from the table). Highest-value miss in the batch (Sweep C).
- +API (optional): note `BubbleGroup` accepts div props. Variant coverage is otherwise complete (all 7 variants, both aligns, reaction corners).

### message-scroller

- +API: typed tables for `MessageScrollerProvider` (`autoScroll`, `defaultScrollPosition`, `scrollPreviousItemPeek`, `scrollMargin`) + `MessageScrollerItem` (`scrollAnchor`, `messageId`) — the core config surface, prose-only today. Aliased primitive types may need hand-written `<TypeTable>` (Sweep C).
- +preview: `defaultScrollPosition="last-anchor"` + `scrollPreviousItemPeek`; optionally `visibleMessageIds` and a button `variant`/`size` override.

---

### Effort roll-up

- **P1 majors (8):** copy-button, label, checkbox, country-select, state-select, color-picker, empty-state, truncated-text — mostly **M** each.
- **P2 sweeps (7):** see `03` — A/D/E/F are largely **S**; B/C are **M** in aggregate but high-consistency payoff.
- **P3 tail:** the remaining ◑ components — almost all **S**, 1–2 previews each.
- **P4 polish (✨):** optional matrices on the ~12 reference-grade pages.

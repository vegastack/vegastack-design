# Batch 01 — Buttons & Actions: Documentation Coverage Audit

## BATCH SUMMARY

**Components audited (6):** button, icon-button, copy-button, split-button, toggle, toggle-group
All four files (canonical / test / mdx / preview) exist for every component — no missing pages.

**Coverage tally:**
- Complete / Minor gaps: button, toggle, toggle-group (minor), icon-button (minor), split-button (minor)
- **Major-gap components (1):** **copy-button** — single preview only; none of its forwarded `variant`/`size` overrides or its own props (`timeout`, `copyLabel`, `copiedLabel`, `onPress`, `disabled`) are demonstrated, and the MDX has no Variants/Sizes/States sections at all.

**Mechanics confirmed (affects how gaps are read):**
- The `preview:` frontmatter renders a HERO preview ABOVE the MDX body (`apps/docs/app/docs/[[...slug]]/page.tsx:38,52`). So each component's basic `<name>()` export is always shown at page top even when not referenced by `<ComponentPreview>` in the body. copy-button's lone `copyButton` export IS that hero.
- `AutoTypeTable` (fumadocs-typescript 5.2.6) resolves the FULL apparent type via `declaration.getType().getProperties()` (`node_modules/.../fumadocs-typescript/dist/index.js:100`), so it DOES expand props inherited through `extends Omit<ButtonProps, …>`. The API tables for icon-button / copy-button / split-button are therefore complete-by-construction (inherited Button props appear). Treated as a strength, not a gap.

**Category assignment table:**

| Component | Proposed category | One-line reason |
| --- | --- | --- |
| button | Buttons & Actions | The canonical action trigger. |
| icon-button | Buttons & Actions | Square icon-only action button (thin Button wrapper). |
| copy-button | Buttons & Actions | An action button that performs a clipboard write. |
| split-button | Buttons & Actions | Primary action joined to a dropdown of secondary actions. |
| toggle | Buttons & Actions | A two-state pressed action button (toolbar bold/italic) — action-shaped, not a form field. (Alt: Selection Controls.) |
| toggle-group | Selection Controls | A shared single/multi selection across joined buttons — radio/checkbox-like selection semantics. (Alt: Buttons & Actions.) |

> Note: toggle vs toggle-group sit on the Buttons/Selection boundary. Recommendation: keep both under **Buttons & Actions** for discoverability (they live next to Button and share `toggleVariants`), or split toggle-group into **Selection Controls**. Flagging the ambiguity rather than forcing one.

---

## button
- files: canonical ✓ | test ✓ | mdx (`button.mdx`) ✓ | preview ✓
- exports/subcomponents: `Button`, `buttonVariants` (CVA), `ButtonProps`
- proposed category: Buttons & Actions — the canonical action trigger.

### API surface (ground truth)
- CVA axes:
  - variant=[`default`, `purple`, `secondary`, `outline`, `ghost`, `link`, `destructive`, `success`, `warning`, `info`, `glass`, `destructive-outline`, `success-outline`, `warning-outline`, `info-outline`] → **15 values**
  - size=[`default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`] → **8 values**
- boolean/enum props: `loading?: boolean` (spinner + `aria-busy` + `data-loading`); `disabled?: boolean`
- key props: Base UI Button pass-through — `render`, `nativeButton`, `focusableWhenDisabled`; `type` (default `'button'`); `data-slot` override; `className` (supports Base UI state-function form); forwarded `ref`
- states supported: default, hover, active (`active:translate-y-px` + per-variant active tints on default/purple), focus-visible, disabled, loading

### Currently demonstrated
- preview exports:
  - `button` (hero) → single default Button
  - `buttonVariants` → all **15** variants, each rendered once
  - `buttonSizes` → all **8** sizes (xs/sm/default/lg + 4 icon-*)
  - `buttonStates` → with-icon, loading, disabled, purple+loading, destructive+icon
- mdx sections present: Installation, Usage, Variants, Sizes, States, API Reference, Accessibility, Do/Don't (canonical order)
- API table: present, `name="ButtonProps"`, path correct, complete (incl. inherited Base UI props)

### GAPS (actionable, one per line, tagged)
- [VARIANT] none — all 15 variants and all 8 sizes are each shown at least once.
- [MATRIX] variant×size grid not shown → optional: a small variant×size matrix (e.g. default/outline/destructive × xs/default/lg) would reveal padding/text-size interplay, but marginal signal; low priority.
- [MATRIX] active-state (`active:translate-y-px` press depression) is not separately visible in a static preview → acceptable; it's a transient interaction state.
- [API] none — table present and complete.
- [PROSE] Description "15 variants × 8 sizes" — **accurate** (15 variants, 8 sizes confirmed). No correction needed.
- [PROSE] States section prose only mentions icon/loading/disabled, but preview also shows the active/hover tints implicitly — fine.
- [STRUCTURE] none — full standard section set, correct order.
- [MISSING] none.

### Verdict
- coverage: **Complete**
- effort to fix: S (nothing required; optional matrix only)
- top 3 fixes: 1) (optional) add a compact variant×size matrix for padding signal 2) consider noting the `active:` press affordance in States prose 3) none material

---

## icon-button
- files: canonical ✓ | test ✓ | mdx (`icon-button.mdx`) ✓ | preview ✓
- exports/subcomponents: `IconButton`, `IconButtonProps`, `IconButtonSize` (type)
- proposed category: Buttons & Actions — square icon-only action button (thin Button wrapper).

### API surface (ground truth)
- size axis (remapped, NOT raw Button sizes): `IconButtonSize` = [`xs`, `sm`, `default`, `lg`] → maps to Button `icon-xs`/`icon-sm`/`icon`/`icon-lg`
- variant: inherited from Button (all **15** variant values valid)
- boolean/enum props: `loading` (inherited), `disabled` (inherited)
- key props: `aria-label: string` (REQUIRED — type-enforced); `children: ReactNode` (icon); all other Button props pass through (`variant`, `render`, `className`, `ref`); `data-slot="icon-button"`
- states supported: default, hover, active, focus-visible, disabled, loading

### Currently demonstrated
- preview exports:
  - `iconButton` (hero) → single default icon button (Plus)
  - `iconButtonVariants` → 15 variants (default, purple, secondary, outline, ghost, link, glass, success, warning, destructive, info, success-outline, warning-outline, destructive-outline, info-outline) — **all 15 shown**
  - `iconButtonSizes` → all 4 sizes (xs/sm/default/lg)
  - `iconButtonStates` → loading, purple (plain — odd inclusion), destructive+disabled
- mdx sections present: Installation, Usage, Variants, Sizes, States, API Reference, Accessibility (+keyboard table), Do/Don't
- API table: present, `name="IconButtonProps"`, path correct; resolves inherited Button props (confirmed lib behavior), so complete

### GAPS (actionable, one per line, tagged)
- [VARIANT] `loading` is shown but a plain **default (idle, non-disabled)** state and a standalone **disabled** (non-destructive) example are folded together; states preview's middle item is just `purple` with no state — replace it with a clean idle vs disabled pairing → tighten `iconButtonStates`.
- [VARIANT] none missing at the variant axis — all 15 covered.
- [MATRIX] size×variant not shown → low value for icon buttons (square), skip.
- [API] none — `IconButtonProps` correct; inherited props resolve.
- [PROSE] Variants prose: "base, semantic-filled, and semantic-outline all work" — true but doesn't name `purple`/`glass`/`link`; minor. Optionally align wording with Button's variant taxonomy.
- [PROSE] States section says `disabled` "removes the button from the tab order" — Button uses real `disabled` for the non-loading case (loading uses `focusableWhenDisabled`), so a plain `disabled` IconButton is indeed removed from tab order. **Accurate.**
- [STRUCTURE] none — full standard set, correct order.
- [MISSING] none.

### Verdict
- coverage: **Minor gaps**
- effort to fix: S
- top 3 fixes: 1) fix `iconButtonStates` — the middle `purple` item demonstrates no state; make it idle vs disabled vs loading 2) (optional) name purple/glass/link in Variants prose 3) none material

---

## copy-button
- files: canonical ✓ | test ✓ | mdx (`copy-button.mdx`) ✓ | preview ✓
- exports/subcomponents: `CopyButton`, `CopyButtonProps`
- proposed category: Buttons & Actions — an action button that performs a clipboard write.

### API surface (ground truth)
- defaults: `variant='ghost'`, `size='icon-sm'` (but BOTH are overridable — forwards all Button presentation props)
- own props:
  - `value: string` (REQUIRED — text written to clipboard)
  - `onCopied?: (value) => void`
  - `timeout?: number` (@default 1500 — check-icon duration)
  - `copyLabel?: string` (@default 'Copy')
  - `copiedLabel?: string` (@default 'Copied')
  - `onPress?: (event) => void` (runs before write; `preventDefault()` cancels)
- inherited (forwarded): `variant`, `size`, `className`, `disabled`, `ref`, etc. (Omits `aria-label`, `children`, `onClick`, `type`, `value`)
- states supported: idle (Copy icon), copied (Check icon, `text-success-text`, `data-copied`, label→`copiedLabel`), disabled, hover, focus-visible

### Currently demonstrated
- preview exports:
  - `copyButton` (hero AND the only `<ComponentPreview>` in body) → ONE instance: a `<code>` snippet + default CopyButton. The copied state is reachable only by the reader clicking (live), not shown in a static second instance.
- mdx sections present: Installation, Usage, **Examples** (single preview), API Reference, Accessibility (+keyboard table), Do/Don't
- API table: present, `name="CopyButtonProps"`, path correct; resolves inherited Button props → complete

### GAPS (actionable, one per line, tagged)
- [VARIANT] The **copied/success state** is never shown statically — it only appears if a reader clicks. Add a second instance demonstrating it (e.g. wrap a Button with `data-copied` styling, or a non-default `variant`) so the success tint + label flip are visible at rest → add a `copyButtonStates` export.
- [VARIANT] `disabled` state not demonstrated → add to a states preview.
- [VARIANT] Non-default `variant`/`size` overrides (the component forwards them) are never shown — e.g. `variant="outline"` with a visible text-ish layout, or `size="icon"` → add a `copyButtonVariants` (or variants row).
- [VARIANT] `timeout`, `copyLabel`, `copiedLabel`, `onPress`, `onCopied` — none demonstrated in a preview (onCopied appears only in a code fence). Add at least an `onCopied`→toast example as a live preview.
- [MATRIX] none meaningful (no real 2-axis grid for this component).
- [API] none — table correct and complete.
- [PROSE] No **Variants**, **Sizes**, or **States** sections at all — only a single "Examples" section. For a component that explicitly forwards `variant`/`size` and has a distinct copied state, this is thin → add States (idle/copied/disabled) and a short Variants/Sizes note.
- [PROSE] Usage/Examples prose is accurate ("ghost / icon-sm", "~1.5s", failed-write behavior all match canonical). No stale text found.
- [STRUCTURE] Missing standard sections: **Variants**, **Sizes**, **States**. Has Installation, Usage, Examples, API Reference, Accessibility, Do/Don't.
- [MISSING] Preview is **thin** — single function `copyButton`; no states/variants preview functions exist.

### Verdict
- coverage: **Major gaps**
- effort to fix: M
- top 3 fixes: 1) add a `copyButtonStates` preview that statically shows idle + copied (success tint/label) + disabled 2) add a `copyButtonVariants`/sizes row demonstrating forwarded `variant`/`size` 3) add a States section (and short Variants/Sizes note) to the MDX, plus a live `onCopied`→toast example

---

## split-button
- files: canonical ✓ | test ✓ | mdx (`split-button.mdx`) ✓ | preview ✓
- exports/subcomponents: `SplitButton`, `SplitButtonProps`, `SplitButtonAction` (type)
- proposed category: Buttons & Actions — primary action joined to a dropdown of secondary actions.

### API surface (ground truth)
- variant: inherited from Button (all **15** values valid; passes to both halves)
- size: Button scale (`xs`/`sm`/`default`/`lg` + icon-* keys are in the trigger-width map, but practically xs/sm/default/lg)
- `SplitButtonProps` (discriminated union):
  - `children: ReactNode` (primary label), `onClick` (primary handler)
  - `menuLabel?: string` (@default 'More options'), `menuAlign?` (@default 'end'), `menuContentProps?`
  - EITHER `actions: [SplitButtonAction, ...]` (non-empty) OR `menu: ReactNode` (mutually exclusive)
  - `loading`, `disabled` (inherited) — disable BOTH halves
  - `render` intentionally Omitted (multi-element composite)
- `SplitButtonAction`: `label`, `onClick?`, `icon?`, `destructive?` (@default false), `disabled?` (@default false)
- data-slots: `split-button` (wrapper, carries `data-variant`/`data-size`), `split-button-primary`, `split-button-trigger`
- states supported: default, hover/active (per variant), focus-visible (each half), loading (both disabled), disabled (both), menu open, destructive action item, disabled action item

### Currently demonstrated
- preview exports:
  - `splitButton` (hero) → default with `saveActions`
  - `splitButtonVariants` → 7 variants: default, purple, secondary, outline, destructive, success, destructive-outline
  - `splitButtonSizes` → all 4 practical sizes (xs/sm/default/lg)
  - `splitButtonStates` → declarative w/ destructive action, composed `menu` (with separator + destructive item), loading, disabled
- mdx sections present: Installation, Usage, **Anatomy** (data-slot breakdown + code), Variants, Sizes, States, API Reference (×2 AutoTypeTable), Accessibility (+keyboard table), Do/Don't
- API table: TWO tables — `SplitButtonProps` and `SplitButtonAction`, both paths/names correct. Note: `SplitButtonProps` is a discriminated union type alias (`Omit<…> & (…|…)`) — verify AutoTypeTable renders the union members' props (`actions`/`menu`) cleanly; flagged below.

### GAPS (actionable, one per line, tagged)
- [VARIANT] Variants preview shows **7 of 15** Button variants. Missing: `ghost`, `link`, `warning`, `info`, `glass`, `success-outline`, `warning-outline`, `info-outline`. `ghost`/`link`/`glass` are visually meaningful for a joined control (seam/border rendering differs) → extend `splitButtonVariants` to cover at least ghost, link, glass, and the remaining semantic + semantic-outline values.
- [VARIANT] A `disabled` **action item** (`SplitButtonAction.disabled`) is never demonstrated → add a disabled entry to one of the action arrays so the dimmed/skipped item is visible.
- [VARIANT] `menuAlign` (start/center/end) and `menuLabel` override not demonstrated → optional; add a note or one example.
- [MATRIX] none essential — variant covers the seam rendering; size is linear. Skip a full grid.
- [API] Confirm `SplitButtonProps` AutoTypeTable renders the union discriminant props (`actions`, `menu`) — a `Type & (A | B)` alias can render thinly in fumadocs-typescript. If `actions`/`menu` don't appear in the table, document them via a manual `<TypeTable>` or prose. (Likely-fine but verify in the rendered page.)
- [PROSE] Anatomy/States/Accessibility prose all match canonical (slots, seam `-ml-px`, loading disables both, `menuLabel` default). No stale text found.
- [STRUCTURE] none — richest section set in the batch (adds an Anatomy section, appropriate for a composite). Order is sensible.
- [MISSING] none.

### Verdict
- coverage: **Minor gaps**
- effort to fix: S–M
- top 3 fixes: 1) extend `splitButtonVariants` to cover the missing 8 variants (esp. ghost/link/glass) 2) demonstrate a `disabled` action item 3) verify the `SplitButtonProps` union renders `actions`/`menu` in AutoTypeTable; if not, add a manual table

---

## toggle
- files: canonical ✓ | test ✓ | mdx (`toggle.mdx`) ✓ | preview ✓
- exports/subcomponents: `Toggle`, `toggleVariants` (CVA, shared by ToggleGroup), `ToggleProps`
- proposed category: Buttons & Actions — two-state pressed action button. (Boundary with Selection Controls.)

### API surface (ground truth)
- CVA axes: **NO variant axis** (deliberately "ONE look"); size=[`sm`, `default`, `lg`] → 3 values
- key props (Base UI Toggle pass-through): `pressed` / `defaultPressed` / `onPressedChange` (controlled & uncontrolled); `disabled`; `render`; `className` (state-function form); `ref`; `aria-label` (for icon-only). `value` is Omitted (group-only concept).
- data attrs: `data-slot="toggle"`, `data-size`, `data-pressed` (Base UI), `aria-pressed`
- states supported: off (unpressed), on (pressed `bg-foreground/10`), hover, hover+pressed (`bg-foreground/15`), focus-visible, disabled, disabled+pressed

### Currently demonstrated
- preview exports:
  - `toggle` (hero) → single icon-only Bold toggle
  - `toggleVariantsExample` → sizes row (sm/default/lg with text labels) + states row (off, on/defaultPressed, disabled, disabled+defaultPressed)
- mdx sections present: Installation, Usage (incl. controlled snippet), **Examples** (single preview), API Reference, Accessibility, Do/Don't
- API table: present, `name="ToggleProps"`, path correct; inherited Base UI props resolve → complete

### GAPS (actionable, one per line, tagged)
- [VARIANT] All 3 sizes + off/on/disabled/disabled-on are shown. No `variant` axis exists (by design) — nothing missing.
- [VARIANT] Hover and hover+pressed tints (`bg-foreground/15`) are not statically visible → acceptable (transient interaction states; reachable live).
- [MATRIX] none — single look, single axis (size); a size×state grid would be marginal.
- [API] none — `ToggleProps` correct.
- [PROSE] Section is named **"Examples"** and the export is `toggleVariantsExample` even though the component explicitly has **no variant prop** — the "Variants" naming is slightly misleading. Minor: rename export/section to "Sizes & States" for clarity. The body prose correctly says "One look (no variant prop)".
- [PROSE] Usage controlled/uncontrolled snippet matches canonical (`pressed`+`onPressedChange`, `defaultPressed`). No stale text.
- [STRUCTURE] Uses a single "Examples" section instead of separate Sizes / States. Acceptable for a one-look component, but consider splitting Sizes vs States headings for consistency with the rest of the batch.
- [MISSING] none.

### Verdict
- coverage: **Minor gaps** (essentially Complete)
- effort to fix: S
- top 3 fixes: 1) rename `toggleVariantsExample` → e.g. `toggleSizesAndStates` (no variant axis exists) 2) optionally split the single Examples section into Sizes + States headings 3) none material

---

## toggle-group
- files: canonical ✓ | test ✓ | mdx (`toggle-group.mdx`) ✓ | preview ✓
- exports/subcomponents: `ToggleGroup`, `ToggleGroupItem`, `ToggleGroupProps`, `ToggleGroupItemProps`
- proposed category: Selection Controls — shared single/multi selection across joined buttons (radio/checkbox-like). (Alt: Buttons & Actions.)

### API surface (ground truth)
- size axis: [`sm`, `default`, `lg`] (set once on root, flows to items via context; per-item override allowed)
- `ToggleGroupProps`:
  - `value?: readonly string[]` / `defaultValue?: readonly string[]` (controlled/uncontrolled — selection is an ARRAY)
  - `onValueChange?: (value: string[]) => void`
  - `multiple?: boolean` (@default false — single vs multi select)
  - `orientation?: 'horizontal' | 'vertical'` (@default 'horizontal' — also drives arrow-key axis)
  - `size`, `disabled`, `className` (state-function), `ref` (HTMLDivElement)
- `ToggleGroupItemProps`: `value` (identity), `size?` (override), `disabled?`, `aria-label` (icon-only), `className` (state-function), `ref` (HTMLButtonElement)
- data attrs: group `data-slot="toggle-group"`, `data-size`, `data-orientation`, `data-multiple`; item `data-slot="toggle-group-item"`, `data-size`, `data-pressed`, `aria-pressed`
- states supported: single-select, multi-select, item pressed/unpressed, disabled group, disabled item, horizontal, vertical, three sizes, roving focus

### Currently demonstrated
- preview exports:
  - `toggleGroup` (hero + Selection section) → single-select alignment group (defaultValue center) PLUS a second group with a disabled item
  - `toggleGroupMultiple` → multi-select formatting group (defaultValue bold+underline) + sm group + lg group
- mdx sections present: Installation, Usage, **Anatomy** (slot breakdown), **Selection** (single + multiple previews), **Sizes** (code-only), **Orientation** (code-only), API Reference (×2), Accessibility (+keyboard table), Do/Don't
- API table: TWO tables — `ToggleGroupProps` and `ToggleGroupItemProps`, both correct paths/names. Complete.

### GAPS (actionable, one per line, tagged)
- [VARIANT] **`orientation="vertical"` has NO live preview** — only a code fence (mdx lines ~94-99). Add a `toggleGroupVertical` preview export so the stacked/rounded-corner geometry is actually rendered → new export referenced from the Orientation section.
- [VARIANT] **Sizes section has NO live preview either** — it's a code fence in the MDX. The sm/lg groups ARE rendered inside `toggleGroupMultiple`, but the Sizes section itself shows no `<ComponentPreview>`. Either add a dedicated `toggleGroupSizes` preview or point the Sizes section at the existing render → wire a preview into the Sizes section.
- [VARIANT] `default` size group is shown (multiple); single-select default-size shown. All 3 sizes covered (sm/default/lg) but only within the multiple example — fine functionally, but the Sizes section doesn't surface it (see above).
- [VARIANT] Disabled **whole group** (vs disabled item) not demonstrated — only a disabled item is shown → optionally add a disabled-group example.
- [MATRIX] orientation×size could reveal corner-rounding differences (vertical first/last round top/bottom) → low priority, but a single vertical example is the real gap (above).
- [API] none — both tables correct and complete.
- [PROSE] Preview code comment (`toggle-group.tsx:11` and `:42`) says pressed item "fills solid primary" — but canonical `toggleVariants` uses `data-pressed:bg-foreground/10` (an **evident neutral grey**, explicitly "NOT a brand colour"). The comment is **stale/contradicts the component** and the MDX body (which correctly says "evident neutral fill"). Stale quote: `"the selected item fills solid primary"` and `"each selected item fills solid primary"` → correct to "fills an evident neutral grey (bg-foreground/10)". (Comment-only, not user-facing, but misleading to maintainers.)
- [PROSE] MDX body prose is accurate (single vs multiple, array selection, context size, vertical rounding). No user-facing stale text.
- [STRUCTURE] Sizes and Orientation sections exist but are **code-fence only** (no live `<ComponentPreview>`), unlike Selection which has live previews. Inconsistent → add live previews to both.
- [MISSING] Missing preview functions for: vertical orientation; a dedicated sizes demo surfaced under the Sizes heading.

### Verdict
- coverage: **Minor gaps**
- effort to fix: S–M
- top 3 fixes: 1) add a `toggleGroupVertical` live preview and wire it into the Orientation section 2) add a live preview to the Sizes section (or a `toggleGroupSizes` export) 3) fix the stale "fills solid primary" code comments to match the neutral `bg-foreground/10` reality

---

## Cross-batch notes
- **Stale comment pattern:** the only factual contradiction found is in `apps/docs/components/preview/toggle-group.tsx` ("fills solid primary") vs the actual neutral pressed fill. Worth a quick grep across other previews for the same copy-pasted phrase.
- **"Code fence instead of live preview" pattern:** toggle-group's Sizes & Orientation sections, and copy-button's lack of states, are the recurring shape of the gaps — the components are fully built and tested; the docs just under-demonstrate a few real states/axes.
- **AutoTypeTable is reliable** for wrapper components (resolves inherited Button props), so API-table completeness is not a concern in this batch except verifying the `SplitButtonProps` discriminated-union renders `actions`/`menu`.

# 02 — Batch 3: overlays and menus

**Items:** tooltip · popover · hover-card · dialog · alert-dialog · sheet · dropdown-menu ·
context-menu · command · combobox · select · sonner (Toaster)
**Evidence:** source read; static captures (closed state) in five lanes; an interaction probe
(`probe-overlays.mjs`) that opens each overlay in light and dark and records computed padding,
radius, shadow, font, and screenshots (`captures/_overlays/`); a with/without-shadow pixel diff
proving `shadow-overlay` paints; CSSOM inspection for third-party focus styles.

Overall: behaviourally solid (Base UI does the heavy lifting; ARIA anatomy for Command/Combobox is
correct and documented). The problems are **structural duplication** (seven near-identical
Portal+Positioner+Popup wrappers, a whole component that is a rename of another), a **doctrine
drift on motion timing**, and a handful of consistency and UX decisions.

## Findings

### B3-01 · HIGH · bloat · Seven copies of the floating-surface plumbing

- **Where:** `tooltip.tsx`, `popover.tsx`, `hover-card.tsx`, `dropdown-menu.tsx`,
  `context-menu.tsx`, `select.tsx`, `combobox.tsx` each define an identical
  `mergeStateClassName` helper (7×) and the same ~40-line `Portal → Positioner → Popup (→ Viewport)`
  composition with `themeScope`, `z-(--z-overlay)`, `origin-(--transform-origin)`, the
  `data-[starting-style]/[ending-style]` scale+fade pair, and the same `positionerProps`/
  `portalProps`/`viewportProps` prop-splitting.
- **Fix:** one internal `floating.tsx` registry item (not public API) exporting
  `mergeStateClassName`, `FLOATING_SURFACE` class recipes (`popup`, `menu`, `tooltip`), and a
  `composeFloatingContent(parts)` helper each component calls with its Base UI namespace. Estimated
  removal: ~250 lines. `@vegastack/design` gains `mergeStateClassName` next to `cn`.

### B3-02 · HIGH · bloat · `context-menu` is `dropdown-menu` with a different root

- **Where:** 565 vs 531 lines; after normalising the names, 200 diff lines, almost all of them the
  trigger (`right-click`/long-press) and comments. Item, checkbox/radio item, label, separator,
  shortcut, sub-trigger and sub-content are byte-identical recipes.
- **Fix:** share the item/label/separator/shortcut/sub-content parts from one `menu-parts.tsx`
  (internal) consumed by both; `context-menu.tsx` keeps only Root/Trigger/Content. Same for the
  `command`/`combobox`/`select` item recipes (B3-06).

### B3-03 · HIGH · doctrine · Every overlay animates at 150ms; the doctrine says 200/300

- **Where:** 15 uses of `duration-fast` across the batch (`dialog.tsx:35`, `sheet.tsx:36`,
  `popover.tsx:194`, `dropdown-menu.tsx:118`, …). `design.md` §Motion: "150ms state changes,
  **200ms popovers/tooltips, 300ms overlays/modals**". Nothing in the batch uses `duration-base`
  or `duration-slow`.
- **Assessment:** 150ms for menus/tooltips is right for a dense product (Linear ≈ 100–150ms).
  150ms for a dialog + backdrop is abrupt; 300ms is slow for 2026. The doctrine is stale and the
  code is inconsistent with it.
- **Fix:** menus/tooltips/hover-card `fast` (150); popover/select/combobox `fast`; dialog/alert-
  dialog/sheet `base` (200) for both backdrop and panel; amend `design.md` to "150 state/menus ·
  200 modals · 300 reserved for large sheets". **Doubt D11** (MK sees every motion decision).

### B3-04 · MEDIUM · UX · `Popover` and `Select` are modal by default

- **Where:** `popover.tsx:56` (`modal = true`), `select.tsx:78` (`modal = true`); Base UI's own
  default is `false`; Combobox deliberately stays non-modal (`combobox.tsx:96-103`, with a measured
  reason). A modal popover locks page scroll and makes the page inert behind a clipped backdrop —
  every "quick settings" popover behaves like a dialog.
- **Facts:** Geist, Radix Themes and Linear popovers are non-modal; only pickers that _replace_ the
  page's focus (date picker inside a form) want modality, and those can opt in.
- **Fix:** `modal={false}` default for Popover; Select keeps `modal` (a native select is modal-like)
  but the doctrine should say so. Pickers (date/color/emoji/country) opt in explicitly. **Doubt D12.**

### B3-05 · MEDIUM · consistency · Dialog and Sheet hand-roll their close button

- **Where:** `dialog.tsx:190-203`, `sheet.tsx:196-210` re-implement an icon ghost button
  (`size-(--size-md) rounded-md hover:bg-muted …`). `IconButton variant="ghost"` exists for exactly
  this. Sheet's header pads `pe-12` for it while Dialog's pads `pe-10` for the same 32px button at
  the same inset.
- **Fix:** `<BaseDialog.Close render={<IconButton variant="ghost" size="sm" aria-label={closeLabel} />}>`
  in both; one `pe-*` value; one `top-3 end-3` inset. Also applies to `ComboboxClear`/
  `ComboboxChipRemove`/`NumberField` steppers (all hand-rolled icon buttons) — Phase 3 rule.

### B3-06 · MEDIUM · bloat · Four item recipes for one list-item look

- `dropdownMenuItemVariants` (`dropdown-menu.tsx:235`), `choiceItemClassName` (`:294`),
  `SelectItem` (`select.tsx:324`), `ComboboxItem` (`combobox.tsx:516`), `CommandItem`
  (`command.tsx:501`) all express: `flex items-center gap-2 rounded-sm px-2 py-1.5 text-base
outline-none select-none data-[highlighted]:bg-accent … data-[disabled]:opacity-dim [&_svg]…`.
  Select/Combobox add `pe-8 ps-2` for the trailing check; menus add `ps-8` for the leading indicator.
- **Fix:** one `listItemVariants` (`indicator: "leading" | "trailing" | "none"`, `tone:
"default" | "destructive"`) in the shared menu-parts module. Also makes P1's hover/pressed
  ladder a one-line change.

### B3-07 · MEDIUM · a11y/doctrine · Sonner's own focus styles are a box-shadow glow

- **Where:** CSSOM shows `[data-sonner-toast]:focus-visible { box-shadow: … 0 0 0 2px }` and the
  same on its action/close buttons. `design.md`: "Focus = … never a box-shadow ring/glow". The
  toast's close button is also restyled with five `group-[.toast]:` utilities (`sonner.tsx:191`)
  to fight Sonner's internal greys.
- **Fix now:** override Sonner's focus styles in `sonner.tsx` (`[&_[data-sonner-toast]]:focus-visible:outline-2 …:shadow-none`).
  **Bigger decision (D13):** Base UI ships a `Toast` primitive (deps report). Replacing sonner
  removes a renderer engine, its z-index exemption, its CSS override layer, and the focus deviation.
  Cost: re-implementing swipe-to-dismiss and stacking with Base UI's parts (~300 lines). Recommend
  scheduling it as its own issue after the token work.

### B3-08 · MEDIUM · API · `AlertDialogContent intent` does nothing

- **Where:** `alert-dialog.tsx:101-108,123`: the prop only writes `data-intent`; the confirm
  button's tint is set separately on `AlertDialogAction intent`. Two props for one concept, one
  inert. `ACTION_INTENT_VARIANT` (`:282-290`) maps to the `-outline` variants deleted in P2.
- **Fix:** drop `intent` from Content; `AlertDialogAction` takes `tone` and renders
  `<Button variant="soft" tone={tone}>` (P2). `success`/`warning` confirmations become
  `tone="success" | "warning"` — still expressible.

### B3-09 · MEDIUM · consistency · Width and padding literals differ per surface

- Popover `w-72 p-4` (`popover.tsx:192`), HoverCard `w-64 p-4`, Dialog `p-5`, Sheet header/footer
  `p-5` with `pe-12`, Tooltip `px-2.5 py-1 text-sm`, menus `p-1` + items `px-2 py-1.5`. Measured:
  dialog 20px, popover 16px, toast 16px, tooltip 10/4.
- **Facts:** Vercel brand CSS: one `--vbg-space-*` scale, panels at 16/24; Geist popover 16, modal 24. Radix Themes: popover `size 2` = 16, dialog 24.
- **Fix:** `popover`/`hover-card`/`toast` = 16 (`p-4`); `dialog`/`alert-dialog`/`sheet` = 24 (`p-6`)
  as the modal-family rhythm (or keep 20 and say so — **Doubt D14**); no fixed `w-*` on Popover/
  HoverCard content (use `min-w-(--anchor-width)` + `max-w-xs`, let content size it, consumers pass
  width). Delete `DialogTitleBar` (no consumer; a window-chrome pattern the docs invent) and
  `TooltipKbd` (renders `Kbd size="xs"` instead; B2-07).

### B3-10 · LOW · a11y · `TooltipContent` sets `role="tooltip"` on the popup

- Base UI already sets it; the explicit prop is harmless but signals distrust. Remove.

### B3-11 · LOW · UX · Sheet has no size prop and no swipe

- `sheet.tsx:59,67` `w-3/4 max-w-sm` is the only width; docs tell consumers to override via
  `className`. Add `size: sm | md | lg | full` on the shared control vocabulary. Base UI `Drawer`
  (swipe, snap points, virtual keyboard) now exists — decide in the deps batch whether Sheet's
  `bottom` side becomes a Drawer. **Doubt D15.**

### B3-12 · LOW · consistency · `Command` restates dialog sizing via descendant selectors

- `command.tsx:213-216` retunes input height and item padding when inside `CommandDialog` with
  `[&_[data-slot=…]]` overrides. A `size` prop on `Command` (`md | lg`) is the honest API.

### B3-13 · LOW · docs · Section order and coverage

- `dropdown-menu.mdx`/`context-menu.mdx` insert "Items / Inset alignment / Checkbox & radio items /
  Submenus" between Examples and API Reference (fine, they are examples). `sheet.mdx` has only two
  previews; no `top`/`bottom` fixture is captured by the contract suite (the probe showed the
  top sheet's footer actions overlapping nothing, but the bottom sheet is never rendered).
  `toast.mdx` previews fire toasts on click; the contract suite therefore never sees a toast at
  320px. Add a static `Toaster` fixture with a pre-fired toast for the contract lane.

### Verified fine

`shadow-overlay` paints in both themes (pixel diff with/without); light it is deliberately faint
(0.1 α, 14px) and dark strengthened — consistent with the flat doctrine. Popups keep the native
outline for keyboard focus; Command/Combobox anatomy keeps `Empty`/`Status` outside the listbox
(axe clean); `aria-expanded` hardcoded on the inline combobox is correct; menu `data-[side]`
translate-in is subtle and functional; RTL chevrons rotate; dialog viewport uses `100dvh` and
`overscroll-contain`; toasts respect safe-area insets; Combobox stays non-modal for a measured
reason and documents it.

## Motion register — Batch 3

| id   | where                        | motion                                            | verdict                   |
| ---- | ---------------------------- | ------------------------------------------------- | ------------------------- |
| M-12 | menus, select, combobox      | scale .95 + fade + 4px slide-in, 150ms standard   | keep                      |
| M-13 | tooltip, popover, hover-card | scale .95 + fade, 150ms                           | keep                      |
| M-14 | dialog, alert-dialog         | scale .95 + fade + backdrop fade, **150 → 200ms** | **MK to approve** (B3-03) |
| M-15 | sheet                        | slide from edge + backdrop fade, **150 → 200ms**  | **MK to approve**         |
| M-16 | select chevron               | rotate 180°, 150ms                                | keep                      |
| M-17 | combobox clear               | fade, 150ms                                       | keep                      |
| M-18 | sonner                       | library-owned slide/stack                         | keep until D13            |

## Doubts for MK (Batch 3)

| id  | question         | decision / status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D11 | Overlay timing   | **Decided from reference facts (MK: "do what Vercel and Linear do").** Measured 2026-09-07 from public CSS: Vercel brand CSS transitions at **150ms**; Geist's menu/popover `animate-in`/`animate-out` default **150ms** with `duration-200` on some open/close states, tooltips fade ≈150ms, and Geist's `<dialog>` show/hide runs **400ms** on a custom curve; Linear's transitions are **120–250ms**. Resolution: menus, tooltips, popovers, select, combobox → `duration-fast` (150); dialog, alert-dialog, sheet + their backdrops → `duration-base` (200); `duration-slow` (300) reserved for large sheets and page-level transitions. `design.md` §Motion rewritten to "150 state & floating · 200 modal · 300 reserved". Doctrine and code both change. |
| D12 | Popover modality | **Keep modal by default (MK).** The scroll lock is intended: a non-modal anchored picker moves with page scroll, which MK does not want. B3-04 is withdrawn as a defect and becomes a documented decision in `design.md` and the Popover docs ("modal by default: the page holds still under an open panel; pass `modal={false}` for lightweight panels"). Combobox stays non-modal for its measured reason.                                                                                                                                                                                                                                                                                                                                                    |
| D13 | Toasts           | **Migrate to Base UI Toast in this pass (MK).** Keep our surface/token styling, and support the full Base UI Toast feature set (https://base-ui.com/react/components/toast): provider + viewport, `toastManager` imperative API, `promise` toasts, `type` variants (success/error/warning/info + custom), actions, close, timeouts/pause on hover and focus, swipe-to-dismiss, stacking/expand, positioning, limits, `data-*` state hooks. Sonner and its sanctioned-engine entry are removed; the z-index exemption goes with it. Depends on the Base UI 1.8 bump (deps batch 4).                                                                                                                                                                              |
| D14 | Modal padding    | **24px for dialog/alert-dialog/sheet (`p-6`), 16px for popover/hover-card/toast (`p-4`).**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| D15 | Sheet            | **Add `size` (sm · md · lg · full) AND migrate to Base UI Drawer in this pass** (swipe, snap points, virtual-keyboard handling), keeping our surface styling. Depends on the Base UI 1.8 bump.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

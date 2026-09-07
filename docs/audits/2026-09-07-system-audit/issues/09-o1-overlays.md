---
title: "O1 · Overlays: one floating-surface module, timing doctrine, Sheet on Base UI Drawer, panel-search recipe"
labels: [audit-2026-09, components, overlays, motion]
---

## Context

Audit 2026-09-07, `02-batch-03-overlays.md` (B3-01…B3-04, B3-06, B3-08…B3-13), `02-batch-08`
B8-04, `02-batch-09` B9-11, `probe-overlays.mjs` results. Depends on F1 (tokens incl.
`--panel-width-*`, `--layout-overlay-max-height`), F2 (`IconButton` close), D1 (Base UI 1.8 Drawer
verified). Decisions: D11 (timings measured from Vercel/Linear — the values are in
`02-batch-03` D11 row), D12 (Popover/Select stay modal; the scroll lock is intended), D14 (24px
dialog/alert-dialog/sheet, 16px popover/hover-card/toast), D15 (Sheet gets `size` **and** moves to
Base UI Drawer).

## Problem (see the batch file for `file:line`)

- B3-01: seven copies of the floating-surface plumbing (positioner, popup, arrow, side/align,
  `FLOATING` offsets) across popover, dropdown-menu, context-menu, select, combobox, hover-card,
  tooltip, navigation-menu. B3-02: `context-menu` is `dropdown-menu` with a different root.
- B3-03: every overlay animates at 150ms while the doctrine said 200/300 — resolved by D11
  (doctrine and code both change to the measured values). B3-06: four list-item recipes for one
  look (menu item, select item, combobox item, command item).
- B3-08: `AlertDialogContent intent` does nothing. B3-09: width/padding literals differ per
  surface. B3-10: `TooltipContent` sets `role="tooltip"` on the popup (Base UI already handles
  it). B3-11: Sheet has no size and no swipe. B3-12: `Command` restates dialog sizing via
  descendant selectors. B8-04/B9-11: three "search inside a panel" recipes (Command, Combobox
  panel, EmojiPicker's boxed Input, ShortcutOverlay's boxed Input).
- SP-02: Command's last item hover pill sits 2px from the panel border.

## Do

1. `floating-surface.tsx` (internal module in `@vegastack/design` or a registry `lib` item):
   `FloatingPositioner`/`FloatingPopup` wrappers over Base UI's parts with the shared classes,
   `FLOATING` constants, the enter/exit motion classes (D11 values), the arrow; all eight overlays
   compose it. `context-menu` re-exports dropdown-menu's item parts with `ContextMenu.Root`.
2. One `menuItemVariants` recipe for menu/select/combobox/command items (with `surface-2` hover,
   `surface-3` active/selected, 4px inset floor: list `p-1`, item `rounded-md`).
3. Padding/width: `p-6` dialog/alert-dialog/sheet, `p-4` popover/hover-card/toast; widths from
   `--panel-width-*`; `--layout-overlay-max-height` replaces the 7 `100dvh` calcs; `DialogContent
size: sm | md | lg | full`; Command sizes through the same prop (no descendant selectors).
4. `AlertDialogContent intent` either drives the confirm button tone (F2) or is deleted; Tooltip
   drops the explicit role; `Popover`/`Select` document the intended scroll lock (D12).
5. Sheet → Base UI `Drawer` (swipe, snap points, virtual-keyboard handling) with `size: sm | md |
lg | full` and our surface/tokens; the mobile Sidebar sheet follows.
6. `panelSearch` recipe (leading `Search` icon, no box, hairline below, `h-(--size-md)`) used by
   Command, Combobox panels, EmojiPicker, ShortcutOverlay.
7. Docs per B3-13; doctrine `design.md` §Overlays (timings, modality, padding tiers, sizes).

## Acceptance

- `grep -l "Positioner" packages/ui/registry/ui/*.tsx` → only `floating-surface` (plus thin
  wrappers that import it); context-menu under 150 lines.
- `probe-overlays.mjs` rerun: every overlay's computed transition duration/easing equals the D11
  values; `probe-states.mjs --routes command,dropdown-menu,select,combobox` → 0
  `hover-touches-border`.
- Sheet fixtures: swipe-to-close in the touch smoke; `size` matrix captured in five lanes.
- `pnpm gates:component` for every overlay; cross-engine smoke; axe clean.

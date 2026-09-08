---
"@vegastack/ui": minor
---

Overlays become one module. `floating-surface` is a new registry item carrying the shared
`Portal → Positioner → Popup (→ Viewport)` composer, the four painted popup surfaces
(`panel · menu · tooltip · navigation`), the arrow, the theme-scope hand-off across the portal
boundary, the `menuItemVariants` list-item recipe and the `PanelSearchFrame` in-panel search row.
Popover, HoverCard, Tooltip, DropdownMenu, ContextMenu, Select, Combobox and NavigationMenu all
compose it instead of restating the plumbing, and Command, Combobox, EmojiPicker and
ShortcutOverlay share the one search row instead of nesting a bordered `Input` inside a bordered
popup. `ContextMenu` is now bound to the same item parts as `DropdownMenu` through
`createMenuParts` — Base UI's `ContextMenu` namespace re-exports `Menu`'s parts verbatim — so the
two menus can no longer drift.

Motion follows the measured D11 timings: every floating surface enters and leaves at
`duration-fast` (150ms), NavigationMenu at `duration-base` (200ms) because it resizes between
items rather than appearing, and the modal family (dialog, alert-dialog, sheet) at `duration-base`.
Padding has two tiers instead of per-surface literals: 24px (`p-6`) for dialog/alert-dialog/sheet,
16px (`p-4`) for popover/hover-card, list density for menus. Panel widths come from
`--panel-width-*` and a viewport-capped popup uses Base UI's `--available-height` instead of a
hand-written `100dvh` calc. `DialogContent` and Command size through `size`.

**Breaking.** `Sheet` runs on Base UI's `Drawer`, so it gains swipe-to-dismiss, snap points and a
virtual-keyboard provider; `side` moves from `SheetContent` to the `Sheet` root because it selects
the dismiss gesture as well as the pinned edge, and `size` (`sm · md · lg · full`) replaces
`className` width overrides. Menu items take `tone="destructive"` instead of
`variant="destructive"` (and expose it as `data-tone`, not `data-variant`).
`AlertDialogContent` loses its inert `intent` prop — `AlertDialogAction intent` is the single
owner of a confirmation's tone. `ShortcutOverlay`'s filter is now a real `searchbox` rather than a
generic textbox, because every panel-search field renders `type="search"`; a query selecting it by
role must change with it.

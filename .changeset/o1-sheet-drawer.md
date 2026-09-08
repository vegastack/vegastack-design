---
"@vegastack/ui": minor
---

⚠️ **`Sheet` runs on Base UI's `Drawer`.** It gains swipe-to-dismiss, snap points
(`snapPoints` / `snapPoint` / `onSnapPointChange` pass straight through) and
`SheetVirtualKeyboardProvider` for bottom sheets containing fields. `side` moves from `SheetContent`
to the `Sheet` root, because it selects the dismiss gesture as well as the pinned edge, and a `side`
on the content could disagree with the gesture. `SheetContent` now sizes through `size` — `sm · md ·
lg · full` from the shared `--panel-width-*` vocabulary replaces `className` width overrides, and one
tier means a width on a `left`/`right` sheet and a height on a `top`/`bottom` one. Swipe is always an
addition: `Esc`, the close button and a backdrop press still close the panel.
[docs](https://design.vegastack.com/docs/components/sheet)

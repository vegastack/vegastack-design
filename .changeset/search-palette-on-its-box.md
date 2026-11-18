---
"@vegastack/ui": minor
---

`CommandSearch` with `placement="bar"` opens on the global bar's search box itself: it measures the box (or the `anchor` you pass), so its field lands exactly on the box (same left edge, width and vertical centre) at every window size, and a box too narrow for results gets a wider palette centred on it. The field takes the box's pill shape, concentric with the palette's 20px corners, and the palette grows out of the box's shape and closes back into it (`duration-state` / `ease-enter`, `duration-state-exit` / `ease-exit`; reduced motion drops it). Before, it was centred on the window, so it opened 40–80px left of the box. `CommandInput` takes `shape="pill"` and `CommandDialog` passes a `style` to its surface.

`CommandSearchInput`'s loading line is quiet: a 1px line in `muted-foreground` at 80% instead of a 2px `primary` one (3.6:1 on the field in light, 4.5:1 in dark), and it runs under the text only — inside the pill's corners and short of a trailing control such as the Ask chip.

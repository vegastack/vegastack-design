---
"@vegastack/ui": patch
---

🐛 **Dialog**, **Alert Dialog**, **Sheet**, **Drawer**, **Popover**: a long name stays inside the overlay. `DialogContent` and `AlertDialogContent` lay out on one `minmax(0, 1fr)` column (`grid-cols-1`), so a no-wrap child such as a select showing a long value no longer widens the popup past its cap and pushes the field and footer out (LAY-17). All five surfaces set `wrap-break-word`, so a long unbroken word breaks inside them. While a dialog or sheet shows its corner close ×, its header keeps clear of it, so a long title wraps before the × instead of running under it. `DialogTitle` is `leading-snug` instead of `leading-none`, so a wrapped title's lines no longer collide (TYP-19).
[docs](https://design.vegastack.com/docs/components/dialog#long-names)

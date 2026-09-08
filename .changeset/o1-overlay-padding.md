---
"@vegastack/ui": minor
---

🔧 **Overlay padding has two tiers, not per-surface literals.** 24px (`p-6`) for Dialog,
AlertDialog and Sheet; 16px (`p-4`) for Popover and HoverCard; menus keep list density. Panel widths
come from `--panel-width-*`, and a viewport-capped popup uses Base UI's `--available-height` instead
of a hand-written `100dvh` calc. `DialogContent` and Command size through `size`.
[docs](https://design.vegastack.com/docs/components/dialog)

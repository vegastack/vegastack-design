---
"@vegastack/ui": patch
"@vegastack/design-tokens": patch
"@vegastack/design": patch
---

🐛 A popup over a dialog reads as a raised surface in dark (BRD-1, Regent F32). New tokens `popover-raised` (the popup's fill: 0.225 L in dark over the modal's 0.205, white in light) and `popover-border` (its edge: 0.52 L in dark, 3.25:1 on a dialog and 3.59:1 on the page; the `border` hairline in light), and a new `surface-popup` utility that sets `--popover` to `popover-raised` on the popup itself, so the popup and everything inside it that paints the popover surface follow wherever it renders. Every anchored popup and floating bar wears `border-popover-border surface-popup`: `popover`, `select`, `combobox`, the three menus, `hover-card`, `tooltip`, `navigation-menu`, `toast`, and the editor, find, dock, upload, audio, PDF, zoom and drag-preview bars. `contrast-check` gates the dark edge at 3:1 on every surface a popup opens over and the lift's order. Light is unchanged.

---
"@vegastack/ui": patch
"@vegastack/design-tokens": patch
"@vegastack/design": patch
---

🐛 A popup over a dialog reads as a raised surface in dark (COL-3, Regent F32). New token `popover-border`: the edge of every anchored popup and floating bar (`popover`, `select`, `combobox`, the three menus, `hover-card`, `tooltip`, `navigation-menu`, `toast`, and the editor, find, upload, audio, PDF and drag-preview bars), 0.52 L in dark (3.25:1 on `card`, 3.59:1 on the page) and the `border` hairline in light. Dark `popover` lifts from 0.205 to 0.225; `base.css` re-scopes `--popover` to `card` inside Dialog, AlertDialog, Sheet, Drawer and the floating assistant card, so those keep their fill. `contrast-check` gates the dark edge at 3:1 and the lift's order. Light is unchanged.

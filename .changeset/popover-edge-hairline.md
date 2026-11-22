---
"@vegastack/design-tokens": patch
"@vegastack/design": patch
"@vegastack/ui": patch
---

🐛 A popup's edge is the standard hairline again in dark (BRD-1, Regent operator 22-11-2026: "border of popovers is darker color, not standard border color"). `popover-border` in dark is now `border` (white at 10%) instead of 0.52 L, so menus, popovers, selects, tooltips and the floating bars no longer draw a heavier line than every other surface. The raised fill (`popover-raised`, through `surface-popup`) still lifts a popup over a dialog; `contrast-check` now holds `popover-border` equal to `border` in both themes in place of the 3:1 edge gate. Light is unchanged.

---
"@vegastack/ui": minor
---

🔧 **settings-01** is now the reference settings page, and **ToggleGroup** moves with the up and down arrows when vertical.

- **settings-01**: an `AppShellPage size="narrow"` with a `PageHeader`, full-width controls, an `ActionBar` save bar that appears only once something changed (Discard restores the defaults), and "Delete workspace" confirmed in an `AlertDialog`. [docs](https://design.vegastack.com/docs/blocks/settings-01)
- **ToggleGroup**: `orientation="vertical"` now reaches the primitive, so the arrow keys follow the column. [docs](https://design.vegastack.com/docs/components/toggle-group)
- **AppShell**: the docs show a static or cached shell kept collapsed on first paint with `SidebarStateScript` and `useSidebarCookieOpen`, and the preview's counts use `badgeLabel`. [docs](https://design.vegastack.com/docs/components/app-shell)

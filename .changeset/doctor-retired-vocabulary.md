---
"@vegastack/design": patch
---

🛠 `vegastack-design doctor` now fails on retired design-system vocabulary in your own source, with `file:line` and the replacement for each.

A utility the shadcn reset retired compiles to nothing — no build error, no type error — so a
`text-h2` heading silently renders as body text. The new check scans the project's code and
stylesheets (skipping `node_modules`, `.next`, `dist` and the `components.json` `ui` directory) for
`text-h1`…`text-h4`, `text-label`, `text-label-sm`, `text-mono-label`, `text-code`, `text-strong`,
`text-display-*`, the status `*-subtle` steps, `--alpha-*`, `--opacity-*`, `--z-*`,
`shadow-overlay`, `backdrop-blur-glass`, and imports of the retired `icon-button`, `segmented`,
`password-input`, `progress-indicator`, `field-inline`, `floating-surface`, `section-header` and
`sonner` components. A custom property your project declares itself (`--z-header: 30`) and the
kept `--tag-*-subtle` tints are not reported. Every replacement is in
[Migrating to the shadcn reset](/docs/guides/migrating-shadcn-reset).

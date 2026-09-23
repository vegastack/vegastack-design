---
"@vegastack/design": patch
---

🛠 `vegastack-design doctor` now fails on retired design-system vocabulary in your own source, with `file:line` and the replacement for each.

A utility the shadcn reset retired compiles to nothing — no build error, no type error — so a
`text-h2` heading silently renders as body text. The new check scans the project's code and
stylesheets (skipping `node_modules`, `.next`, `dist` and the `components.json` `ui` directory) for
`text-h1`…`text-h4`, `text-label`, `text-label-sm`, `text-mono-label`, `text-code`, `text-strong`,
`text-display-*`, the `-subtle` steps of the four status families (`destructive`, `success`,
`warning`, `info`), every `--alpha-*` name the system ever shipped (the reset's nineteen plus five retired before it, such as `--alpha-fill-hover`), the retired `--opacity-*` and `--z-raised`/`--z-overlay`/`--z-toast`
names, `shadow-overlay`, `backdrop-blur-glass`, and imports of the retired `icon-button`,
`segmented`, `password-input`, `progress-indicator`, `field-inline`, `floating-surface`,
`section-header` and `sonner` components. Only real usage is reported: an import counts only when
it resolves into your `components.json` `ui` directory (or `@/components/ui/…`), so your own
`@/components/layout/section-header` is left alone; `//` and `/* */` comments and prose strings are
skipped, while JSX text — an apostrophe, a URL, a glob — never hides the real usage after it on
the same line, and neither does Tailwind's `!` modifier (`hidden!`); a class you define yourself (`@utility text-h2 { … }` or a `.text-strong` rule) or a custom
property you declare (`--z-header: 30`) is yours; another library's `--z-index` or `--alpha-channel`
is not ours to call retired; and the kept `--tag-*-subtle` tints are not reported. Every replacement
is in [Migrating to the shadcn reset](/docs/guides/migrating-shadcn-reset).

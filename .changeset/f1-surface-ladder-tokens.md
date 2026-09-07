---
"@vegastack/design-tokens": minor
---

Surface ladder. Adds `surface-1` / `surface-2` / `surface-3` — the rest-fill/well, hover and
pressed/selected rungs — with the theme-invariant alpha twins `--alpha-hover` (7%) and
`--alpha-pressed` (10%). `border` and `input` become a derived `foreground` alpha
(`--alpha-border`, 8% light / 14% dark) so one hairline reads on any surface, light `card`
collapses to the page colour, `popover` becomes `card`, and `secondary` / `muted` / `accent` /
`sidebar-*` become aliases of ladder rungs with no independent values. Removes `track`. Adds
theme-invariant `--media-scrim`, `--media-scrim-strong` and `--media-foreground`, `--chart-single`,
and the layout scale `--layout-header-height`, `--sidebar-width-mobile`,
`--layout-overlay-max-height`, `--panel-width-sm|md|lg`. Text-entry controls gain a real outline
under `forced-colors: active`.

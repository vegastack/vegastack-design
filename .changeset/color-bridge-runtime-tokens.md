---
"@vegastack/ui": patch
---

🐛 Components read the runtime colour tokens inside arbitrary values (`var(--foreground)`, not `var(--color-foreground)`), so they paint the right ink in dark mode and inside scoped themes. The `--color-*` names come from the `@theme inline` bridge, which resolves once on `:root`; the old reads painted the light value inside a `.dark` subtree or a themed portal. Fixed in DataList's and DataTable's keyboard and peek start bar, DataGrid's range fill and header hairlines, Heatmap's ramp, ContextRing, ChatComposer's and UploadPanel's progress rings, InlineChip's inks, PersonAvatar's and AgentPanel's halos, Sidebar's scroll shadow, Drawer's swipe bleed (OVL-13) and ColorPicker's default palette. `design-lint` gains `no-color-bridge`, which rejects a bridge read in registry source.

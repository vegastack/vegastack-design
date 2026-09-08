---
"@vegastack/ui": minor
---

🔧 **Popover**, **HoverCard**, **Tooltip**, **DropdownMenu**, **ContextMenu**, **Select**,
**Combobox**, **NavigationMenu** — eight lookalike overlays became one module. Each now composes
`floating-surface` instead of restating its own portal, positioner, popup surface, arrow and
theme-scope plumbing. `ContextMenu` is bound to the same item parts as `DropdownMenu` through
`createMenuParts` (Base UI's `ContextMenu` namespace re-exports `Menu`'s parts verbatim), so the two
menus can no longer drift.
[docs](https://design.vegastack.com/docs/components/floating-surface)

---
"@vegastack/ui": minor
---

🐛 Sixteen upstream-backed components gain the facelift fixes: counts and current page read correctly in the sidebar, two-line rows link their description, overlays get sizes and scrolling bodies, and built-in copy is sentence case.

- **Sidebar**: `SidebarMenuButton` takes `badge`/`badgeLabel`, so the count is part of the item's name and the visual badge is `aria-hidden`. An active link carries `aria-current="page"`. The trigger reads "Toggle sidebar" (`triggerLabel`). Mod+B ignores text fields and takes `keyboardShortcut` (`false` turns it off). Skeleton widths are deterministic. `SidebarStateScript` and `useSidebarCookieOpen` keep a collapsed sidebar collapsed on a static shell's first paint, and a controlled provider writes no cookie. [docs](https://design.vegastack.com/docs/components/sidebar)
- **Item**: a link or button row inside `ItemGroup` keeps its own role, and a `listitem` wrapper takes the list role. New `ItemGroupLabel` names the group. [docs](https://design.vegastack.com/docs/components/item)
- **Command**: `CommandDialog` takes `size`; new `CommandLoading` and `CommandFooter`; two-line results; `resultsLabel`. Default copy is "Command palette" and "Search for a command…". [docs](https://design.vegastack.com/docs/components/command)
- **Select**, **Combobox**, **DropdownMenu**, **ContextMenu** and **Menubar**: a two-line row (`ItemTitle` + `ItemDescription`) reads its second line as the row's description, which is where a disabled row gives its reason. [docs](https://design.vegastack.com/docs/components/dropdown-menu)
- **Checkbox**: the mixed state shows a minus. **Checkbox** and **RadioGroup** dim when disabled outside a `Field` too. [docs](https://design.vegastack.com/docs/components/checkbox)
- **Tabs**: `orientation="vertical"` now reaches the primitive, so arrow keys and `aria-orientation` follow it. A line tab list scrolls inside itself. `tabsTriggerVariants` is exported for route tabs. [docs](https://design.vegastack.com/docs/components/tabs)
- **Sheet** and **Dialog**: side sheets take `size` (`sm`, `default`, `lg`, `xl`). New `SheetBody` and `DialogBody` scroll between a fixed header and footer, new `SheetAction` sits beside the close button, and `closeLabel` renames the close control. [docs](https://design.vegastack.com/docs/components/sheet)
- **CardTitle** and **EmptyTitle** take `render`, so a title can be a real heading. [docs](https://design.vegastack.com/docs/components/card)
- **Alert**: the role is `status` unless `live` is set on a destructive or warning alert. Pass `live` for an alert that appears after a user action. `AlertAction` now takes its own column beside the text and drops below it on a narrow alert, so a long label never overlaps the title. [docs](https://design.vegastack.com/docs/components/alert)
- **ToggleGroup**: takes `deselectable={false}` to always keep one item pressed, and `wrap`. [docs](https://design.vegastack.com/docs/components/toggle-group)
- **Badge**: exports `BadgeVariant`. [docs](https://design.vegastack.com/docs/components/badge)
- **ScrollArea**: `aria-label` names the scrolling viewport, which becomes a region, and `viewportRef` reaches it. [docs](https://design.vegastack.com/docs/components/scroll-area)
- Migration: the default copy changed ("Toggle sidebar", "Command palette"). Link rows in an `ItemGroup` gain a wrapper `div`. An Alert that was assertive at load is now `status`.

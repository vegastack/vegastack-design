---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 A sidebar item's `showOnHover` action no longer overlaps its count. `SidebarMenuAction` now writes the `data-show-on-hover` attribute the badge swap selects on — Base UI lower-cases state keys, so it had only ever written `data-showonhover` and the API-33 swap never engaged. At rest the count shows; on hover, keyboard focus or while the action's menu is open the action takes the count's place, with no layout shift or motion. Touch keeps both side by side: below `md`, and now also on a coarse pointer at any width, the action stays visible and the count sits just before it.

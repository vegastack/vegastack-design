---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 Pills sit one step above any surface, one empty pill, and a sidebar hover action. `SplitChip` (behind `RecordChip`) drops its `bg-background` fill for the outline Button's surface-aware one — none in light, a translucent `input/30` in dark — so a pill in a Dialog, Sheet, Popover or Card no longer reads darker than its surface. An empty `RecordChip` looks the same in both variants: `variant="ghost"` now draws the dashed rounded-full border around its muted placeholder too (inside the same 24px box), so every unset property pill — status, priority, assignee, due date, customer, project — shares one empty state. `SidebarMenuAction showOnHover` swaps with the row's badge in the same spot (API-33): the count shows at rest and the action takes its place on hover, focus or while its menu is open, with no layout shift or motion; below `md` the action stays visible and the count moves beside it.

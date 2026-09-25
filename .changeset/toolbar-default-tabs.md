---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Toolbar switches use the default Tabs. `ViewToggle` now renders the default (pill) `Tabs` (at the bar's h-8 tier, which FilterBar also lifts a `TabsList size="sm"` scope to) instead of an outline `ToggleGroup`, keeping its icons (List, `Columns3` for Board, LayoutGrid) with labels hidden on a phone. The `FilterBar` `scope` and `view` slot guidance, the FilterBar, ViewToggle and DataList docs, and the skill now say every scope or view switch in a table or list toolbar is a default `Tabs`, never a `ToggleGroup` or line tabs.

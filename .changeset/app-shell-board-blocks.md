---
"@vegastack/ui": minor
---

🔧 The app-shell-01 and board-01 blocks are modernised as the shell and board references (DS-80).

- **app-shell-01**: the rail has a workspace menu (a real menu trigger) and a Search row that opens a palette on ⌘K / Ctrl+K, with its hint from `formatShortcut`. It also has an Inbox row whose unread count is part of its name, grouped links with `aria-current="page"`, a collapsible "Coming soon" group, and a user menu with the theme choice. The page is `AppShellPage` › `PageHeader` h1 › linked stat tiles, which replace the hand-rolled stat cards. The docs page shows `SidebarStateScript`. [docs](https://design.vegastack.com/docs/blocks/app-shell-01)
- **board-01**: `AppShellPage` › `PageHeader` h1 › a `FilterBar` (search plus an Assignee facet) over `Board`. Lanes are named with their count ("Backlog, 3 tasks"), cards link to their task, and filters that match nothing show "No matches" with "Clear filters". [docs](https://design.vegastack.com/docs/blocks/board-01)
- Migration: the board's view switch that nothing read and its fixed toolbar widths are gone, and every `href="#"` in both blocks is a real route. A copy you already own is unaffected until you copy the block again.

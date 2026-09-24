---
"@vegastack/ui": minor
---

🧩 Three new blocks: a list page, the notification inbox and the search palette.

- **list-page-01**: search first, a Status `FilterBarFacet`, and Mine | Team and Grid | List switches that never deselect. It shows the same records as a `DataList` with row links and row actions, or as industry-grouped grids of linked tiles, pages both views with Load more, and has three empty tiers: nothing yet, no matches and couldn't load (DS-52). [docs](https://design.vegastack.com/docs/blocks/list-page-01)
- **notifications-01**: `InboxSheet`. The rail row and the bell carry the unread count in their names. The sheet has All | Unread, Today and Earlier groups of linked rows with the neutral unread dot, "Mark all read" announced once, Load older, and loading, empty, caught-up and error states (DS-56). [docs](https://design.vegastack.com/docs/blocks/notifications-01)
- **command-search-01**: `CommandSearch` has scope chips (Alt+←/→ from the input), recents, results grouped by type, and aborted stale searches. It has loading, no-results and error states, footer hints from `formatShortcut`, and ⌘↵ / Ctrl+↵ to open in a new tab (DS-57). [docs](https://design.vegastack.com/docs/blocks/command-search-01)

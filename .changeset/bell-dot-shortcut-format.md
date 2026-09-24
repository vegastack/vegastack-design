---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🔧 **NotificationBell** exports `NotificationDot`, the one unread dot for rows, inbox items and nav items (`tone` `default` or `destructive`, decorative), and its dot mode now draws it: **the dot's default tone changes from destructive to primary**, and its `data-slot` is `notification-bell-dot` (the count pill keeps `notification-bell-badge`). A new `countLabel` words the count in the accessible name ("Notifications, 3 unread" by default). **usePlatform** now exports `formatShortcutKey` and `formatShortcut`, which turn `"mod"` into ⌘ on macOS and Ctrl elsewhere; **ShortcutOverlay** uses them and renders the same key labels as before.
[docs](https://design.vegastack.com/docs/components/notification-bell) · [docs](https://design.vegastack.com/docs/components/shortcut-overlay)

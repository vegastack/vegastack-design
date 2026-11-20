---
"@vegastack/ui": patch
---

🧩 `ForYouCard` is a full Inbox row: inside an `Inbox` it takes `value` (J / K reach it, the active row selects it with the rows' start bar, Enter or a click opens it through `onOpen`), `unread` (the row's dot and an sr-only "Unread") and `menu` (the row's items after Snooze and Fewer like this, kept on a settled card, opened by a long press on touch). Its outcome says where an answer came from for every K-FY `via`: `app` "on the web", `phone` "in the mobile app", `desktop` "in the desktop app", `slack`, `email`; `system` says nothing. `Inbox` exports the row behaviour it shares with `InboxItem`: `useInboxRow`, `InboxRowTitle` and `InboxRowMenu`. A click on a field or form inside a row no longer opens the row.

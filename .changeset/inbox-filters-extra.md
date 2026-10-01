---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `InboxFilters` gains `extra`: app-defined chips after All and Unread, each `{ value, label, count? }` (new `InboxFilterOption` type; `InboxFilter` widens to accept their values), so an inbox shows All · Unread 3 · Requests 2 without a second control. A chip's count is now separated by a space in its accessible name ("Unread 3"). `notifications-01` adds a Requests chip for rows that ask for a decision.

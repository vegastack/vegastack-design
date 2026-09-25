---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Inbox: infinite scroll — `onLoadMore` / `hasMore` / `loadingMore` (and `loadMoreError`, `endLabel`) page through an IntersectionObserver sentinel, show three skeleton rows while a page loads (no spinner), a ghost "Try again" after a failure and "You’re all caught up" at the end (15 rows a page). Day-group labels drop their dividers and stick within the scroll area with 16px above (not on the first group) and 6px below; rows keep a 1px divider between them only. Titles are regular weight — foreground when unread, muted once read — with the actor and record in medium. The row ⋯ menu sizes to its content (224–320px). notifications-01 uses the new API in place of LoadMore, names its row item "Mute this type" (tooltip "Stop notifications like this") and demonstrates the loading, error and end states.

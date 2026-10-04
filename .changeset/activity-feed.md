---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 Add `ActivityFeed`, a record's history in Linear style: comment threads and change events in one list.

- `ActivityFeed` is the section: an "Activity" heading with a count, an All / Comments / Activity filter and an Oldest / Newest first toggle, and `pending` to dim the list while a new filter loads. `ActivityFeedList` and `ActivityFeedItem` hold the rows: events 4px apart, a thread card or a divider 12px.
- `ActivityEvent` is one event — a 20px icon (an `ActivityKindIcon`, a `StatusIcon` or `PriorityIcon`, or the actor's avatar), the actor's name opening their hover card ("System" without an actor), the sentence with `ActivityValue`s, and the relative time. `ActivityKindIcon` covers twenty common kinds.
- `ActivityEventGroup` folds a run of events to the first with "N more changes"; "Show less" folds them back.
- `ActivityUnreadDivider` is the "New" line before the first unread item and calls `onVisible` once it is half on screen; `ActivityJumpToLatest` floats "Jump to latest" while the feed's end is off screen; `ActivityFeedSkeleton` is the loading shape.
- `useActivityFeedKeyboard`: J / K move between items, X toggles the focused one, Esc clears; keys typed in a field, a menu or a dialog are ignored.
- `PersonHoverCard` takes `trigger="name"`: the person's name, inline, is the trigger.
- Comments: the author's name opens their person hover card, and `agent: true` on a comment shows a violet bar, a bot avatar when there is no image, and an "Agent" label.

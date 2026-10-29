---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **InboxFilters**: the Unread toggle no longer sits on top of the last tab. The tabs were an unshrinkable pill list inside a `min-w-0` box, so with four tabs (For you · Updates · Snoozed · Archived) in the 384px Inbox sheet the list ran under the toggle and hid most of Archived. The row now wraps: the tabs keep their natural width and Unread drops under them, end-aligned, when both do not fit one line. The tabs use `TabsList overflow="menu"`, so they fold into one dropdown only when they alone do not fit.

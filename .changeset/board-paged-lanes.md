---
"@vegastack/design": patch
"@vegastack/ui": minor
---

🔧 Board lanes show their total as a muted count, lanes and cards have names, and cards can be links. The lane count is now muted `tabular-nums` text instead of a `Badge`, and it shows `count` (the lane's total) when the lane has loaded only some of its cards. [docs](https://design.vegastack.com/docs/components/board)

- Names: a lane takes a plain-text `label` (required when its `title` is not a string; development warns without one), and `getItemLabel` names each card. Each lane is a region named "Open, 14 tasks" (`countLabel` supplies the noun, default "cards"), the Move menu says "Move to In progress", each card's menu control is "Move Write spec", and move announcements name the card and the lane instead of a column id.
- Lane states: `loading` shows skeleton cards and marks the lane `aria-busy`; `emptyState` replaces the default "No cards" drop target; `defaultCollapsed` starts a lane collapsed (`collapsed` stays as its alias). "Drag a card here" shows only where a pointer drag can start.
- Cards as links: `getItemHref` renders a card as a real link (`itemLinkRender` swaps in your router's link). Clicks and modifier clicks are the browser's own, Enter follows the link, and Space still lifts the card into move mode. Card content no longer adds a second tab stop through `TruncatedText`.

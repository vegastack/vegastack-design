---
"@vegastack/ui": minor
---

🔧 **Phone list rows: Inbox rows keep the page's edge and the title's width; lists drop the header and checkboxes until a long press** (`inbox`, `data-list`). On an Inbox page (`layout="page"`) the page's gutter is the rows' inset, so avatars, day labels and the page share one edge and the hover fill is an inset `rounded-item` shape, never a second gutter (`InboxSkeleton` takes `layout` for a loading state outside the Inbox). On a touch screen a long press opens a row's ⋯ menu; with the new `readInMenu` (the menu carries Mark read / Mark unread) the row shows only the unread dot and the time. A `DataList` on a phone (touch, under 30rem) visually hides its column header (unless it is the only sort control) and checkboxes, which stay reachable by screen readers and keyboards; a long press selects a row, and while anything is selected the header and checkboxes return and a tap toggles a row.

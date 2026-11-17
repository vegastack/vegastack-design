---
"@vegastack/ui": minor
---

🔧 **Phone list rows: Inbox rows keep the page's edge and the title's width; lists drop the header and checkboxes until a long press** (`inbox`, `data-list`). On an Inbox page (`layout="page"`) the page's gutter is the rows' inset, so avatars, day labels and the page share one edge and the hover fill is an inset `rounded-item` shape, never a second gutter (`InboxSkeleton` takes `layout` for a loading state outside the Inbox). On a touch screen a row with a `menu` shows only the unread dot and the time; a long press opens its ⋯ menu. A `DataList` on a phone (touch, under 30rem) hides its column header and checkboxes; a long press selects a row, and while anything is selected the header and checkboxes return and a tap toggles a row.

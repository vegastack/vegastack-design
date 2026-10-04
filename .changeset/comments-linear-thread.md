---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Comments take the Linear-style thread: one card per thread, indented replies, a flat reply row and a bordered composer with a toolbar row.

- `CommentThread` is one `rounded-lg` card with no padding of its own; its comments are rows 12px in from its sides. The first comment's body runs the full width, and each reply sits over a hairline with its body indented to the name. `hiddenReplies` + `onShowReplies` add a full-width "Show N more replies" row between the first comment and the replies (with a spinner while a promise settles), and `onHideReplies` adds "Show less". The reply row sits flat at the card's foot: the `viewer`'s avatar, a one-line box with no border of its own, and attach and Send. `highlightedId` tints a comment in the thread.
- `CommentComposer` is a bordered card: the text on top (two lines at rest), the draft's files, and a toolbar row with attach and the round ↑ Send at its end. Files dragged over any comment box with `onAttachFiles` show a dashed "Drop files to attach" overlay. Send's tooltip names the shortcut.
- `CommentItem`: the hover actions (add reaction, ⋯) sit at the end of a header row. Edit puts ✕ Cancel and ✓ Save in that header, with the body becoming a compact box. The ⋯ menu adds Copy text (`onCopyText`) and, on a touch screen inside a thread, Reply, which focuses the reply row. "(edited)" replaces "· edited". A deleted comment keeps its author and time over "This comment was deleted.". Reaction pills get an add button after them. A standalone comment card is `rounded-lg`, and `variant="reply"` indents the body.
- `CommentList` puts the composer under the heading while newest first and names the day between comments posted on different days (`dayDividers`, on by default). New parts: `CommentListHeader`, `CommentDayDivider` and `useCommentDayDividers`, for hosts that lay out their own threads. `CommentListSkeleton` now draws two thread cards and the composer.

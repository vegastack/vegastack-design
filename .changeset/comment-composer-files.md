---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Comments. The comment and reply boxes take the `Input` radius (`rounded-lg`) instead of a near-pill `rounded-xl`. `CommentList` shows no "No comments yet" line by default — the composer alone; `emptyText` still adds one. Delete in a comment's ⋯ menu calls `onDelete` at once, without a confirmation dialog (hosts offer Undo). A box's `files` (the draft's attached files) now render inside the box over the text, not above it; with `onAttachFiles`, pasted or dropped files join them instead of going into the text. `CommentComposer` and `CommentThread`'s `composer` take `hasFiles`: a draft with attached files can be sent without text. Reaction pills are lighter: a soft hairline border with no fill, and a light primary tint when reacted, in both themes.

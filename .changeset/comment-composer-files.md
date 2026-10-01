---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Comments. The comment and reply boxes take the `Input` radius (`rounded-lg`) instead of a near-pill `rounded-xl`. `CommentList` shows no "No comments yet" line by default — the composer alone; `emptyText` still adds one. Delete in a comment's ⋯ menu calls `onDelete` at once, without a confirmation dialog (hosts offer Undo). `CommentComposer` and `CommentThread`'s `composer` take `hasFiles`: a draft with attached files can be sent without text.

---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 Comments beside the text and version history. `CommentThread` (in `comments`): a quoted thread with replies, a one-line reply box, resolve/reopen, orphaned and collapsed states; `CommentItem` takes `attachments`, and the composers pass `mentions`, `mentionHref` and uploads to their editor. New `CommentMargin` lays thread cards beside their highlights (active card aligned, the rest stacked) with `CommentPopover` for narrow screens; `VersionList` is a version history listbox (Current, Restored, Unsaved copy, Named only, Load more); `DiffView` shows word-level changes between two texts, line-only above 200 KB, with the sanctioned `diff` engine in its own lazy chunk. New block: `page-editor-01`.

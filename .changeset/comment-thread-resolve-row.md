---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **CommentThread**, **CommentItem**: Resolve moves from the thread header to the first comment's action row — a ✓ hover action before add-reaction, shown on hover or focus and always on a touch screen — through `CommentItem`'s new `onResolve`. The header now shows only when it has something to say: the quote, "Original text was removed", or "Resolved by …" with Reopen; a page-level thread (no quote) no longer opens with an empty band above the author line. [docs](https://design.vegastack.com/docs/components/comments)

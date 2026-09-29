---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 `CommentList` takes `mentionHref` and passes it to every comment, so mention chips in top-level comments link as they already did in `CommentThread`. A top or bottom `SheetContent` now stops at `85dvh` (API-21), so a long body — a comment thread on a phone — scrolls inside `SheetBody` with the footer in view instead of running past the screen.

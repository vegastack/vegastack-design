---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Comments keep drafts. `CommentComposer` takes `defaultValue`, the editor's starting text (Send is enabled while it is non-empty; the box starts empty after a post). `CommentThread`'s `composer` passes `defaultValue` (the reply box opens unfolded on it), `onValueChange` (every change, and `""` after a reply posts) and `posting` (busy, OR'd with the reply's own state: Send and Cmd/Ctrl+Enter do nothing, e.g. while an upload runs). `CommentItem`, `CommentList` and `CommentThread` take `onEditValueChange(commentId, value)`, called with the edit box's text on every change and with `null` when the edit is saved or cancelled, so a host can guard unsaved edits.

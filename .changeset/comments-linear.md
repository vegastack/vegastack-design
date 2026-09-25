---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Comments go Linear style: `CommentComposer` is a soft filled box with a round ↑ send button (Cmd/Ctrl+Enter sends), an `attachments` slot and no avatar (`author` is gone); `CommentList` gets an Oldest / Newest first toggle (`order`, `onOrderChange`) and an empty state whose "Add a comment" reveals and focuses the composer; editing a comment uses a compact box with Cancel and Save. New block `issue-detail-01`: a Linear-style issue page composed of the real components.

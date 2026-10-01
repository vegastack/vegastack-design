---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 Composer controls never touch the border: the paperclip and Send are 24px and sit 4px in from the border on every side (still 32px tall at rest, pinned to the last line as it grows). A record's new-comment box (`CommentComposer` without `replyingTo`) reserves two lines at rest; reply boxes stay one line.

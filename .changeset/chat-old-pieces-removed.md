---
"@vegastack/ui": minor
---

🗑 The old chat pieces the new thread replaced are removed, with no aliases: `ApprovalCard` (`approval-card`; an agent asking to act is `RequestCard`, or `ChatRequestCard` in a chat), and from `message-parts` `MessageFold`, `foldLineCut` and `MessageSourceList` (the pages an answer cites are `SourceList`, and an answer never folds; `UserBubble` fades a long message from the person). `MessageActivityResults` now draws its site icons with `source-list`'s `SiteIcon`, so `message-parts` installs `source-list`. `CommandLoading`'s animated search glyph and its motion engine load only once a search runs, with the still search glyph until then, so a command menu's first load no longer carries them.

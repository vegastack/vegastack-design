---
"@vegastack/ui": minor
---

🧩 `LinkProvider`: one rule for every link, set once at the app root — a plain click on an in-app link (a path, or a full address on the app's origin) is the router's navigation in the same tab, a modified or middle click stays the browser's, another origin opens a new tab. `MarkdownView`, `InlineChip`, `RecordChip`, `DataList`, `TextEdit` (read-only links and the link card's Open) and every `linkRender` default (`AppLink`) read it; their own props still win. `useStickToBottom`: a chat thread stays on its newest line while the reader is there (streamed words, an activity block opening, an image loading), lets go only when the view really moves up, re-pins at the bottom or on Jump to latest, and always shows a send — use it with `MessageScroller`'s `autoScroll` off, whose engine stops following after a wheel or key at the bottom.

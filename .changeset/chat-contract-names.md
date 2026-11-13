---
"@vegastack/ui": patch
---

🐛 `MessageParts` and `UserBubble` read a file's name from `providerMetadata.vegastack.filename` when the part has no `filename` (a streamed `file` chunk carries none), and `ChatTurn.waitingOn` accepts `null`, which the chat sends once a turn stops waiting.

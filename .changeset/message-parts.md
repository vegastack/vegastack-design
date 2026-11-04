---
"@vegastack/ui": minor
---

🧩 Message parts, for an agent's turn in a chat or thread: `MessageSteps` and `MessageStep` (one quiet line that opens to what the agent did), `MessagePlan` (a checklist edited in place), `MessageStatus` and `MessageNotice`, `MessageChange` (what changed, with Undo at the end of the row), `MessageHandoff`, `MessageSources`, `MessageDisclaimer`, `MessageActions`, `MessageVersionSwitch` and `MessageFold`. `StatusLine` takes `live`, on by default; these parts turn it off, since a conversation is a `role="log"`.

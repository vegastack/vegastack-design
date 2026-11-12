---
"@vegastack/ui": minor
---

🧩 `MessageActivity` gains the states of an agent's steps row: a `warning` part on the closed line in warning ink ("1 didn't finish") and an `omitted` count that ends the timeline ("+10 more steps"). `MessageActivityStep` takes `verb`, `target`, `summary` and `ms` (shown from half a second), plus `reason` and an `action` for a step that didn't finish; `label`, `detail`, `meta` and `error` keep working. `MessageActivityNote` takes a `label` and `ms` for thinking notes, cut at 1,200 characters with Show more. New: `MessageActivityGroup` (nested steps, such as Subagents, with a count line) and `MessageActivityFold` (consecutive steps of one kind as one row).

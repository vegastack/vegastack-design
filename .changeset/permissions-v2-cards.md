---
"@vegastack/ui": minor
---

🧩 Ask and request cards carry Auto-check's reason; rule words wrap in the Always menus.

- `AskCard` and `ChatRequestCard`: new optional `reason` — one muted line in the caller's full words ("Auto-check asked: the recipient isn't one anyone named"), under the title and facts (`AskCard`) or the subject's detail (`ChatRequestCard`) while the ask is open. It wraps and never truncates the title; the card adds no prefix, and a settled `RequestLine` doesn't show it.
- `AskCard`'s folded Always menu is 18rem wide, so an Always choice's `scopeLabel` can be the sentence the rule will save ("Saves: Inbox helper may post in Slack in #ops without asking.") and still read whole on two lines at 390px.
- `ChatMenuItem`: a `hint` wraps to two lines at 16rem instead of widening the menu, so `ChatRequestCard`'s Always scopes keep the menu narrow.
- `ToolPermissionList`: an unconditional rule line reads its answer label alone ("Needs approval"), no longer "Needs approval Always"; its options button is named "Rule options: Needs approval".

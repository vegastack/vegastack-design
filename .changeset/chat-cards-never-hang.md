---
"@vegastack/ui": minor
---

🔧 Chat lines hang and cards offer what the server offers. Work lines, `ChatRow`, `ChatGroup`'s summary, the Subagents line, `BackgroundWork`, error and stuck rows, memory, source, question, request and plan lines now start their text on the answer's own column, and their hover fill reaches 8px into the gutter instead of pushing the words in; the guide line under an open group moves with them. `ChatRequestCard` draws a `never` choice ("Never allow this") as a quiet text button beside Decline, and a request answered with it reads "Never allowed · …". `RequestBundleCard` draws the choices every ask offers from `offer.bundle.choices` (Always as a menu when there are several scopes, Never allow these, Decline) and `onAnswerAll` now gets the chosen choice's id as a `string`. `ChatPlanCard` shows one Approve when no step needs an OK (`onApprove("ask_before_changes")`); the settled line then leaves out "asks before changes".

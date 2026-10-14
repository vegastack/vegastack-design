---
"@vegastack/ui": patch
---

🧩 `AgentEditBanner` is new, and `VersionList` writes an agent author as everywhere else.

- `AgentEditBanner` (`shadcn add @vegastack/agent-edit-banner`) is the strip under a document's header after an agent changed it: the agent's purple bot, "Edited by Claude (via Manoj) · 3 changes · 2m ago", View changes, "Undo this agent's changes" and a ✕. `status="undoing"` spins Undo and disables both buttons; `refused` adds "Couldn't undo only Claude's changes because people edited the page since." (or your `refusedReason`) and swaps Undo for Open versions; `kind="created"` reads "Created by Claude (via Manoj) · 5m ago". The callbacks passed decide which buttons show, so a read-only viewer sees the words and the ✕. `moreAgents` ends the line with "+1 more agent", a popover listing the rest, each with its own Undo. Under a 42rem container the buttons take their own row. It is a polite status region, the buttons are named "Undo Claude (via Manoj)'s changes" and "View Claude (via Manoj)'s changes", and every string can be replaced through `labels`.
- `VersionList`: an author with `kind: "agent"` reads "Claude via Manoj" with the purple "Agent" label after the bot, as in comments and activity. A row's `name` can be any title the host writes ("Before Claude (via Manoj)'s edits"), with `summary` as its second line ("Claude edited 3 blocks").

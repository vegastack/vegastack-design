---
"@vegastack/ui": minor
---

🧩 `RequestCard`, `PermissionList` and `PermissionRow`: one card for every question an agent asks before it acts, drawn from a data-only `CardSpec` and `CardState` that the web, Slack and the phone share. Allow once · Always allow (the exact place, or one step wider from its menu, or this chat) · Decline (with a note, or Never allow this); a hard-rule card has two answers; a bundle answers a run's requests together; the nudge after three Allow once answers puts Always first; neither Allow once nor Always is primary. Answered, skipped, expired, refused, withdrawn or cancelled, the buttons give way to one line in the same words everywhere ("✓ Always allowed by you · Revoke", "Skipped: no answer in 24 h · Do it now"). `compact` is one row for Home and Inbox. `PermissionList` is What I've allowed: uses, when last used, paused lines with Confirm, Revoke and Undo.

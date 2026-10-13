---
"@vegastack/ui": patch
---

🧩 Agents get one identity across people surfaces, and `ApprovalCard` is new.

- `Person.kind` adds `"agent"` (an AI assistant working for a member), with `via` naming the member. `PersonAvatar` draws an agent as the `Bot` icon on the purple tag hue. The new `PersonName` writes the name as "Claude Code via Manoj" with the purple "Agent" label (`PersonAgentLabel`), and a screen reader hears "Claude Code, agent of Manoj". `personDisplayName` ("Claude Code (via Manoj)") and `personAccessibleName` give the same name as plain text. `PersonCard`, `PersonHoverCard`, `AvatarStack`, `Comments`, `ActivityEvent` and `PeoplePicker` rows all use it.
- `CommentData` adds `tone: "question"` (amber bar, "Needs your reply") and `choices`. Choices render as buttons under the body when the item, thread or list gets `onChoose`. `ActivityKind` adds `delegated`, `undelegated`, `agent-queued`, `agent-working`, `agent-needs-you`, `agent-done`, `agent-failed` and `agent-step`, each drawn in its status tone.
- `PeoplePickerOption` adds `disabledReason`, which lists the option disabled with the reason as its second line. The list props add `heading` ("Your agents").
- `ApprovalCard` (`shadcn add @vegastack/approval-card`) shows a risky action an agent asked to take: who asks, the action, the records it touches ("and N more"), the reason, a reassurance, "Requested 2m ago · Expires in 5 days", and one Approve / Decline for the whole request. It covers the pending, approving, approved, declined, expired, cancelled and already-answered states, plus a "Waiting for Manoj's approval" view for anyone who can't decide.
- Deprecated: `CommentData.agent` and `ActivityEvent`'s `agent` prop still work for one release; give the author or actor `kind: "agent"` instead.

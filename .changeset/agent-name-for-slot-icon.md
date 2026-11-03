---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🔧 Agents read agent-first, with no label in rows and feeds. `PersonName`, `personDisplayName` and `personAccessibleName` say "Claude Code for Manoj" (was "via"). `PersonName`'s `agentLabel` now defaults to `false`, since the hexagon already says agent. `ActivityEvent` and `Comments` no longer add the purple "Agent" label; hover cards keep it. `AgentSlot` (the Delegate property) gives the agent's name the room: its state is the icon alone, with the word in a tooltip and for screen readers. `AgentPanelAgent` takes `mark`, which the panel, slot, chip and hover card pass to the avatar. The hover card's facts read "For Priya · claude.ai · Read & write", with `provider`. ⚠️ Hosts that relied on the default label pass `agentLabel`.

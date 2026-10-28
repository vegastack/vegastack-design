---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **AgentHoverCard** shows the agent's `lastAction` (its latest progress line, under the state), and its body ships on its own as **AgentCard**. **PersonHoverCard** takes a host's card through `PersonHoverCardProvider` (keyed by the new optional `Person.id`), so an agent's name in comments and activity opens the same agent card. [docs](https://design.vegastack.com/docs/components/agent-panel)

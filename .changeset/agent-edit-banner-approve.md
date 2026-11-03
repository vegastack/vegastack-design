---
"@vegastack/ui": minor
"@vegastack/design": minor
---

🧩 `AgentEditBanner` takes `onApprove`: an Approve button beside Undo (outline, like every banner action) for "these changes are fine", named `labels.approveName(agent)` ("Approve Claude (via Manoj)'s changes"). A new `status="approving"` spins it; it and `undoing` each disable every action, so an approval and an undo never race. Each `moreAgents` row takes `onApprove` too. The banner stores nothing: the host keeps the approval and stops rendering the banner.

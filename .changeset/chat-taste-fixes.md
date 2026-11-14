---
"@vegastack/ui": patch
---

🔧 Chat fixes from the live checks. `QuestionCard` puts a single question's title on Skip's row, so no empty band sits above it; several questions keep the pager there. A settled turn whose only work was Subagents says it once: the Subagents line carries the turn's summary ("Worked for 21s · 2 Subagents"), with no second line above it. `ChatPlanCard`'s handlers are optional: without them a waiting plan is read-only ("Plan · v2 · Waiting for approval") for a reader who can't decide, and `PlanLine` reads "Plan waiting for approval · 4 steps" for a waiting plan. `FilePreview`'s header drops its Open icon: the file's name is the one open target, beside Download.

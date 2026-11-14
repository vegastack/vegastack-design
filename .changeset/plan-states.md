---
"@vegastack/ui": minor
---

🔧 `PlanData.state` adds `changes_requested` and `expired`, both settled. `PlanLine` reads "Changes asked for · v1" when Keep planning was asked and no new version has come yet, and "Plan expired · v1" when no one answered in time, instead of "Replaced by a newer plan". The ✓ stays for an approved plan only. `PlanCard`'s settled words match the chat's: "Changes asked for · by Priya" and "Plan expired · no answer in 7 days".

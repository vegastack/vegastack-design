---
"@vegastack/ui": patch
---

🧩 `RequestCard` (and `PermissionList` rows) and `PlanCard` draw the asking agent's own face: `CardAgent` and `PlanAgent` take optional `mark` (a glyph node or an image object) and `hue`, passed to its `PersonAvatar`, so an agent without an image shows its glyph on its colour instead of the fallback bot. `avatar` works as before.

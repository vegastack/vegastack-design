---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **A large rail row centres safely** (`sidebar` LAY-19): `SidebarMenuButton size="lg"` centres with `justify-center-safe`, so a row whose content overflows the collapsed rail (an avatar beside a name) keeps its avatar at the start instead of being pushed off the edge.

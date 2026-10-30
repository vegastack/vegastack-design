---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **Collapsed sidebar: every icon clickable, neutral counts** (`sidebar`, INT-15): in icon mode a `SidebarGroupLabel` (faded and pulled up over the item above it) no longer takes the click meant for that item, so every rail icon opens and shows its tooltip; the rail's count pill and dot use the app header's count ink (`bg-primary` / `text-primary-foreground`) in both themes instead of the blue `sidebar-primary` accent.

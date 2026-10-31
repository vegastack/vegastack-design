---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **Menu rows shrink; large rail rows centre** (`dropdown-menu` LAY-18, `sidebar` LAY-19): menu items, sub-triggers and checkbox/radio items take `min-w-0`, so a row in a grid or narrow column truncates its label; `SidebarMenuButton size="lg"` centres its content in the collapsed rail, so a 24px avatar sits centred. Two deliberate deviations from shadcn (MK, 31-10-2026), recorded in the register so a shadcn refresh keeps them.

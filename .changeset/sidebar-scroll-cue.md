---
"@vegastack/ui": minor
---

🧩 Sidebar: a list that scrolls now says so (LAY-21). `SidebarContent` fades only the edge with more to show (`scroll-fade-y`), `SidebarFooter` casts a soft top shadow while items sit under it, and on a fine pointer's hover a small ⌃/⌄ button pages about a screenful beside a thin scrollbar. Nothing shows when the list fits or in the icon rail; the phone drawer keeps only the fades and the shadow. New `scrollUpLabel` / `scrollDownLabel` props name the buttons.

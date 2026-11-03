---
"@vegastack/ui": patch
---

🔧 `AppShellHeader` lines its edge controls up with the page: the sidebar trigger's icon now starts at the page gutter, where the content below starts, and on a phone the Search and Inbox icons end where the content ends. An actions slot with nothing in it (an unfilled portal target) no longer leaves a gap at the end of the bar. `RecentStrip`'s scroll buttons move into their own column at the strip's end, so they never sit over a half-visible card; the list fades where a card is cut. A card's icon tile now sits 8px from the card's edge on every side, which gives the title 8px more room.

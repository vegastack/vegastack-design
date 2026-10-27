---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **Board**, **DataList** and **SectionRow**: a lane, section or hidden-lane count above 99 shows "99+" (the cap the notification bell and the Inbox already use), while its spoken label keeps the number the host passed (`countLabel`, `sectionCountLabel`). New `displayCount(n)` in `data-table-parts` formats it. [docs](https://design.vegastack.com/docs/components/board)

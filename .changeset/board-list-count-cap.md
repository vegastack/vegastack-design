---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **Board**, **DataList** and **SectionRow**: a lane, section or hidden-lane count above 99 shows "99+" (the cap the notification bell and the Inbox already use), while its spoken label keeps the number the host passed (`countLabel`, `sectionCountLabel`); `displayCount(n)` in `data-table-parts` formats it. **DataList** nests rows one level deep with `getRowParentId` (a sub-task under its task, in its parent's section, stepped in), folded through `collapsedParents` / `onCollapsedParentsChange`, with the toggle left to the host through the cell context's `nesting`. [docs](https://design.vegastack.com/docs/components/data-list)

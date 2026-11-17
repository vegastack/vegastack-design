---
"@vegastack/ui": minor
---

🔧 **BreadcrumbDropTarget loads its drag code only when one mounts** (`breadcrumb-cascade`). The drop wiring (`useDragInto`) moved to `breadcrumb-drop-target.tsx`, loaded the first time a drop target renders, so a trail without one never ships it; until then, and in the server render, the crumb is the same link without the drop wiring. Import paths are unchanged.

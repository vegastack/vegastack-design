---
"@vegastack/ui": minor
---

New `action-bar` component — a floating contextual bar with a status region and action children.
Bulk selection ("5 selected · Tag · Archive") is its most common recipe, never its identity: the
same object serves unsaved-changes and batch-progress bars. It never owns selection (the host's
list keeps `selectedIds`), announces status changes politely, inerts its actions while `pending`,
sits flat in the raised band (covered by any dialog), and enters/exits with the CSS-only
translate/scale/opacity recipe MessageScrollerButton established. `containerRef` switches from
viewport centring (auto margins — never `left: 50%`) to ResizeObserver-measured centring over a
content area beside a sidebar.

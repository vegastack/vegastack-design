---
"@vegastack/ui": patch
---

🐛 **ViewTabs** stays as tabs while they fit. It used to switch to its narrow `Select` below a fixed `@3xl` container width, so in a **FilterBar** `leading` slot a table page's two short tabs ("Grid", "Board") collapsed to "Grid ▾", with the `+` floating far right, once the facet row opened. Now it measures its tab row against the room it has: it collapses only when the tabs don't fit, and goes back to tabs as soon as they do. The collapsed select keeps its `+` and ⋯ beside it. The root is no longer a size container. **DataGrid** shows a quiet trailing edge shade while more columns sit past the end of a sideways-scrolling viewport (an `embedded` block on a phone, for one), and the viewport uses `overscroll-x-contain`, so a sideways pan stops at the grid instead of moving the page. [docs](https://design.vegastack.com/docs/components/view-tabs)

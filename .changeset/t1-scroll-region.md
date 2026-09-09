---
"@vegastack/ui": minor
---

🔧 **`Table`, `DataList`, `DataGrid`, `ComparisonMatrix`, `Terminal`** — a scroll viewport is now a
named, keyboard-reachable region, and it is measured rather than guessed. A wide table could
previously only be scrolled with a pointer (axe `scrollable-region-focusable` on the Table page and
the dashboard block), while `ComparisonMatrix` and `Terminal` carried an unconditional tab stop that
was dead on every instance that fits. Each viewport now measures itself through `useOverflow` and
takes a tab stop **only while it can actually scroll**; name it with `scrollLabel` (falling back to
the table's `aria-label`) and it is exposed as `role="region"`, unnamed it stays a plain focusable
container. Its focus outline is inset, because the viewport clips its own overflow. Names and roles
do not move with the measurement — `Terminal`'s name and `group` role stay unconditional. `Table`
and `Terminal` both stay server-safe: the measurement lives in a `'use client'` leaf
(`table-scroll-region.tsx`, `terminal-body.tsx`).
[docs](https://design.vegastack.com/docs/components/table)

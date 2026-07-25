---
"@vegastack/ui": minor
---

Give `Terminal`'s scrollable command pane an accessible name, and accept `aria-label` /
`aria-labelledby` to override it.

The pane is keyboard-focusable — a scrollable region has to be reachable without a pointer — but it
was a bare `<div tabIndex={0}>` with no role and no name, so a screen reader announced it as an
unnamed stop in the tab order (WCAG 4.1.2). It is now a `group` labelled by the visible `title`, so
`title="Install"` reads as "Install, group" with no caller changes. `group` rather than `region`
because `region` is a landmark and a page with several install snippets should not gain several
landmarks.

`aria-label` and `aria-labelledby` passed to `Terminal` now apply to that pane instead of the outer
block, matching `ScrollArea`. On the outer block they had no effect — it carries no role — so nothing
that previously worked stops working.

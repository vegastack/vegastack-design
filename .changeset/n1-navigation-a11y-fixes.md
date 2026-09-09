---
"@vegastack/ui": minor
---

🐛 **Four navigation and layout accessibility defects.** **`BreadcrumbPage` announced the current
page as a disabled link** — it rendered `<span role="link" aria-disabled="true">`, so screen readers
described a non-interactive segment as a dimmed link; it is a plain `<span aria-current="page">`,
and the ARIA misuse was inherited from shadcn. **Focus rings were clipped on scroll viewports** —
`ScrollArea`'s and `MessageScroller`'s viewports and the sidebar rail offset their focus outline
OUTWARD under a clipping ancestor, so the ring was cut in half or lost; all three inset it now.
**Every shell and sidebar docs fixture rendered a duplicate `<main>`** inside the docs page's own,
failing axe's `landmark-no-duplicate-main`; they render `landmark="region"`. And **`TabsContent`,
`BreadcrumbCollapsed`'s trigger and `AppShell`'s skip link each restated the global
`:focus-visible` rule** — two copies of one rule can only drift, so the copies are gone.
[docs](https://design.vegastack.com/docs/components/breadcrumb)

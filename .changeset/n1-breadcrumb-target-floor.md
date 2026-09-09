---
"@vegastack/ui": minor
---

🐛 **The collapsed-breadcrumb trigger was a 20×20 pointer target.** Its visible box was the 20px
`BreadcrumbEllipsis` glyph and nothing expanded it, so the one control that reveals a trail's
hidden segments sat under the WCAG 2.5.8 24×24 CSS px floor — measured 20.00×20.00 on all three
breadcrumb fixtures. `BreadcrumbCollapsed`'s trigger now carries a transparent `::before`
expansion (`relative before:absolute before:-inset-0.5`) that brings the EFFECTIVE target to
exactly 24×24 with no change to the visible glyph and no change to the trail's line height; 2px per
side stays inside `BreadcrumbList`'s 6px gap, so it never reaches into a neighbouring segment.
`BreadcrumbEllipsis` is decorative and stays 20px — its doc comment now says the wrapping trigger
owns the target, and the manual-composition example demonstrates it.
[docs](https://design.vegastack.com/docs/components/breadcrumb)

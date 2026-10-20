---
"@vegastack/ui": patch
---

⚠️ **DocumentLayout**: the contents take no column. `DocumentLayoutContents` floats at the layout's inline-end edge, in a 2.5rem gutter the grid keeps from the M tier whether or not a page has headings, so a contents list that arrives never moves the text. `DocumentLayoutContentsRail`, `DocumentLayoutContentsList` and the `contents` prop (on `DocumentLayout` and `DocumentLayoutSkeleton`) are gone: put a `TableOfContents variant="rail" side="end"` in `DocumentLayoutContents`, and offer "On this page" from a menu below M.

---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Design review fixes. The `TableOfContents` rail opens as a solid, raised panel over the page (`z-20`, a shadow). `DataList`'s `mergedLayout="line"` is one truncating meta line: avatars in it are hidden, and a value that renders nothing, `""` or `"—"` is dropped with its dot. Keyboard focus in a `DataList` row now washes the whole row and paints a 2px start bar on its first cell (a background layer, FOC-13). `ActionBar` stays inside the viewport and takes `secondaryActions`, which fold into a ⋯ menu (`moreLabel`) below `sm`. `VideoPlayer` keeps its controls, and the play button, shown on a coarse pointer. `FileTypeIcon` takes `tinted`, and the new `FileKindTile` (with `FILE_KIND_LABEL`) is a no-preview card's picture. `MarkdownView` and `TextEdit` take `headingScale="document"`. Menus size to their longest item, so items never wrap (OVL-19). The new `BreadcrumbTrail` folds its middle steps into a "…" menu before it shortens the current step. `FileViewer` reads Excel workbooks (sheet tabs, the first 500 rows) and Word documents itself, with SheetJS and mammoth imported only when such a file opens, up to 20 MB.

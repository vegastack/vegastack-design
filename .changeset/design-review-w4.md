---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Design review fixes. The `TableOfContents` rail opens as a solid, raised panel over the page (`z-20`, a shadow) instead of under its text. `DataList`'s `mergedLayout="line"` is one truncating meta line: avatars in it are hidden, and a value that renders nothing, `""` or `"—"` is dropped with its dot. `ActionBar` stays inside the viewport and its actions no longer shrink into each other (they scroll). `FileTypeIcon` takes `tinted` to colour icons by kind, and the new `FileKindTile` (with `FILE_KIND_LABEL`) is a no-preview card's picture: a large coloured icon and the kind's name. `MarkdownView` and `TextEdit` take `headingScale="document"` for a page's heading sizes (`text-3xl` / `text-2xl` / `text-xl`).

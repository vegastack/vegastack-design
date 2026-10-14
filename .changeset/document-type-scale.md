---
"@vegastack/ui": patch
"@vegastack/design": patch
---

⚠️ **MarkdownView** / **TextEdit**: `headingScale` is replaced by `typeScale` — `"compact" | "document"`, no alias — and `proseDocumentHeadingsClassName` is gone. `typeScale="document"` is now the whole document type scale (TYP-20, MK 2026-10-14), not just bigger headings: 14/24 text (16/26 on a coarse pointer or a narrow window, so reading and editing match and iOS never zooms), 12px between paragraphs, `#` 24 · `##` 20 · `###` 16 (18 over 16px text), inline code in the body's ink, and print rules; `@vegastack/design` exports it as `proseDocument` and `proseDocumentClassName`. Rename `headingScale="document"` to `typeScale="document"`; headings are smaller than the old document scale (24/20/16, was 30/24/20). **TextEdit**: `onOutlineChange` no longer mounts the editor — the read view reports the outline from the Markdown until the editor is in.
[docs](https://design.vegastack.com/docs/components/markdown-view)

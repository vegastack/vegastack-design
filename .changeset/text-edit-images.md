---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `TextEdit` images resize with Tiptap's `ResizableNodeView` (corner and side handles, aspect kept, snap guides at ¼ ½ ¾ and full width, touch included), keep their width in Markdown as `![alt|320](src)` and in HTML as `width`, and carry a ⋯ menu — Open, Download, Copy link, Remove image. Open, a double-click, and a click on an image in a read-only document or a posted comment show it in the `FileViewer`, paging through the document's images; `ImageViewerScope` does the same around any `MarkdownView`, which now renders the stored width.

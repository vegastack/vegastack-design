---
"@vegastack/design": patch
"@vegastack/ui": patch
---

🔧 Heavy UI stays out of a page's first bundle. [`TextEdit`](/docs/components/text-edit) renders its saved value as light read HTML (server-rendered, same typography, still editable to the touch) and loads the Tiptap editor on hover, focus or tap, swapping it in place with the caret where you clicked; `preloadTextEdit()` loads it ahead of time. [`MarkdownView`](/docs/components/markdown-view) now parses with `marked` instead of `react-markdown` (about a quarter of the size), adds `format="html"` for rich-text HTML and `allowedImageOrigins={["*"]}`. [`DatePicker`](/docs/components/date-picker) and the [`FilterBar`](/docs/components/filter-bar) date filter load the calendar engine only when the picker is about to open.

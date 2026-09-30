---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 File chips and inline images. `MarkdownView` and `TextEdit` take `fileContentType(href)` so a file chip's icon follows the file's content type when the host knows it, not only the name's extension. `TextEdit` takes `inlineImageTypes` (default JPEG, PNG, WebP, GIF and AVIF): a pasted, dropped or picked file of another type — an SVG, a HEIC photo — goes to `onFileUpload` and lands as a file chip instead of an inline image.

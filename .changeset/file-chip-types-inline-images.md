---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 File chips, inline images and comment files. `MarkdownView` and `TextEdit` take `fileContentType(href)` so a file chip's icon follows the file's content type when the host knows it, not only the name's extension. `TextEdit` takes `inlineImageTypes` (default JPEG, PNG, WebP, GIF and AVIF): a pasted, dropped or picked file of another type — an SVG, a HEIC photo — goes to `onFileUpload` and lands as a file chip instead of an inline image. `CommentComposer` (and `CommentThread`'s `composer`) take `onAttachFiles`, which receives the attach button's files instead of inserting them into the text (pasted and dropped images stay inline), and `files`, shown over the box for the draft's attached files and their upload progress; `mentionImage` reaches the comment boxes and bodies, and `CommentItem`, `CommentThread` and `CommentList` pass `fileContentType` to each body.

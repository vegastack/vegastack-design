---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `TextEdit` gains what a page editor needs, every construct round-tripping exactly through Markdown: `@` mentions (`mentions`, `mentionHref`) stored as `[@Label](mention://kind/id)`; image and file uploads by paste, drop, the image panel and the slash menu (`onImageUpload`, `onFileUpload`, `onUploadError`, `fileLinkPrefix`) that commit even after blur; callouts (`> [!NOTE]`, `[!TIP]`, `[!WARNING]`) and toggles (`details`); an outline (`onOutlineChange`) and an imperative `handleRef` (`scrollToHeading`, `flush`, `focus`, `getAnchorForSelection`, `pulseAnnotation`); and comment highlights (`annotations`, `activeAnnotationId`, `onAnnotationClick`, `onAnnotationHover`, `onCreateAnnotation`, `onAnnotationsLayout`) drawn as decorations, read-only too. ⌘K inside the editor no longer reaches a page's own palette. `MarkdownView` renders mention and file chips, callouts, toggles and `headingIds`. New libs `text-anchor` and `text-anchor-doc` store and map comment anchors.

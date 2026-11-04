---
"@vegastack/ui": minor
---

🔧 `MarkdownView` takes `untrusted`, for content an agent or an outsider wrote, so safety no longer depends on having a proxy: nothing loads or fetches by itself, images and media on this site need `allowedImagePaths`, bookmarks fetch no preview, and a blocked image's box names its real origin. `imageProxy` implies it. A `mailto:` shows its address under `showLinkDomains`. An agent's comment always renders this way with link domains; `CommentItem`, `CommentThread` and `CommentList` take `agentMarkdown` for its image paths and proxy.

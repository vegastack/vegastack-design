---
"@vegastack/ui": minor
---

🔧 `MarkdownView` for content an agent or an outsider wrote: `imageProxy` turns a blocked image's box into "Image from acme.com" with Show, which loads through the host's proxy and fetches nothing before that (`blockedImageLabel`, `showImageLabel`), and `showLinkDomains` says where each external link goes, after its text. With `imageProxy` set, `*` in `allowedImageOrigins` no longer applies, the proxy's own address never loads by itself, and bookmarks fetch no preview. Links that leave the page without an `https://` prefix, such as `//host/path`, now open as external links.

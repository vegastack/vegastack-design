---
"@vegastack/ui": patch
---

🐛 `MarkdownView`: an image that fails after Show returns to its box with "Couldn't load this image" and Try again (`imageFailedLabel`, `retryImageLabel`), and a proxied image with no alt text is named by its source's file name in the `FileViewer`, not by the proxy's address.

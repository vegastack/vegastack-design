---
"@vegastack/ui": patch
---

🐛 **TextEdit**, **MarkdownView**: an image stores its size (`![alt|320x180](src)`; `parseImageAlt` and `imageMarkdown` read and write the height), read from the file on upload and from the image on import, so the read view and the editor reserve its box before it loads; an image on a line of its own is a `figure` in `MarkdownView`, laid out as `TextEdit`'s image block (16px apart at the document scale in both), a diagram's block view sits 16 from its neighbours in the read view as in the editor and its server fallback no longer takes the `pre` margins, and the content box keeps its blocks' margins (`flow-root`) — the swap from the read view into the editor moves nothing. A failed upload stays in the text as "Couldn't upload" with Retry and Remove (new `onFailedUploadsChange` counts them) instead of vanishing. The link card truncates a long link in the middle (the full URL on hover and in its accessible name) and never overflows its card.

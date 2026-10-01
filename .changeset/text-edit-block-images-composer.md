---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 TextEdit: images are blocks and a composer variant. An image is a block of its own (still `![alt|width](src)` in markdown; an image inside a paragraph is lifted into its own block on load, and `MarkdownView` shows it the same way). Dragging an image moves it between blocks with the block drop line (2px, info blue); pasted, dropped or inserted images, videos and audio land after the current block. A selected image has a 2px info-blue ring at its radius and handles in the same colour, with no ring on hover. New `variant="composer"` with `actions` and `footer`: a box that looks exactly like `Input` at rest, grows line by line to about ten lines then scrolls, actions pinned bottom-right, file cards under the text. `CommentComposer`, replies and in-place edits use it; the old composer styles are gone.

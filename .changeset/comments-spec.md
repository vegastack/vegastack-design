---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Comments match the shared web/mobile spec. A 24px avatar 8px from the name, 4px from the name row to the body (or files), 6px from the body to the files, 12px between comments; thread cards have a 1px border, a light fill and 4px padding (`CommentThread` too). New `CommentMedia`: a comment's (or a draft's) images as a wrapping row of rounded previews up to 200px tall that open the `FileViewer`. The composer follows the mobile layout: paperclip on the left, Send on the right, both centred on the line and 6px in, on a light fill (`TextEdit`'s composer gains `leading`). Reaction pills always have a light border. `InlineChipPerson` takes `hue` (initials on the member's colour, as comment avatars) and `cardImage`; a person chip always leads with their avatar.

---
"@vegastack/ui": minor
---

🔧 `Attachment` now covers file and media tiles on any surface, not only chat. `AttachmentGroup` takes `layout="grid"` to wrap tiles into equal columns (the scrolling row stays the default), a new `AttachmentProgress` part shows a determinate upload bar built on `Progress` that announces its percentage, and `muted` dims the media of a file no longer in use. Image media now styles a nested `<img>`, so the system `Image` and its fallback fill the slot. The item now depends on `@vegastack/progress` (decision API-28).

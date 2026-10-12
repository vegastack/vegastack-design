---
"@vegastack/ui": patch
---

🔧 **Attachment**: `AttachmentGroup layout="cards"` (so `FileCard` and `UploadCard`) now wear the same surface as `MediaCard` — card background, border, radius, `p-2 pe-3` padding and the subtle hover — instead of a bare transparent row; `MediaCard` exports `RECORD_CARD_SURFACE_CLASS`, the one surface both share. Other layouts are unchanged.
[docs](https://design.vegastack.com/docs/components/attachment)

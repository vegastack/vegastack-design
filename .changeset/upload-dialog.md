---
"@vegastack/ui": patch
---

🧩 New `UploadDialog` (`UploadDialog`, `UploadDialogFileRow`) — the "Add files" modal: a drop zone with the staged files under it (thumbnail or file icon, name, size, ×), then Next to a per-file details view the host renders (`renderDetails`, `detailsValid`) and Add. Without `renderDetails` it adds straight from the staged list. `validate` refuses a file with a message and `maxFiles` caps the staged count. It stages files only — `onSubmit` hands them to the host's upload queue and the dialog closes. `AttachmentGroup` gains `layout="tiles"`: compact square tiles for forms, two per row on a phone and three from `sm` up.

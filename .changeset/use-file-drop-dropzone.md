---
"@vegastack/ui": minor
---

New `use-file-drop` hook and `dropzone` component (D4). The hook is the one file importing the
sanctioned `react-dropzone` engine — drag-depth handling, directory traversal, accept matching,
keyboard activation of the drop surface — and adds the system's vocabulary on top: the paste
path (`clipboardData.files`, the composer case) under the same accept/size/count constraints as
drop, typed `FileDropRejection` reasons aligned with `AttachmentState`, a polite announcement
payload that states WHY a file was refused, and the document-level missed-drop `preventDefault`
(`preventWindowDrop`). `Dropzone` is a deliberately thin shell over it: the surface is the named
focusable control (`role="button"`), the real `<input type="file">` behind it is the picker
bridge (the one reviewed raw-interactive exemption),
`data-dragging`/`data-drag-invalid` styling flags, and children compose `Empty bordered` for the
classic drop-zone look. No `attachments` prop by design — acquisition ends at a plain `File[]`
callback where `Attachment`'s state machine takes over. Dropzone is selected for cross-engine
smoke.

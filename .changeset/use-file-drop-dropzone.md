---
"@vegastack/ui": minor
---

New `use-file-drop` hook and `dropzone` component (D4). The hook is the one file importing the
sanctioned `react-dropzone` engine — drag-depth handling, directory traversal, accept matching,
keyboard-operable file input — and adds the system's vocabulary on top: the paste path
(`clipboardData.files`, the composer case), typed `FileDropRejection` reasons aligned with
`AttachmentState`, a polite announcement payload, and the window-level missed-drop
`preventDefault`. `Dropzone` is a deliberately thin shell over it: a real visually hidden
`<input type="file">` is the accessible control (the one reviewed raw-interactive exemption),
`data-dragging`/`data-drag-invalid` styling flags, and children compose `Empty bordered` for the
classic drop-zone look. No `attachments` prop by design — acquisition ends at a plain `File[]`
callback where `Attachment`'s state machine takes over. Dropzone is selected for cross-engine
smoke.

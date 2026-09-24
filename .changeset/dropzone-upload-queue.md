---
"@vegastack/ui": patch
---

📚 The Dropzone page gains an "Upload queue" example: accepted files upload through a host-owned `uploadFile(file, { onProgress, signal })` call and render as `Attachment` tiles in an `AttachmentGroup layout="grid"`, each with `AttachmentProgress`, cancel, retry and discard, while refused files join the queue as error tiles that say why.

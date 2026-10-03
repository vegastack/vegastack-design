---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 Add `UploadPanel`, `UploadItem` and `UploadGroup`, the `upload-progress` lib, and 25 file kinds in `file-kind`.

- `UploadPanel` is the uploads card pinned bottom-end: a header with the batch, time left and bytes, collapse and close; file rows with a thumbnail or file-type icon, a middle-truncated name that keeps its extension, a destination link (`onOpen`) and a state icon (clock, percentage ring with × on hover, spinner while finishing, check, alert with Retry, Choose file when interrupted); folder rows with aggregate progress that expand. Closing while uploads move asks first. A clean finish shrinks it into a done card that dismisses itself after 8 s, paused on hover or focus; failures stay. Below 768px (or with `compact`) it is a bar that opens the list in a bottom sheet. It publishes `--upload-panel-inset` while on screen.
- The `upload-progress` lib: `createRateEstimator` (EWMA of acknowledged bytes, alpha 0.15 over 1 s ticks, ignores the first 3 s, reports after 5 s and 2%, moves only on a 15% change), `formatTimeLeft` ("About 2 minutes left") and `formatBytesProgress` ("2.1 MB of 3.4 MB").
- `file-kind` adds the `data`, `json`, `config`, `script`, `cad`, `photometric`, `design`, `ebook`, `email`, `calendar`, `contact`, `key`, `encrypted` and `font` kinds, each with an icon, tint and label. CSV and TSV are now `data`, JSON is `json` and YAML is `config`; `rtf` is a document by extension and by MIME type, and a `.ts` labelled `video/mp2t` is code. `FileViewer` still reads all of these as text.
- The Toast stack's bottom positions rise by `--upload-panel-inset`, so a toast never covers the upload panel.

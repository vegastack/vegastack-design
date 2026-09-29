# Media players and file previews (Regent plan 12, Phase 6 — DS part)

**Date:** 30-09-2026 · **Approved by:** MK, in the audit-and-polish mandate of 30-09-2026 (Regent
repo `.vegastack/plans/modules-library/12-mandate-audit-polish.md`, Phase 6: "Viewer (DS): image,
PDF, video, audio, text/code, CSV (table), Markdown (rendered), Office → preview or clean download
card; video/audio players; range requests; poster frames; durations"). Findings and backlog items
1–4 of `research-reference-apps.md` in the same folder. **Branch:** `feat/media-previews` → PR →
patch release. **No new npm dependency.**

## Outcome

- **`VideoPlayer`** — `qualityOptions` defaults to `[]`, so the Quality entry is hidden (one stored
  file has one rendition); a media error shows "Can’t play this video here" with a Download
  button (`downloadHref`, `loadErrorLabel`, `downloadLabel`) in place of the transport;
  `onSourceExpired` renews an expired signed URL once and resumes at the same position — the
  same contract as `AudioPlayer`'s; `poster` is a documented prop; it never autoplays.
- **`AudioPlayer`** — `peaks` draws a stored waveform without fetching the file; without it the
  waveform variant decodes only up to `maxDecodeBytes` (20 MB, by `Content-Length` or while
  streaming) and shows the plain seek slider above that. A renewal returning the same URL reloads.
- **`FileViewer`** — new stages `text` (plain/code, first 1 MB via `Range`), `table` (CSV/TSV with
  a built-in RFC 4180 `parseCsv`; header row; ≤ 500 rows; "Showing first 500 rows"), `markdown`
  (`MarkdownView`, lazily loaded; MDX never executed), `html` and `card` (thumbnail or icon, name,
  size, facts, primary Download). `loadPreview(item, { signal })` returns a `FileViewerPreview`
  (`text | table | markdown | html | card`) or `null` for the built-in reading. Items gain
  `refreshSrc` and `peaks`; video letterboxes (`object-contain`); ←/→ paging, Esc and the pause on
  paging stay. `data-kind` names the stage on screen; the plain card is `card` (was `other`).
- **`file-kind`** — `text/plain` is generic (the extension decides); `.mdx`, `.toml`, `.ini`,
  `.jsonc` mapped.
- **New lib `media-probe`** (browser-only, dependency-free) — `probeVideo` (duration, size, JPEG
  poster at ~1 s via video + canvas), `probeAudio` (duration, ≤ 200 peaks via
  `OfflineAudioContext`, skipped over 50 MB), `extractPptxThumbnail` (`docProps/thumbnail.jpeg`
  via a zip central-directory reader and `DecompressionStream`).

## Rules and edge cases

- Text reads ask `Range: bytes=0-1048575`; a server that ignores it costs no more (the stream is
  cancelled at 1 MB). A truncated read ends at its last whole line and says so.
- A failed read (network, CORS, 404) is the card; a `loadPreview` rejection falls back to the
  built-in reading; paging aborts the signal.
- HTML from `loadPreview` is rebuilt through `MarkdownView`'s allowlist, never injected.
- Office parsing (SheetJS, mammoth) stays in the app behind `loadPreview` — a DS dependency would
  be a new MK decision.

## Artefacts

Source + tests (`video-player`, `audio-player`, `file-viewer`, `file-kind`, `media-probe`), docs
pages and previews for every kind (image, PDF, video, audio, text, CSV, Markdown, card with and
without a thumbnail, `loadPreview`), registry items, contract records + `pnpm design:derived`, a
patch changeset, `pnpm verify`.

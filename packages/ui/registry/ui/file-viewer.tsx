// @vegastack file-viewer@0.24.0 sha256-4g3xjDgovxJprKeqft3av1+9htbiBj2GGS8wlDbbfG8=

"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@vegastack/design";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  XIcon,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Spinner } from "@/components/ui/spinner";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { useModalInert } from "@/components/ui/use-modal-inert";
import { VideoPlayer } from "@/components/ui/video-player";
import { FileTypeIcon, fileKindOf, formatBytes } from "@/lib/file-kind";

/* ---
`FileViewer` is the full-screen look at a stored file: an image you can zoom and pan, a PDF you
can scroll page by page, a video or audio file in the system's players, the first megabyte of a
text, CSV or Markdown file, an Excel or Word file — or, for anything else, a card with its name, size, a preview picture
when it has one, and a Download button. It is a controlled overlay over a list of files (`index`
opens it at one, `null` closes it), so a gallery of `Attachment` tiles, a product's files or a
message's attachments all open it the same way.

The stage is always dark whatever the page theme: the popup carries the `dark` theme class, so
its buttons and ink resolve against the dark tokens, and the scrim is upstream's `bg-black/…`
vocabulary under an opaque dark `background`. PDF rendering is the one heavy part and lives in `file-viewer-pdf.tsx`, loaded with
`React.lazy` the first time a PDF is shown — pdf.js never loads for an image gallery.

A video or audio file with a `src` plays on the stage in the system's own `VideoPlayer` /
`AudioPlayer`, which pause when the viewer pages away or closes; neither autoplays.

A text, CSV or Markdown file with a `src` is read here — its first 1 MB, with a `Range` request —
and shown as text, a table (a small built-in CSV parser; the first 500 rows) or rendered
Markdown. An Excel workbook or a Word `.docx` with a `src` (up to 20 MB) is read by
`file-viewer-office.ts`, imported the first time one opens, which imports SheetJS or mammoth in
turn: a workbook shows a tab per sheet over the same table (the first 500 rows of each), a
document shows mammoth's HTML rebuilt through `MarkdownView`'s allowlist. A larger file, or one
that fails to read, shows the Download card. Anything else — a slide deck — is the app's to
parse: `loadPreview` hands back text, a table, a workbook, HTML or a richer card.

Deliberately NOT done here: signing URLs (the caller passes resolved `src`/`pdfSrc`/
`downloadHref`, and `refreshSrc` renews an expired one), other Office formats, syntax
highlighting, and wrap-around paging.
--- */

/** One file the viewer can show. */
export type FileViewerItem = {
  /** Stable id — keys the stage, so zoom and scroll reset when the file changes. */
  id: string;
  /** The file name: the dialog's title and the image's alt text. */
  name: string;
  /**
   * MIME type. `image/*` shows the image, `application/pdf` the PDF, `video/*` and `audio/*` a
   * player (given `src`), anything else the file card.
   */
  contentType: string | null;
  /** Size in bytes, shown on the file card ("2.4 MB"). */
  size?: number | null;
  /**
   * The small preview: a blurred placeholder while the full image loads, a PDF's loading frame,
   * a video's poster, and the picture on a file card (an Office file's embedded thumbnail).
   */
  thumb?: { src: string; srcSet?: string; blur?: string | null } | null;
  /**
   * Full-size image URL (falls back to `thumb.src`); the video or audio file's URL; or a text,
   * CSV or Markdown file's URL, whose first 1 MB the viewer reads with a `Range` request.
   */
  src?: string | null;
  /** Full-size `srcset`, so the browser picks the largest variant the screen needs. Falls back to `thumb.srcSet`. */
  srcSet?: string | null;
  /** An inline-disposition URL for a PDF, served with range requests. Without it a PDF shows the file card. */
  pdfSrc?: string | null;
  /** The download URL (attachment disposition). */
  downloadHref: string;
  /**
   * Resolve a fresh `src` when a video's or audio file's signed URL has expired; the player
   * calls it once and resumes where it stopped (its `onSourceExpired`).
   */
  refreshSrc?: () => Promise<string>;
  /**
   * An audio file's precomputed waveform (`probeAudio` from `media-probe`). With it the audio
   * plays in the waveform player, without downloading the file to decode it.
   */
  peaks?: readonly number[] | null;
};

/**
 * Content the app parsed for a file the viewer cannot read itself — what `loadPreview` returns.
 * `text` shows monospaced; `table` rows (the first is the header) show as a table of at most 500
 * rows; `markdown` and `html` render through `MarkdownView` (HTML is rebuilt through its
 * allowlist, never injected); `card` is the file card with a picture and facts ("12 slides").
 */
export type FileViewerPreview =
  | { kind: "text"; text: string; truncated?: boolean }
  | {
      kind: "table";
      rows: readonly (readonly string[])[];
      /** Data rows in the whole file, when known: "Showing first 500 of 12,400 rows". */
      totalRows?: number;
      truncated?: boolean;
    }
  | { kind: "markdown"; markdown: string; truncated?: boolean }
  | { kind: "html"; html: string }
  | {
      kind: "workbook";
      /** Each sheet's rows (the first is the header); at most 500 data rows show per sheet. */
      sheets: readonly {
        name: string;
        rows: readonly (readonly string[])[];
        totalRows?: number;
      }[];
    }
  | { kind: "card"; thumb?: string | null; facts?: readonly string[] };

/** Props accepted by `FileViewer`. */
export interface FileViewerProps {
  /** The files to page through, in order. */
  items: readonly FileViewerItem[];
  /** The open file's index; `null` closes the viewer. */
  index: number | null;
  /** Called with the next index when the user pages (arrows, buttons, swipe). */
  onIndexChange: (index: number) => void;
  /** Called with `false` when the user closes it (Esc, ×, swipe down) — set `index` to `null`. */
  onOpenChange: (open: boolean) => void;
  /**
   * Parse a file the viewer has no stage for — an Office file with SheetJS or mammoth, say — and
   * return what to show. Called for every file that is not an image, PDF, video or audio; return
   * `null` to keep the built-in text, CSV and Markdown reading or the plain file card. The signal
   * aborts when the user pages away.
   * @default undefined
   */
  loadPreview?: (
    item: FileViewerItem,
    options: { signal: AbortSignal },
  ) => Promise<FileViewerPreview | null | undefined>;
  /**
   * Extra top-bar controls for the open file, placed before Download — a "Details" button that
   * opens the file's page, say. Pass ghost `Button`s with an icon, a `<span>` label and an
   * `aria-label`: below `sm` the viewer keeps them at icon size (the label is visually hidden).
   * @default undefined
   */
  actions?: (item: FileViewerItem) => React.ReactNode;
}

type Kind =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "text"
  | "table"
  | "markdown"
  | "html"
  | "workbook"
  | "word"
  | "card";
type ReadKind = "text" | "table" | "markdown" | "workbook" | "word";

/** The first megabyte of a text, CSV or Markdown file is what the viewer reads. */
const PREVIEW_BYTES = 1024 * 1024;
/** The most data rows the table shows. */
const TABLE_ROWS = 500;
type ZoomOp = "in" | "out" | "reset";

// Markdown and HTML previews load the renderer (and its `marked` lexer) the first time one shows.
const LazyMarkdown = React.lazy(() =>
  import("@/components/ui/markdown-view").then((module) => ({
    default: module.MarkdownView,
  })),
);

// Excel and Word files load their reader (and, inside it, SheetJS or mammoth) only when one opens.
const loadOffice = () => import("@/components/ui/file-viewer-office");

const LazyPdf = React.lazy(() =>
  import("@/components/ui/file-viewer-pdf").then((module) => ({
    default: module.FileViewerPdf,
  })),
);

/** A text file the viewer reads itself, by extension first (browsers mislabel these), then type. */
function readKindOf(item: FileViewerItem): ReadKind | null {
  const dot = item.name.lastIndexOf(".");
  const extension = dot > 0 ? item.name.slice(dot + 1).toLowerCase() : "";
  const type = (item.contentType ?? "").split(";")[0]!.trim().toLowerCase();
  if (
    extension === "csv" ||
    extension === "tsv" ||
    type === "text/csv" ||
    type === "text/tab-separated-values"
  )
    return "table";
  if (
    extension === "md" ||
    extension === "markdown" ||
    extension === "mdx" ||
    /^text\/(x-)?(markdown|mdx)$/.test(type)
  )
    return "markdown";
  if (
    ["xlsx", "xlsm", "xls", "ods"].includes(extension) ||
    /^application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.oasis\.opendocument\.spreadsheet)$/.test(
      type,
    )
  )
    return "workbook";
  if (
    extension === "docx" ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "word";
  const kind = fileKindOf(item.contentType, item.name);
  if (
    kind === "code" ||
    kind === "json" ||
    kind === "config" ||
    kind === "script" ||
    kind === "text"
  )
    return "text";
  return null;
}

function kindOf(item: FileViewerItem): Kind {
  const kind = fileKindOf(item.contentType, item.name);
  if (kind === "image" && (item.src || item.thumb?.src)) return "image";
  if (kind === "pdf" && item.pdfSrc) return "pdf";
  if ((kind === "video" || kind === "audio") && item.src) return kind;
  if (item.src) return readKindOf(item) ?? "card";
  return "card";
}

const KIND_LABEL: Record<Kind, string> = {
  image: "Image",
  pdf: "PDF",
  video: "Video",
  audio: "Audio",
  text: "Text",
  table: "Table",
  markdown: "Document",
  html: "Document",
  workbook: "Spreadsheet",
  word: "Document",
  card: "File",
};

/**
 * Parse CSV (RFC 4180) into rows of fields: quoted fields with `,`, line breaks and `""` escapes
 * inside, CRLF or LF rows, a leading byte-order mark, and the delimiter sniffed from the first
 * line (`,`, `;` or a tab) unless given. Blank lines are skipped. Stops after `maxRows` rows and
 * reports whether more followed.
 *
 * @example
 * parseCsv('name,notes\n"Ada","said ""hi"", twice"');
 * // { rows: [["name", "notes"], ["Ada", 'said "hi", twice']], truncated: false }
 */
export function parseCsv(
  text: string,
  {
    delimiter,
    maxRows = Number.POSITIVE_INFINITY,
  }: { delimiter?: string; maxRows?: number } = {},
): { rows: string[][]; truncated: boolean } {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const separator = delimiter ?? sniffDelimiter(source);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let fieldStarted = false;
  const endRow = () => {
    row.push(field);
    // A blank line is one empty, unquoted field: skip it.
    if (row.length > 1 || fieldStarted || field !== "") rows.push(row);
    row = [];
    field = "";
    fieldStarted = false;
  };
  let i = 0;
  while (i < source.length) {
    const char = source[i]!;
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
      } else field += char;
      i++;
      continue;
    }
    if (char === '"' && field === "") {
      quoted = true;
      fieldStarted = true;
      i++;
    } else if (char === separator) {
      row.push(field);
      field = "";
      fieldStarted = true;
      i++;
    } else if (char === "\n" || char === "\r") {
      endRow();
      i += char === "\r" && source[i + 1] === "\n" ? 2 : 1;
      if (rows.length >= maxRows)
        return { rows, truncated: source.slice(i).trim() !== "" };
    } else {
      field += char;
      i++;
    }
  }
  if (field !== "" || row.length > 0 || fieldStarted) endRow();
  if (rows.length > maxRows)
    return { rows: rows.slice(0, maxRows), truncated: true };
  return { rows, truncated: false };
}

/** The candidate delimiter that appears most often, outside quotes, on the first line. */
function sniffDelimiter(source: string): string {
  const counts = new Map<string, number>([
    [",", 0],
    [";", 0],
    ["\t", 0],
  ]);
  let quoted = false;
  for (let i = 0; i < source.length && i < 64 * 1024; i++) {
    const char = source[i]!;
    if (char === '"') quoted = !quoted;
    else if (!quoted && (char === "\n" || char === "\r")) break;
    else if (!quoted && counts.has(char))
      counts.set(char, counts.get(char)! + 1);
  }
  let best = ",";
  for (const [candidate, count] of counts)
    if (count > counts.get(best)!) best = candidate;
  return best;
}

/**
 * Read the first `PREVIEW_BYTES` of a file as UTF-8 text, asking for just that range. A server
 * that ignores the range still costs no more than that: the rest is never read. A truncated read
 * ends at its last complete line.
 */
async function readTextHead(
  url: string,
  size: number | null | undefined,
  signal: AbortSignal,
): Promise<{ text: string; truncated: boolean }> {
  const response = await fetch(url, {
    headers: { Range: `bytes=0-${PREVIEW_BYTES - 1}` },
    signal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const total = Number(response.headers.get("content-range")?.split("/")[1]);
  const chunks: Uint8Array[] = [];
  let length = 0;
  let more = false;
  const reader = response.body?.getReader();
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      length += value.byteLength;
      if (length >= PREVIEW_BYTES) {
        const { done: ended } =
          length > PREVIEW_BYTES ? { done: false } : await reader.read();
        more = length > PREVIEW_BYTES || !ended;
        void reader.cancel().catch(() => {});
        break;
      }
    }
  } else {
    const all = new Uint8Array(await response.arrayBuffer());
    chunks.push(all);
    length = all.byteLength;
    more = length > PREVIEW_BYTES;
  }
  const bytes = new Uint8Array(Math.min(length, PREVIEW_BYTES));
  let offset = 0;
  for (const chunk of chunks) {
    if (offset >= bytes.length) break;
    const part = chunk.subarray(0, bytes.length - offset);
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  const truncated =
    more ||
    (size ?? 0) > PREVIEW_BYTES ||
    (Number.isFinite(total) && total > PREVIEW_BYTES) ||
    (response.status === 206 &&
      !Number.isFinite(total) &&
      bytes.length >= PREVIEW_BYTES);
  // `TextDecoder` drops a leading byte-order mark and never throws on a split character.
  let text = new TextDecoder().decode(bytes);
  if (truncated) {
    const cut = text.lastIndexOf("\n");
    if (cut > 0) text = text.slice(0, cut);
  }
  return { text: text.replace(/\r\n?/g, "\n"), truncated };
}

/** The built-in preview of a text, CSV, Markdown, Excel or Word file. */
async function readPreview(
  item: FileViewerItem,
  kind: ReadKind,
  signal: AbortSignal,
): Promise<FileViewerPreview> {
  if (kind === "workbook") {
    const office = await loadOffice();
    const sheets = await office.readWorkbook(
      item.src ?? "",
      item.size,
      signal,
      TABLE_ROWS,
    );
    return { kind: "workbook", sheets };
  }
  if (kind === "word") {
    const office = await loadOffice();
    const html = await office.readWordDocument(
      item.src ?? "",
      item.size,
      signal,
    );
    return { kind: "html", html };
  }
  const { text, truncated } = await readTextHead(
    item.src ?? "",
    item.size,
    signal,
  );
  if (kind === "table") {
    const tab = /\.tsv$/i.test(item.name) ? "\t" : undefined;
    const parsed = parseCsv(text, { delimiter: tab, maxRows: TABLE_ROWS + 1 });
    return {
      kind: "table",
      rows: parsed.rows,
      truncated: truncated || parsed.truncated,
    };
  }
  if (kind === "markdown")
    return { kind: "markdown", markdown: text, truncated };
  return { kind: "text", text, truncated };
}

/** Warm the browser cache for a neighbouring image, at the variant the stage will ask for. */
function preload(item: FileViewerItem | undefined) {
  if (!item || kindOf(item) !== "image" || typeof window === "undefined")
    return;
  const img = new window.Image();
  img.decoding = "async";
  img.sizes = "100vw";
  const srcSet = item.srcSet ?? item.thumb?.srcSet;
  if (srcSet) img.srcset = srcSet;
  img.src = item.src ?? item.thumb?.src ?? "";
}

type Swipe = "prev" | "next" | "close";

/**
 * One-finger swipe on an unzoomed stage: left/right pages, down closes. The offset drags the
 * content along for feedback and snaps back on release.
 */
function useSwipe(onSwipe: (direction: Swipe) => void) {
  const start = React.useRef<{ id: number; x: number; y: number } | null>(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const begin = (event: React.PointerEvent) => {
    start.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const move = (event: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== event.pointerId) return;
    const dx = event.clientX - s.x;
    const dy = event.clientY - s.y;
    setOffset(
      Math.abs(dx) >= Math.abs(dy)
        ? { x: dx, y: 0 }
        : { x: 0, y: Math.max(0, dy) },
    );
  };
  const end = (event: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== event.pointerId) return 0;
    start.current = null;
    const dx = event.clientX - s.x;
    const dy = event.clientY - s.y;
    setOffset({ x: 0, y: 0 });
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
      onSwipe(dx < 0 ? "next" : "prev");
    else if (dy > 100 && dy > Math.abs(dx) * 1.5) onSwipe("close");
    return Math.hypot(dx, dy);
  };
  const cancel = () => {
    start.current = null;
    setOffset({ x: 0, y: 0 });
  };
  return { offset, begin, move, end, cancel };
}

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

type View = { s: number; x: number; y: number };

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface StageProps {
  item: FileViewerItem;
  onSwipe: (direction: Swipe) => void;
  zoomRef: React.RefObject<((op: ZoomOp) => void) | null>;
}

/**
 * The image stage: fit to the viewport, the blurred thumb fading into the full image. Double-click
 * or double-tap zooms to 2.5× at the pointer, pinch zooms, a drag pans while zoomed, and
 * ctrl/⌘+wheel (a trackpad pinch) zooms. Unzoomed, a swipe pages or closes.
 */
function ImageStage({
  item,
  onSwipe,
  zoomRef,
  onFail,
}: StageProps & { onFail: () => void }) {
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const [view, setView] = React.useState<View>({ s: 1, x: 0, y: 0 });
  const [gesturing, setGesturing] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const viewRef = React.useRef(view);
  viewRef.current = view;
  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const gesture = React.useRef<
    | { kind: "pan"; x: number; y: number; from: View }
    | { kind: "pinch"; dist: number; mid: { x: number; y: number }; from: View }
    | { kind: "swipe" }
    | null
  >(null);
  const lastTap = React.useRef({ t: 0, x: 0, y: 0 });
  const swipe = useSwipe(onSwipe);

  const clampView = React.useCallback((next: View): View => {
    const el = stageRef.current;
    const s = clampNumber(next.s, 1, MAX_SCALE);
    if (!el || s === 1) return { s, x: 0, y: 0 };
    const maxX = (el.clientWidth * (s - 1)) / 2;
    const maxY = (el.clientHeight * (s - 1)) / 2;
    return {
      s,
      x: clampNumber(next.x, -maxX, maxX),
      y: clampNumber(next.y, -maxY, maxY),
    };
  }, []);

  /** Point relative to the stage's centre — the transform origin. */
  const local = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
  };

  /** Zoom to `s` keeping the content under `at` where it is. */
  const zoomAt = React.useCallback(
    (from: View, s: number, at: { x: number; y: number }) => {
      const qx = (at.x - from.x) / from.s;
      const qy = (at.y - from.y) / from.s;
      return clampView({ s, x: at.x - qx * s, y: at.y - qy * s });
    },
    [clampView],
  );

  const toggleAt = (at: { x: number; y: number }) =>
    setView((v) =>
      v.s > 1 ? { s: 1, x: 0, y: 0 } : zoomAt(v, DOUBLE_TAP_SCALE, at),
    );

  React.useEffect(() => {
    zoomRef.current = (op) =>
      setView((v) =>
        op === "reset"
          ? { s: 1, x: 0, y: 0 }
          : zoomAt(v, op === "in" ? v.s * 1.5 : v.s / 1.5, { x: 0, y: 0 }),
      );
    return () => {
      zoomRef.current = null;
    };
  }, [zoomRef, zoomAt]);

  // ctrl/⌘+wheel is how a trackpad pinch arrives; a plain wheel pans while zoomed. Native and
  // non-passive, because React's wheel listener cannot cancel the page zoom.
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const v = viewRef.current;
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const rect = el.getBoundingClientRect();
        const at = {
          x: event.clientX - rect.left - rect.width / 2,
          y: event.clientY - rect.top - rect.height / 2,
        };
        setView(zoomAt(v, v.s * Math.exp(-event.deltaY * 0.01), at));
      } else if (v.s > 1) {
        event.preventDefault();
        setView(
          clampView({ ...v, x: v.x - event.deltaX, y: v.y - event.deltaY }),
        );
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, clampView]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const points = [...pointers.current.values()];
    if (points.length === 2) {
      swipe.cancel();
      const [a, b] = points as [
        { x: number; y: number },
        { x: number; y: number },
      ];
      gesture.current = {
        kind: "pinch",
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        mid: local((a.x + b.x) / 2, (a.y + b.y) / 2),
        from: viewRef.current,
      };
      setGesturing(true);
    } else if (points.length === 1) {
      if (viewRef.current.s > 1) {
        gesture.current = {
          kind: "pan",
          x: event.clientX,
          y: event.clientY,
          from: viewRef.current,
        };
        setGesturing(true);
      } else if (event.pointerType !== "mouse") {
        gesture.current = { kind: "swipe" };
        swipe.begin(event);
        setGesturing(true);
      }
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pinch") {
      const [a, b] = [...pointers.current.values()] as [
        { x: number; y: number },
        { x: number; y: number },
      ];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = local((a.x + b.x) / 2, (a.y + b.y) / 2);
      const s = clampNumber((g.from.s * dist) / g.dist, 1, MAX_SCALE);
      const qx = (g.mid.x - g.from.x) / g.from.s;
      const qy = (g.mid.y - g.from.y) / g.from.s;
      setView(clampView({ s, x: mid.x - qx * s, y: mid.y - qy * s }));
    } else if (g.kind === "pan") {
      setView(
        clampView({
          s: g.from.s,
          x: g.from.x + event.clientX - g.x,
          y: g.from.y + event.clientY - g.y,
        }),
      );
    } else {
      swipe.move(event);
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    let moved = 0;
    if (g?.kind === "swipe") moved = swipe.end(event);
    const remaining = [...pointers.current.entries()][0];
    if (g?.kind === "pinch" && remaining) {
      // One finger left after a pinch keeps panning from where the pinch ended.
      gesture.current = {
        kind: "pan",
        x: remaining[1].x,
        y: remaining[1].y,
        from: viewRef.current,
      };
      return;
    }
    gesture.current = null;
    setGesturing(false);
    // Double-tap (touch and pen; a mouse gets `dblclick`).
    if (event.pointerType !== "mouse" && g?.kind !== "pinch" && moved < 10) {
      const now = event.timeStamp;
      const tap = lastTap.current;
      if (
        now - tap.t < 300 &&
        Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 30
      ) {
        lastTap.current = { t: 0, x: 0, y: 0 };
        toggleAt(local(event.clientX, event.clientY));
      } else {
        lastTap.current = { t: now, x: event.clientX, y: event.clientY };
      }
    }
  };

  const src = item.src ?? item.thumb?.src ?? undefined;
  const srcSet = item.srcSet ?? item.thumb?.srcSet ?? undefined;
  const placeholder = item.thumb?.blur ?? item.thumb?.src ?? undefined;
  const zoomed = view.s > 1;

  return (
    <div
      ref={stageRef}
      data-slot="file-viewer-image"
      data-zoomed={zoomed ? "" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={(event) => toggleAt(local(event.clientX, event.clientY))}
      className={cn(
        "relative size-full touch-none overflow-hidden select-none",
        zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
      )}
    >
      <div
        className={cn(
          "size-full will-change-transform",
          !gesturing && "transition-transform duration-200 ease-out",
        )}
        style={{
          transform: `translate3d(${view.x + swipe.offset.x}px, ${view.y + swipe.offset.y}px, 0) scale(${view.s})`,
        }}
      >
        <Image
          src={src}
          srcSet={srcSet}
          sizes="100vw"
          alt={item.name}
          placeholder={placeholder}
          priority
          rounded="none"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={onFail}
          className="size-full bg-transparent [&_[data-slot=image-img]]:object-contain [&_[data-slot=image-placeholder]]:scale-100 [&_[data-slot=image-placeholder]]:bg-contain [&_[data-slot=image-placeholder]]:bg-no-repeat [&_[data-slot=image-skeleton]]:hidden"
        />
      </div>
      {!loaded && !placeholder ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
}

/** Drag a stage's content along with a swipe, snapping back when it ends. */
function swipeStyle(offset: { x: number; y: number }): React.CSSProperties {
  return { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` };
}

/**
 * The file card — anything with no richer preview: the file's picture when it has one (an Office
 * file's embedded thumbnail) or its type icon, the name, the size and any facts ("12 slides"),
 * and Download as the one primary action.
 */
function CardStage({
  item,
  thumb,
  facts,
  onSwipe,
}: {
  item: FileViewerItem;
  thumb?: string | null;
  facts?: readonly string[];
  onSwipe: (direction: Swipe) => void;
}) {
  const swipe = useSwipe(onSwipe);
  const picture = thumb ?? item.thumb?.src ?? null;
  const details = [
    ...(item.size != null ? [formatBytes(item.size)] : []),
    ...(facts ?? []),
  ].join(" · ");
  return (
    <div
      data-slot="file-viewer-file"
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse") swipe.begin(event);
      }}
      onPointerMove={swipe.move}
      onPointerUp={swipe.end}
      onPointerCancel={swipe.cancel}
      className="flex size-full touch-none items-center justify-center p-6"
    >
      <div
        className={cn(
          "flex max-w-sm min-w-0 flex-col items-center gap-3 text-center",
          swipe.offset.x === 0 &&
            swipe.offset.y === 0 &&
            "transition-transform duration-200 ease-out",
        )}
        style={swipeStyle(swipe.offset)}
      >
        {picture ? (
          <Image
            src={picture}
            alt=""
            rounded="lg"
            draggable={false}
            data-slot="file-viewer-file-thumb"
            className="aspect-4/3 w-72 max-w-full border border-border bg-card [&_[data-slot=image-img]]:object-contain"
          />
        ) : (
          <FileTypeIcon
            contentType={item.contentType}
            name={item.name}
            className="size-16"
          />
        )}
        <div className="flex max-w-full min-w-0 flex-col gap-1">
          <p className="text-base font-medium wrap-anywhere">{item.name}</p>
          {details ? (
            <p className="text-sm text-muted-foreground tabular-nums">
              {details}
            </p>
          ) : null}
        </div>
        <a
          href={item.downloadHref}
          download
          className={cn(
            buttonVariants({ variant: "default" }),
            "mt-2 pointer-coarse:h-11 pointer-coarse:px-4",
          )}
        >
          <DownloadIcon data-icon="inline-start" />
          Download
        </a>
      </div>
    </div>
  );
}

/** The line under a preview that says it is not the whole file. */
function PreviewNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      data-slot="file-viewer-note"
      className="shrink-0 text-sm text-muted-foreground tabular-nums"
    >
      {children}
    </p>
  );
}

const FIRST_MB = "Showing the first 1 MB. Download the file to see all of it.";

/**
 * The shell every read preview sits in: a scrollable sheet, keyboard-focusable and named, with the
 * note below it. A horizontal swipe still pages; vertical drags scroll.
 */
function SheetStage({
  item,
  slot,
  note,
  onSwipe,
  children,
  sheetClassName,
}: {
  item: FileViewerItem;
  slot: string;
  note?: React.ReactNode;
  onSwipe: (direction: Swipe) => void;
  children: React.ReactNode;
  sheetClassName?: string;
}) {
  const swipe = useSwipe((direction) => {
    if (direction !== "close") onSwipe(direction);
  });
  return (
    <div
      data-slot={slot}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse") swipe.begin(event);
      }}
      onPointerMove={swipe.move}
      onPointerUp={swipe.end}
      onPointerCancel={swipe.cancel}
      className="flex size-full touch-pan-y flex-col items-center gap-2 px-4 pb-4 pointer-fine:px-20"
    >
      <div
        role="region"
        aria-label={`${item.name} preview`}
        tabIndex={0}
        className={cn(
          "min-h-0 w-full max-w-5xl overflow-auto rounded-lg border border-border bg-card text-card-foreground focus-visible:-outline-offset-2",
          sheetClassName,
        )}
        style={
          swipe.offset.x ? swipeStyle({ x: swipe.offset.x, y: 0 }) : undefined
        }
      >
        {children}
      </div>
      {note ? <PreviewNote>{note}</PreviewNote> : null}
    </div>
  );
}

/** Rows of a table preview: the first is the header; at most `TABLE_ROWS` data rows show. */
function TableStage({
  item,
  preview,
  onSwipe,
  before,
  moreNote,
}: {
  item: FileViewerItem;
  preview: Extract<FileViewerPreview, { kind: "table" }>;
  onSwipe: (direction: Swipe) => void;
  /** Above the table — a workbook's sheet tabs. */
  before?: React.ReactNode;
  /** The note when rows are cut, in place of the row count. */
  moreNote?: React.ReactNode;
}) {
  const [head = [], ...body] = preview.rows;
  const rows = body.slice(0, TABLE_ROWS);
  const columns = rows.reduce(
    (most, row) => Math.max(most, row.length),
    head.length,
  );
  const cells = (row: readonly string[]) =>
    Array.from({ length: columns }, (_, index) => row[index] ?? "");
  const more =
    preview.truncated ||
    body.length > rows.length ||
    (preview.totalRows ?? 0) > rows.length;
  const count = rows.length.toLocaleString();
  const note = !more
    ? null
    : moreNote
      ? moreNote
      : preview.totalRows && preview.totalRows > rows.length
        ? `Showing first ${count} of ${preview.totalRows.toLocaleString()} rows`
        : `Showing first ${count} rows`;
  if (columns === 0)
    return (
      <>
        {before}
        <SheetStage item={item} slot="file-viewer-table" onSwipe={onSwipe}>
          <p className="p-4 text-sm text-muted-foreground">
            This file is empty.
          </p>
        </SheetStage>
      </>
    );
  return (
    <div
      data-slot="file-viewer-table"
      className="flex size-full flex-col items-center gap-2 px-4 pb-4 pointer-fine:px-20"
    >
      {before}
      {/* One named, focusable scroller for both axes, so the header can stick to its top. */}
      <div
        role="region"
        aria-label={`${item.name} preview`}
        tabIndex={0}
        className="max-h-full min-h-0 w-auto max-w-full shrink overflow-auto rounded-lg border border-border bg-card text-card-foreground focus-visible:-outline-offset-2"
      >
        <table className="w-max min-w-full caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              {cells(head).map((cell, index) => (
                <TableHead
                  key={index}
                  scope="col"
                  className="max-w-96 truncate"
                >
                  {cell}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {cells(row).map((cell, index) => (
                  <TableCell
                    key={index}
                    className="max-w-96 align-top whitespace-pre-wrap wrap-anywhere"
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>
      {note ? <PreviewNote>{note}</PreviewNote> : null}
    </div>
  );
}

/**
 * A workbook: a tab per sheet above the CSV preview's table, each sheet cut at its first
 * `TABLE_ROWS` rows with "Showing the first 500 rows · Download".
 */
function WorkbookStage({
  item,
  preview,
  onSwipe,
}: {
  item: FileViewerItem;
  preview: Extract<FileViewerPreview, { kind: "workbook" }>;
  onSwipe: (direction: Swipe) => void;
}) {
  const [active, setActive] = React.useState(0);
  const sheet = preview.sheets[active] ?? preview.sheets[0];
  const tabs =
    preview.sheets.length > 1 ? (
      <Tabs
        value={active}
        onValueChange={(value) => setActive(Number(value))}
        className="w-full max-w-full shrink-0 items-center"
      >
        <TabsList
          data-slot="file-viewer-sheets"
          aria-label={`Sheets in ${item.name}`}
          className="max-w-full overflow-x-auto"
        >
          {preview.sheets.map((entry, index) => (
            <TabsTrigger key={index} value={index}>
              {entry.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    ) : null;
  return (
    <TableStage
      key={active}
      item={item}
      preview={{
        kind: "table",
        rows: sheet?.rows ?? [],
        totalRows: sheet?.totalRows,
      }}
      onSwipe={onSwipe}
      before={tabs}
      moreNote={
        <>
          Showing the first {TABLE_ROWS.toLocaleString()} rows ·{" "}
          <a
            href={item.downloadHref}
            download
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Download
          </a>
        </>
      }
    />
  );
}

/**
 * Everything that is not an image, a PDF, video or audio: the app's `loadPreview` first, then the
 * built-in reading of a text, CSV or Markdown file, and the file card when neither has anything.
 * Reports what it settled on, so the viewer's `data-kind` names the stage on screen.
 */
function PreviewStage({
  item,
  kind,
  loadPreview,
  onSwipe,
  onResolve,
}: {
  item: FileViewerItem;
  kind: ReadKind | "card";
  loadPreview: FileViewerProps["loadPreview"];
  onSwipe: (direction: Swipe) => void;
  onResolve: (kind: Kind) => void;
}) {
  const immediate = kind === "card" && !loadPreview;
  const [preview, setPreview] = React.useState<FileViewerPreview | null>(
    immediate ? { kind: "card" } : null,
  );
  // Read through refs: a host that rebuilds its items (or passes an inline `loadPreview`) on
  // every render must not refetch. The stage is keyed by the item's id.
  const itemRef = React.useRef(item);
  const loadRef = React.useRef(loadPreview);
  const resolveRef = React.useRef(onResolve);
  React.useLayoutEffect(() => {
    itemRef.current = item;
    loadRef.current = loadPreview;
    resolveRef.current = onResolve;
  });
  React.useEffect(() => {
    if (immediate) return;
    const controller = new AbortController();
    const { signal } = controller;
    void (async () => {
      const current = itemRef.current;
      let next: FileViewerPreview | null | undefined = null;
      const load = loadRef.current;
      if (load) next = await load(current, { signal }).catch(() => null);
      if (!next && kind !== "card" && !signal.aborted)
        next = await readPreview(current, kind, signal).catch(() => null);
      if (signal.aborted) return;
      setPreview(next ?? { kind: "card" });
    })();
    return () => controller.abort();
  }, [immediate, kind]);
  React.useEffect(() => {
    if (preview) resolveRef.current(preview.kind);
  }, [preview]);

  if (!preview)
    return (
      <div
        data-slot="file-viewer-loading"
        className="flex size-full items-center justify-center"
      >
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  switch (preview.kind) {
    case "text":
      return (
        <SheetStage
          item={item}
          slot="file-viewer-text"
          onSwipe={onSwipe}
          note={preview.truncated ? FIRST_MB : null}
        >
          {preview.text ? (
            <pre className="p-4 font-mono text-sm whitespace-pre-wrap wrap-anywhere">
              {preview.text}
            </pre>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              This file is empty.
            </p>
          )}
        </SheetStage>
      );
    case "table":
      return <TableStage item={item} preview={preview} onSwipe={onSwipe} />;
    case "workbook":
      return <WorkbookStage item={item} preview={preview} onSwipe={onSwipe} />;
    case "markdown":
    case "html": {
      const source = preview.kind === "html" ? preview.html : preview.markdown;
      return (
        <SheetStage
          item={item}
          slot={`file-viewer-${preview.kind}`}
          onSwipe={onSwipe}
          sheetClassName="max-w-3xl"
          note={
            preview.kind === "markdown" && preview.truncated ? FIRST_MB : null
          }
        >
          {source.trim() ? (
            <React.Suspense
              fallback={
                <div className="flex justify-center p-6">
                  <Spinner className="size-6 text-muted-foreground" />
                </div>
              }
            >
              <LazyMarkdown
                format={preview.kind === "html" ? "html" : "markdown"}
                className="p-6"
              >
                {source}
              </LazyMarkdown>
            </React.Suspense>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              This file is empty.
            </p>
          )}
        </SheetStage>
      );
    }
    default:
      return (
        <CardStage
          item={item}
          thumb={preview.thumb}
          facts={preview.facts}
          onSwipe={onSwipe}
        />
      );
  }
}

/**
 * A video or audio file on the stage, in the system's own player — never autoplaying. The player
 * pauses when the viewer pages away (the stage is keyed by the file, so it unmounts) or closes
 * (`active` false): a detached media element would otherwise keep playing. A swipe on the stage
 * around the player pages or closes, as elsewhere; the player keeps its own gestures and keys. An
 * expired signed URL is renewed through the item's `refreshSrc`, and a video the browser cannot
 * play shows "Can’t play this video here" with Download.
 */
function MediaStage({
  item,
  kind,
  active,
  onSwipe,
}: {
  item: FileViewerItem;
  kind: "video" | "audio";
  active: boolean;
  onSwipe: (direction: Swipe) => void;
}) {
  const swipe = useSwipe(onSwipe);
  const media = React.useRef<HTMLMediaElement | null>(null);
  React.useEffect(() => {
    if (!active) media.current?.pause();
  }, [active]);
  React.useEffect(() => {
    const element = media.current;
    return () => element?.pause();
  }, []);
  const src = item.src ?? "";
  return (
    <div
      data-slot={`file-viewer-${kind}`}
      onPointerDown={(event) => {
        if (
          event.target === event.currentTarget &&
          event.pointerType !== "mouse"
        )
          swipe.begin(event);
      }}
      onPointerMove={swipe.move}
      onPointerUp={swipe.end}
      onPointerCancel={swipe.cancel}
      className="flex size-full items-center justify-center p-6 pointer-fine:px-20"
    >
      {kind === "video" ? (
        <VideoPlayer
          src={src}
          label={item.name}
          mediaRef={media as React.RefObject<HTMLVideoElement | null>}
          poster={item.thumb?.src ?? undefined}
          downloadHref={item.downloadHref}
          onSourceExpired={item.refreshSrc}
          // Letterbox, never crop: a portrait phone clip keeps its whole frame.
          videoClassName="object-contain"
          className="w-full max-w-[min(64rem,calc((100dvh-10rem)*16/9))]"
        />
      ) : (
        <AudioPlayer
          src={src}
          label={item.name}
          title={item.name}
          description={
            item.size != null ? (
              <span className="tabular-nums">{formatBytes(item.size)}</span>
            ) : undefined
          }
          mediaRef={media as React.RefObject<HTMLAudioElement | null>}
          onSourceExpired={item.refreshSrc}
          // A precomputed waveform when the upload stored one; never a whole-file decode here.
          variant={item.peaks?.length ? "waveform" : "default"}
          peaks={item.peaks ?? undefined}
          className="w-full max-w-lg"
        />
      )}
    </div>
  );
}

const chromeButton =
  "text-foreground pointer-coarse:size-11 [&_svg:not([class*='size-'])]:size-5";

/**
 * `FileViewer` — a full-screen, dark overlay for a list of stored files. Images open fit to the
 * screen with their blurred thumb fading into the full-size variant, and zoom (double-click or
 * double-tap, pinch, +/−/0) and pan; PDFs render page by page with pdf.js, loaded lazily, with
 * fit-width, zoom and a page indicator; video and audio play in `VideoPlayer` / `AudioPlayer`;
 * text, CSV and Markdown show their first 1 MB as text, a table or rendered Markdown;
 * `loadPreview` lets the app supply parsed content for anything else (an Office file); and the
 * rest shows a card with its picture or type icon, size and Download.
 * ←/→ and the side buttons page, a swipe pages on a phone, Esc or a swipe down closes, and focus
 * returns to whatever opened it.
 *
 * Controlled: `index` is the open file (`null` closed). The caller resolves every URL.
 *
 * @example
 * const [index, setIndex] = React.useState<number | null>(null);
 * <AttachmentGroup>
 *   {files.map((file, i) => (
 *     <Attachment key={file.id} orientation="vertical">
 *       <AttachmentTrigger aria-label={`Open ${file.name}`} onClick={() => setIndex(i)} />
 *       …
 *     </Attachment>
 *   ))}
 * </AttachmentGroup>
 * <FileViewer
 *   items={files}
 *   index={index}
 *   onIndexChange={setIndex}
 *   onOpenChange={(open) => !open && setIndex(null)}
 * />
 */
export function FileViewer({
  items,
  index,
  onIndexChange,
  onOpenChange,
  loadPreview,
  actions,
}: FileViewerProps) {
  const open = index !== null && items.length > 0;
  // Keep showing the last file while the close animation runs, after `index` became null.
  const [shown, setShown] = React.useState(index ?? 0);
  if (index !== null && index !== shown) setShown(index);
  const current = clampNumber(shown, 0, Math.max(0, items.length - 1));
  const item = items[current];
  const count = items.length;

  const [failed, setFailed] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const markFailed = React.useCallback((id: string) => {
    setFailed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const baseKind: Kind = item
    ? failed.has(item.id)
      ? "card"
      : kindOf(item)
    : "card";
  // What a preview stage settled on (the app's HTML for a .docx, the card when a read failed).
  const [resolved, setResolved] = React.useState<{
    id: string;
    kind: Kind;
  } | null>(null);
  const kind: Kind =
    item && resolved?.id === item.id ? resolved.kind : baseKind;
  const itemId = item?.id;
  const onResolve = React.useCallback(
    (next: Kind) => {
      if (itemId != null) setResolved({ id: itemId, kind: next });
    },
    [itemId],
  );
  const zoomRef = React.useRef<((op: ZoomOp) => void) | null>(null);
  // The popup itself takes focus on open (a `tabindex="-1"` region, so no tint): the default —
  // the first tabbable, the Download link — would open with it looking hovered.
  const popupNode = React.useRef<HTMLDivElement | null>(null);
  const popupRef = useModalInert<HTMLDivElement>({ ref: popupNode });
  const { announce, Announcer } = useAnnouncer();

  const go = React.useCallback(
    (delta: number) => {
      const next = current + delta;
      if (next >= 0 && next < count) onIndexChange(next);
    },
    [current, count, onIndexChange],
  );

  const onSwipe = React.useCallback(
    (direction: Swipe) => {
      if (direction === "close") onOpenChange(false);
      else go(direction === "next" ? 1 : -1);
    },
    [go, onOpenChange],
  );

  // Announce the destination on a page turn, never on open (the dialog's name covers that).
  const announced = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!open) {
      announced.current = null;
      return;
    }
    if (announced.current !== null && announced.current !== current) {
      announce(`${KIND_LABEL[kind]} ${current + 1} of ${count}`);
    }
    announced.current = current;
  }, [open, current, count, kind, announce]);

  // Warm the neighbours so paging to them is instant.
  React.useEffect(() => {
    if (!open) return;
    preload(items[current + 1]);
    preload(items[current - 1]);
  }, [open, current, items]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, [contenteditable='true']")) return;
    const zoom = (op: ZoomOp) => {
      event.preventDefault();
      zoomRef.current?.(op);
    };
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        go(-1);
        break;
      case "ArrowRight":
        event.preventDefault();
        go(1);
        break;
      case "+":
      case "=":
        zoom("in");
        break;
      case "-":
      case "_":
        zoom("out");
        break;
      case "0":
        zoom("reset");
        break;
    }
  };

  if (!item) return null;

  const onFail = () => markFailed(item.id);

  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DialogPortal>
        <DialogPrimitive.Backdrop
          data-slot="file-viewer-backdrop"
          className="fixed inset-0 z-50 bg-black/10 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          ref={popupRef}
          data-slot="file-viewer"
          data-kind={kind}
          initialFocus={popupNode}
          onKeyDown={onKeyDown}
          className="dark fixed inset-0 z-50 flex flex-col bg-background text-foreground outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          <div
            data-slot="file-viewer-header"
            className="flex min-w-0 shrink-0 items-center gap-2 ps-[calc(var(--spacing)*4+env(safe-area-inset-left))] pe-[calc(var(--spacing)*2+env(safe-area-inset-right))] pt-[calc(var(--spacing)*2+env(safe-area-inset-top))] pb-2"
          >
            <div className="flex min-w-0 flex-1 items-baseline gap-3">
              <DialogPrimitive.Title
                data-slot="file-viewer-title"
                className="min-w-0 text-sm font-medium"
              >
                <span className="block truncate">{item.name}</span>
              </DialogPrimitive.Title>
              {count > 1 ? (
                <span
                  data-slot="file-viewer-count"
                  className="shrink-0 text-sm text-muted-foreground tabular-nums"
                >
                  {current + 1} of {count}
                </span>
              ) : null}
            </div>
            {actions ? (
              <div
                data-slot="file-viewer-actions"
                className="flex shrink-0 items-center gap-1 [&_[data-slot=button]]:text-foreground max-sm:[&_[data-slot=button]]:aspect-square max-sm:[&_[data-slot=button]]:px-0 max-sm:[&_[data-slot=button]>span]:sr-only"
              >
                {actions(item)}
              </div>
            ) : null}
            {/* A real link, so it reads as one and the browser downloads it natively. */}
            <a
              href={item.downloadHref}
              download
              data-slot="file-viewer-download"
              aria-label={`Download ${item.name}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                chromeButton,
              )}
            >
              <DownloadIcon />
            </a>
            <DialogPrimitive.Close
              data-slot="file-viewer-close"
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  className={chromeButton}
                />
              }
            >
              <XIcon />
            </DialogPrimitive.Close>
          </div>

          <div
            data-slot="file-viewer-stage"
            className="relative min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]"
          >
            {baseKind === "image" ? (
              <ImageStage
                key={item.id}
                item={item}
                onSwipe={onSwipe}
                zoomRef={zoomRef}
                onFail={onFail}
              />
            ) : baseKind === "pdf" ? (
              <React.Suspense fallback={<PdfLoading item={item} />}>
                <LazyPdf
                  key={item.id}
                  src={item.pdfSrc ?? ""}
                  name={item.name}
                  zoomRef={zoomRef}
                  onError={onFail}
                  loading={<PdfLoading item={item} />}
                />
              </React.Suspense>
            ) : baseKind === "video" || baseKind === "audio" ? (
              <MediaStage
                key={item.id}
                item={item}
                kind={baseKind}
                active={open}
                onSwipe={onSwipe}
              />
            ) : (
              <PreviewStage
                key={item.id}
                item={item}
                kind={
                  baseKind === "text" ||
                  baseKind === "table" ||
                  baseKind === "markdown" ||
                  baseKind === "workbook" ||
                  baseKind === "word"
                    ? baseKind
                    : "card"
                }
                loadPreview={failed.has(item.id) ? undefined : loadPreview}
                onSwipe={onSwipe}
                onResolve={onResolve}
              />
            )}

            {count > 1 ? (
              <>
                {/* Centred with `inset-y-0 my-auto`, not a translate: the button's press
                    `translate-y-px` shares `translate` and would drop it by half its height. */}
                <Button
                  variant="secondary"
                  size="icon-lg"
                  aria-label="Previous file"
                  disabled={current === 0}
                  onClick={() => go(-1)}
                  className="absolute start-[calc(var(--spacing)*3+env(safe-area-inset-left))] inset-y-0 my-auto hidden rounded-full pointer-fine:inline-flex"
                >
                  <ChevronLeftIcon className="rtl:rotate-180" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon-lg"
                  aria-label="Next file"
                  disabled={current === count - 1}
                  onClick={() => go(1)}
                  className="absolute end-[calc(var(--spacing)*3+env(safe-area-inset-right))] inset-y-0 my-auto hidden rounded-full pointer-fine:inline-flex"
                >
                  <ChevronRightIcon className="rtl:rotate-180" />
                </Button>
              </>
            ) : null}
          </div>
          <Announcer />
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}

/** A PDF's loading frame: its preview image when it has one, else a spinner. */
function PdfLoading({ item }: { item: FileViewerItem }) {
  const thumb = item.thumb?.src;
  return (
    <div className="flex size-full items-center justify-center p-6">
      {thumb ? (
        <Image
          src={thumb}
          srcSet={item.thumb?.srcSet}
          sizes="100vw"
          placeholder={item.thumb?.blur ?? undefined}
          alt=""
          priority
          rounded="none"
          className="size-full bg-transparent opacity-60 [&_[data-slot=image-img]]:object-contain [&_[data-slot=image-placeholder]]:scale-100 [&_[data-slot=image-placeholder]]:bg-contain [&_[data-slot=image-placeholder]]:bg-no-repeat"
        />
      ) : (
        <Spinner className="size-6 text-muted-foreground" />
      )}
    </div>
  );
}

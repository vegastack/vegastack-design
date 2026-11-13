// @vegastack file-preview@0.82.0 sha256-FEuCaDuaNxazc3sDiAMSgGtftxN3brvc8yYXb713pHQ=

"use client";

import * as React from "react";
import { ChevronRight, Download, Maximize2 } from "lucide-react";
import { cn } from "@vegastack/design";

import { Button, buttonVariants } from "@/components/ui/button";
import { ChatCard } from "@/components/ui/chat-card";
import {
  loadPdfThumbnail,
  parseCsv,
  previewFailureReason,
  readFileHead,
} from "@/components/ui/file-viewer";
import { MarkdownView } from "@/components/ui/markdown-view";
import { useOverflow } from "@/components/ui/use-overflow";
import {
  FileTypeIcon,
  fileKindOf,
  fileNameOf,
  formatBytes,
  type FilePartLike,
} from "@/lib/file-kind";

/* ------------------------------------------------------------------------------------------------
 * FilePreview — a file in a chat answer, previewed where it was made, on the chat's card surface:
 * the header names it (its type's icon, its name, its size or page count) with Download and Open;
 * the body shows what is in it — Markdown rendered with its formatting (the first dozen lines,
 * fading out), a CSV's first five rows as a table, a PDF's first page, an image — and opens the
 * viewer (`FileViewer` in `mode="side"`) on a click. A file with nothing to preview is the header
 * alone. A preview that fails says why, with Retry.
 *
 * It reads only the head of a text file (32 KB, one `Range` request) and draws a PDF's first page
 * with pdf.js, loaded the first time one shows. The file's own `url` must be on the app's origin
 * (the `/content` route), so the reader's browser never fetches it across origins.
 * ----------------------------------------------------------------------------------------------*/

/** How much of a text file the preview reads. */
const HEAD_BYTES = 32 * 1024;
/** Lines of Markdown or text handed to the renderer: more than the card shows, far fewer than a file. */
const HEAD_LINES = 60;
/** Data rows a CSV preview shows. */
const TABLE_ROWS = 5;
/** The PDF thumbnail's width. */
const THUMB_WIDTH = 112;

type PreviewKind = "markdown" | "table" | "text" | "pdf" | "image" | "none";

/** What the card can show for a file, by its type and then its name. */
function previewKindOf(mediaType: string, filename: string): PreviewKind {
  const type = mediaType.split(";")[0]!.trim().toLowerCase();
  const extension = /\.([a-z0-9]+)$/i.exec(filename)?.[1]?.toLowerCase() ?? "";
  if (
    ["md", "markdown"].includes(extension) ||
    /^text\/(x-)?markdown$/.test(type)
  )
    return "markdown";
  if (
    ["csv", "tsv"].includes(extension) ||
    type === "text/csv" ||
    type === "text/tab-separated-values"
  )
    return "table";
  const kind = fileKindOf(mediaType, filename);
  if (kind === "pdf") return "pdf";
  if (kind === "image") return "image";
  if (kind === "text" || kind === "json" || kind === "code") return "text";
  return "none";
}

type Loaded =
  | { state: "loading" }
  | { state: "failed"; reason: string }
  | { state: "text"; text: string; truncated: boolean }
  | { state: "table"; rows: string[][]; more: boolean }
  | { state: "pdf"; pages: number }
  | { state: "ready" };

/** Props accepted by `FilePreview`. */
export interface FilePreviewProps {
  /** The file itself, on the app's origin (`/api/files/<id>/content`). */
  url: string;
  /** Its type (`text/markdown`, `application/pdf`); the name's extension decides when it is generic. */
  mediaType: string;
  /**
   * Its name, as the header shows it. A streamed file part's name rides in `providerMetadata`, so
   * a `file` part passes as-is.
   * @default providerMetadata.vegastack.filename, else what the file is ("PDF")
   */
  filename?: string | null;
  /** A file part's provider metadata: its name when `filename` is absent. @default undefined */
  providerMetadata?: FilePartLike["providerMetadata"];
  /** Its size in bytes: "1.2 KB" in the header. @default undefined */
  size?: number | null;
  /** A PDF's page count, when the server knows it; otherwise the preview counts. @default undefined */
  pages?: number | null;
  /** Where Download goes. @default url */
  downloadHref?: string;
  /** Opens the file in the viewer. */
  onOpen: () => void;
  /** The file's ⋯ menu (Open in Library, Copy link, Attach to…), at the header's end. @default undefined */
  menu?: React.ReactNode;
  /** A row of actions under the preview ("Attach to #sales"). @default undefined */
  actions?: React.ReactNode;
  /** Extra classes on the card. @default undefined */
  className?: string;
}

/**
 * A file the agent made, previewed in the answer: Markdown formatted, a CSV's first rows, a PDF's
 * first page, an image; Download and Open in the header, and a click on the preview opens the
 * viewer.
 *
 * @example
 * <FilePreview url="/api/files/f1/content" mediaType="text/markdown" filename="open-tasks.md"
 *   size={1180} onOpen={() => openViewer(file)} />
 *
 * @example
 * <FilePreview url="/api/files/f2/content" mediaType="application/pdf" filename="open-tasks.pdf"
 *   pages={3} onOpen={() => openViewer(file)} menu={<FileMenu file={file} />} />
 */
export function FilePreview(props: FilePreviewProps) {
  // Each file starts fresh — its own reading state and, for a PDF, its own canvas — so nothing
  // from the last file (a failure, a half-drawn page) carries over.
  return (
    <FilePreviewCard
      key={`${props.url}\n${props.mediaType}`}
      {...props}
      filename={fileNameOf(props)}
    />
  );
}

function FilePreviewCard({
  url,
  mediaType,
  filename,
  size,
  pages,
  downloadHref,
  onOpen,
  menu,
  actions,
  className,
}: FilePreviewProps & { filename: string }) {
  const kind = previewKindOf(mediaType, filename);
  const [attempt, setAttempt] = React.useState(0);
  const [loaded, setLoaded] = React.useState<Loaded>({ state: "loading" });
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Read what the card shows; again on Retry or when the file changes.
  React.useEffect(() => {
    if (kind === "none" || kind === "image") {
      setLoaded({ state: "ready" });
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    setLoaded({ state: "loading" });
    const fail = (error: unknown) => {
      const reason = previewFailureReason(error);
      if (reason && !signal.aborted) setLoaded({ state: "failed", reason });
    };
    if (kind === "pdf") {
      void loadPdfThumbnail()
        .then((renderPdfFirstPage) => {
          const canvas = canvasRef.current;
          if (!canvas || signal.aborted) return;
          return renderPdfFirstPage(url, canvas, THUMB_WIDTH, signal).then(
            (result) => {
              if (!signal.aborted)
                setLoaded({ state: "pdf", pages: result.pages });
            },
          );
        })
        .catch(fail);
    } else {
      readFileHead(url, { bytes: HEAD_BYTES, size, signal })
        .then(({ text, truncated }) => {
          if (signal.aborted) return;
          if (kind === "table") {
            const parsed = parseCsv(text, {
              delimiter: /\.tsv$/i.test(filename) ? "\t" : undefined,
              maxRows: TABLE_ROWS + 1,
            });
            setLoaded({
              state: "table",
              rows: parsed.rows,
              more: parsed.truncated || truncated,
            });
          } else {
            const lines = text.split("\n");
            setLoaded({
              state: "text",
              text: lines.slice(0, HEAD_LINES).join("\n"),
              truncated: truncated || lines.length > HEAD_LINES,
            });
          }
        })
        .catch(fail);
    }
    return () => controller.abort();
  }, [kind, url, size, filename, attempt]);

  const [clip, setClip] = React.useState<HTMLDivElement | null>(null);
  const clipped = useOverflow(clip, {
    axis: "block",
    deps: [loaded.state],
  });

  const retry = () => {
    setLoaded({ state: "loading" });
    setAttempt((n) => n + 1);
  };

  const pageCount = pages ?? (loaded.state === "pdf" ? loaded.pages : null);
  const meta = [
    pageCount ? `${pageCount} ${pageCount === 1 ? "page" : "pages"}` : null,
    size != null ? formatBytes(size) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const openFull = (
    <Button
      variant="ghost"
      size="xs"
      onClick={onOpen}
      data-slot="file-preview-open-full"
      className="text-muted-foreground hover:text-foreground"
    >
      Open full
      <ChevronRight data-icon="inline-end" className="rtl:rotate-180" />
    </Button>
  );

  let body: React.ReactNode = null;
  if (loaded.state === "failed") {
    body = (
      <p
        data-slot="file-preview-error"
        className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground"
      >
        <span>Couldn&rsquo;t load the preview: {loaded.reason}.</span>
        <Button
          variant="link"
          size="xs"
          onClick={retry}
          className="relative h-auto px-0 text-foreground before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']"
        >
          Retry
        </Button>
      </p>
    );
  } else if (kind === "image") {
    body = (
      <div
        data-slot="file-preview-body"
        onClick={onOpen}
        className="flex cursor-pointer"
      >
        <img
          key={attempt}
          src={url}
          alt={filename}
          decoding="async"
          loading="lazy"
          className="max-h-64 max-w-full rounded-md border border-chat-hairline object-contain"
          onError={() =>
            setLoaded({ state: "failed", reason: "the image didn’t load" })
          }
        />
      </div>
    );
  } else if (kind === "pdf") {
    body = (
      <div
        data-slot="file-preview-body"
        onClick={onOpen}
        className="flex cursor-pointer"
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${filename}, page 1`}
          className={cn(
            "w-28 rounded-sm border border-chat-hairline bg-white",
            loaded.state === "loading" && "aspect-3/4",
          )}
        />
      </div>
    );
  } else if (kind === "markdown" || kind === "text" || kind === "table") {
    const placeholder = loaded.state === "loading";
    body = (
      <div data-slot="file-preview-body" className="flex min-w-0 flex-col">
        {placeholder ? (
          <div aria-hidden="true" className="flex flex-col gap-2 py-1">
            <span className="h-3 w-11/12 rounded-sm bg-muted" />
            <span className="h-3 w-3/4 rounded-sm bg-muted" />
            <span className="h-3 w-3/5 rounded-sm bg-muted" />
          </div>
        ) : (
          <div onClick={onOpen} className="relative min-w-0 cursor-pointer">
            <div
              ref={setClip}
              // The preview is a picture of the file: its links and cells aren't stops of their
              // own, and a click anywhere on it opens the viewer. A cut file fades out over its
              // last 48px: a mask, so it matches whatever is behind the card in either theme.
              inert
              data-clipped={clipped ? "" : undefined}
              className="max-h-72 min-w-0 overflow-hidden data-clipped:mask-b-from-[calc(100%-3rem)] data-clipped:mask-b-to-100%"
            >
              {loaded.state === "table" ? (
                <PreviewTable rows={loaded.rows} />
              ) : loaded.state === "text" && kind === "markdown" ? (
                <MarkdownView untrusted typeScale="compact">
                  {loaded.text}
                </MarkdownView>
              ) : loaded.state === "text" ? (
                <pre className="font-mono text-xs leading-5 whitespace-pre-wrap wrap-anywhere text-foreground">
                  {loaded.text}
                </pre>
              ) : null}
            </div>
          </div>
        )}
        {!placeholder &&
        (clipped ||
          (loaded.state === "text" && loaded.truncated) ||
          (loaded.state === "table" && loaded.more)) ? (
          <div className="-mb-1 flex justify-end">{openFull}</div>
        ) : null}
      </div>
    );
  }

  return (
    <ChatCard
      data-slot="file-preview"
      data-kind={kind}
      data-state={loaded.state}
      // The name and its facts share one centred line: a button's baseline is its icon's edge.
      className={cn(
        "max-w-2xl [&_[data-slot=chat-card-title]]:flex",
        className,
      )}
      title={
        <span className="flex min-w-0 items-center gap-2">
          <Button
            variant="link"
            onClick={onOpen}
            className="relative h-auto min-w-0 shrink gap-2 p-0 text-sm font-semibold text-foreground before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']"
          >
            <FileTypeIcon
              contentType={mediaType}
              name={filename}
              strokeWidth={1.5}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="min-w-0 truncate">{filename}</span>
          </Button>
          {meta ? (
            <span
              data-slot="file-preview-meta"
              className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums"
            >
              {meta}
            </span>
          ) : null}
        </span>
      }
      aside={
        <>
          <a
            href={downloadHref ?? url}
            download={filename}
            aria-label={`Download ${filename}`}
            data-slot="file-preview-download"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <Download strokeWidth={1.5} />
          </a>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Open ${filename}`}
            data-slot="file-preview-open"
            onClick={onOpen}
            className="text-muted-foreground hover:text-foreground"
          >
            <Maximize2 strokeWidth={1.5} />
          </Button>
          {menu}
        </>
      }
      actions={actions}
    >
      {body}
    </ChatCard>
  );
}

/** A CSV's first rows: the header in muted ink, cells on one line each. */
function PreviewTable({ rows }: { rows: readonly (readonly string[])[] }) {
  const [head = [], ...body] = rows;
  const data = body.slice(0, TABLE_ROWS);
  const columns = Math.max(head.length, ...data.map((row) => row.length));
  if (!columns)
    return <p className="text-sm text-muted-foreground">This file is empty.</p>;
  const cells = (row: readonly string[]) =>
    Array.from({ length: columns }, (_, index) => row[index] ?? "");
  return (
    <table className="w-max min-w-full border-collapse text-xs tabular-nums">
      <thead>
        <tr className="border-b border-chat-hairline">
          {cells(head).map((cell, index) => (
            <th
              key={index}
              scope="col"
              className="max-w-48 truncate py-1.5 pe-4 text-start font-medium text-muted-foreground"
            >
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className="border-b border-chat-hairline last:border-b-0"
          >
            {cells(row).map((cell, index) => (
              <td
                key={index}
                className="max-w-48 truncate py-1.5 pe-4 text-foreground"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

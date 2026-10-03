// @vegastack file-viewer@0.23.120 sha256-Zk0JQQJJ5V9H+LiHbayHf5G6MsQHxZD6/lnB5uimRIQ=

"use client";

import * as React from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { ScanIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/* ---
The PDF half of `FileViewer`, in its own file so pdf.js loads only when a PDF is shown:
`file-viewer.tsx` imports this module through `React.lazy`, and this module imports `pdfjs-dist`
dynamically on mount. The worker is served from the app's own origin — the bundler emits
`pdf.worker.min.mjs` as an asset via `new URL(…, import.meta.url)` — and is created once per page.

The document loads with range requests (`rangeChunkSize` 64 KB, `disableAutoFetch`), so opening
page 1 of a 40 MB drawing set fetches the first chunks, not the file. Pages render into canvases
at `devicePixelRatio` in a vertical scroller, windowed: only the current page and two either side
hold a canvas; the rest are placeholders sized from page 1, so the scrollbar is right from the
start. Fit-width is zoom 1 — the scroller's width, capped at a reader's page width (920px) so a
wide screen shows the page centred on the dark stage; the toolbar and +/−/0 step it from there.
--- */

/** Props for the lazily loaded PDF stage. Internal to `FileViewer`. */
export interface FileViewerPdfProps {
  /** Inline-disposition, range-capable URL of the PDF. */
  src: string;
  /** File name, for the canvases' accessible labels. */
  name: string;
  /** The viewer's zoom command slot: +/−/0 on the keyboard call it. */
  zoomRef: React.RefObject<((op: "in" | "out" | "reset") => void) | null>;
  /** Called when the document cannot be loaded; the viewer falls back to its file card. */
  onError: () => void;
  /** Shown until page 1 is ready (the preview image or a spinner). */
  loading: React.ReactNode;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;
const PAGE_GAP = 16;
const PAD = 16;
const WINDOW = 2;
/** Fit-width stops at a reader's page width: a wide screen shows the page centred on the dark stage. */
const MAX_FIT_WIDTH = 920;

/**
 * `FileViewerPdf` — windowed canvas pages, fit-width by default, with a zoom toolbar and a
 * "Page 3 of 20" indicator. Rendered by `FileViewer`; not meant to be used on its own.
 *
 * @example
 * <FileViewerPdf src={file.pdfSrc} name={file.name} zoomRef={zoomRef} onError={fallBack} loading={<Spinner />} />
 */
export function FileViewerPdf({
  src,
  name,
  zoomRef,
  onError,
  loading,
}: FileViewerPdfProps) {
  const [doc, setDoc] = React.useState<{
    pdf: PDFDocumentProxy;
    width: number;
    height: number;
  } | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [width, setWidth] = React.useState(0);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const ratio = React.useRef(0);
  const onErrorRef = React.useRef(onError);
  React.useEffect(() => {
    onErrorRef.current = onError;
  });

  React.useEffect(() => {
    let cancelled = false;
    let destroy: (() => Promise<void>) | undefined;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerPort ??= new Worker(
          new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
          { type: "module" },
        );
        const task = pdfjs.getDocument({
          url: src,
          rangeChunkSize: 65536,
          disableAutoFetch: true,
        });
        destroy = () => task.destroy();
        const pdf = await task.promise;
        const first = await pdf.getPage(1);
        const viewport = first.getViewport({ scale: 1 });
        if (!cancelled)
          setDoc({ pdf, width: viewport.width, height: viewport.height });
      } catch {
        if (!cancelled) onErrorRef.current();
      }
    })();
    return () => {
      cancelled = true;
      void destroy?.();
    };
  }, [src]);

  // Track the scroller's width so fit-width follows a resize or a rotation.
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, [doc]);

  const step = React.useCallback((op: "in" | "out" | "reset") => {
    setZoom((z) => {
      if (op === "reset") return 1;
      if (op === "in") return ZOOM_STEPS.find((s) => s > z + 0.001) ?? z;
      return [...ZOOM_STEPS].reverse().find((s) => s < z - 0.001) ?? z;
    });
  }, []);

  React.useEffect(() => {
    zoomRef.current = step;
    return () => {
      zoomRef.current = null;
    };
  }, [zoomRef, step]);

  const fit =
    doc && width
      ? Math.max(0.1, Math.min(width - PAD * 2, MAX_FIT_WIDTH) / doc.width)
      : 0;
  const scale = fit * zoom;
  const pageWidth = doc ? doc.width * scale : 0;
  const pageHeight = doc ? doc.height * scale : 0;
  const count = doc?.pdf.numPages ?? 0;

  // Keep the reading position when the zoom changes.
  React.useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el && scale) el.scrollTop = ratio.current * el.scrollHeight;
  }, [scale]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || !pageHeight) return;
    ratio.current = el.scrollTop / Math.max(1, el.scrollHeight);
    const mid = el.scrollTop + el.clientHeight / 2 - PAD;
    setPage(
      Math.min(
        count,
        Math.max(1, Math.floor(mid / (pageHeight + PAGE_GAP)) + 1),
      ),
    );
  };

  return (
    <div data-slot="file-viewer-pdf" className="relative size-full">
      {!doc ? <div className="absolute inset-0">{loading}</div> : null}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="size-full overflow-auto overscroll-contain"
      >
        {doc && scale ? (
          <div
            className="mx-auto flex w-max min-w-full flex-col items-center"
            style={{ gap: PAGE_GAP, padding: PAD }}
          >
            {Array.from({ length: count }, (_, i) => (
              <PdfPage
                key={i}
                pdf={doc.pdf}
                number={i + 1}
                scale={scale}
                width={pageWidth}
                height={pageHeight}
                near={Math.abs(i + 1 - page) <= WINDOW}
                label={`${name}, page ${i + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>
      {doc ? (
        <div
          data-slot="file-viewer-pdf-toolbar"
          className="absolute inset-x-0 bottom-[calc(var(--spacing)*4+env(safe-area-inset-bottom))] flex justify-center"
        >
          <div className="flex items-center gap-1 rounded-full border border-border bg-popover/90 p-1 text-popover-foreground shadow-md backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom out"
              disabled={zoom <= ZOOM_STEPS[0]}
              onClick={() => step("out")}
              className="rounded-full pointer-coarse:size-11"
            >
              <ZoomOutIcon />
            </Button>
            <span
              data-slot="file-viewer-pdf-page"
              className="px-2 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
            >
              Page {page} of {count}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom in"
              disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]!}
              onClick={() => step("in")}
              className="rounded-full pointer-coarse:size-11"
            >
              <ZoomInIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Fit to width"
              aria-pressed={zoom === 1}
              onClick={() => step("reset")}
              className="rounded-full pointer-coarse:size-11"
            >
              <ScanIcon />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** One page: a canvas while it is near the viewport, a sized placeholder otherwise. */
function PdfPage({
  pdf,
  number,
  scale,
  width,
  height,
  near,
  label,
}: {
  pdf: PDFDocumentProxy;
  number: number;
  scale: number;
  width: number;
  height: number;
  near: boolean;
  label: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!near) {
      setReady(false);
      return;
    }
    let cancelled = false;
    let task: RenderTask | undefined;
    (async () => {
      try {
        const p = await pdf.getPage(number);
        if (cancelled) return;
        const dpr = window.devicePixelRatio || 1;
        const css = p.getViewport({ scale });
        const viewport = p.getViewport({ scale: scale * dpr });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        setSize({ w: css.width, h: css.height });
        task = p.render({ canvas, viewport });
        await task.promise;
        if (!cancelled) setReady(true);
      } catch {
        // A cancelled render rejects; the next pass re-renders the page.
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, number, scale, near]);

  const w = size?.w ?? width;
  const h = size?.h ?? height;
  return (
    <div
      data-slot="file-viewer-pdf-page-frame"
      data-ready={ready ? "" : undefined}
      className="relative shrink-0 bg-white shadow-md"
      style={{ width: w, height: h }}
    >
      {near ? (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          className="block size-full"
        />
      ) : null}
    </div>
  );
}

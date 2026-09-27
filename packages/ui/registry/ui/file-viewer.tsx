// @vegastack file-viewer@0.23.65 sha256-Fwpv4ULsFYpegIyvXPEVWvjAjWsk+/jOHBFXF5kvzfE=

"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@vegastack/design";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  XIcon,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { Spinner } from "@/components/ui/spinner";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { useModalInert } from "@/components/ui/use-modal-inert";

/* ---
`FileViewer` is the full-screen look at a stored file: an image you can zoom and pan, a PDF you
can scroll page by page, or — for anything else — its name, size and a Download button. It is a
controlled overlay over a list of files (`index` opens it at one, `null` closes it), so a gallery
of `Attachment` tiles, a product's files or a message's attachments all open it the same way.

The stage is always dark whatever the page theme: the popup carries the `dark` theme class, so
its buttons and ink resolve against the dark tokens, and the scrim is upstream's `bg-black/…`
vocabulary under an opaque dark `background`. PDF rendering is the one heavy part and lives in `file-viewer-pdf.tsx`, loaded with
`React.lazy` the first time a PDF is shown — pdf.js never loads for an image gallery.

Deliberately NOT done here: fetching or signing URLs (the caller passes resolved `src`/`pdfSrc`/
`downloadHref`), video/audio playback (use `VideoPlayer`/`AudioPlayer`), and wrap-around paging.
--- */

/** One file the viewer can show. */
export type FileViewerItem = {
  /** Stable id — keys the stage, so zoom and scroll reset when the file changes. */
  id: string;
  /** The file name: the dialog's title and the image's alt text. */
  name: string;
  /** MIME type. `image/*` shows the image, `application/pdf` the PDF, anything else the file card. */
  contentType: string | null;
  /** Size in bytes, shown on the file card ("2.4 MB"). */
  size?: number | null;
  /** The small preview: a blurred placeholder while the full image loads, and a PDF's loading frame. */
  thumb?: { src: string; srcSet?: string; blur?: string | null } | null;
  /** Full-size image URL. Falls back to `thumb.src`. */
  src?: string | null;
  /** Full-size `srcset`, so the browser picks the largest variant the screen needs. Falls back to `thumb.srcSet`. */
  srcSet?: string | null;
  /** An inline-disposition URL for a PDF, served with range requests. Without it a PDF shows the file card. */
  pdfSrc?: string | null;
  /** The download URL (attachment disposition). */
  downloadHref: string;
};

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
}

type Kind = "image" | "pdf" | "other";
type ZoomOp = "in" | "out" | "reset";

const LazyPdf = React.lazy(() =>
  import("@/components/ui/file-viewer-pdf").then((module) => ({
    default: module.FileViewerPdf,
  })),
);

function kindOf(item: FileViewerItem): Kind {
  const type = item.contentType ?? "";
  if (type.startsWith("image/") && (item.src || item.thumb?.src))
    return "image";
  if (type === "application/pdf" && item.pdfSrc) return "pdf";
  return "other";
}

const KIND_LABEL: Record<Kind, string> = {
  image: "Image",
  pdf: "PDF",
  other: "File",
};

const sizeFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

/** Bytes as a person reads them: `980 B`, `12 KB`, `2.4 MB`. */
function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${sizeFormat.format(unit === 0 || value >= 10 ? Math.round(value) : value)} ${units[unit]}`;
}

/** The file-type icon for a content type, as an element (never a component made during render). */
function fileIcon(
  type: string | null,
  props: React.ComponentProps<typeof FileIcon>,
) {
  return React.createElement(iconFor(type), props);
}

function iconFor(type: string | null) {
  const t = type ?? "";
  if (t.startsWith("image/")) return FileImageIcon;
  if (t.startsWith("video/")) return FileVideoIcon;
  if (t.startsWith("audio/")) return FileAudioIcon;
  if (t === "application/pdf" || t.startsWith("text/")) return FileTextIcon;
  if (/zip|tar|gzip|compressed|rar|7z/.test(t)) return FileArchiveIcon;
  if (/sheet|excel|csv/.test(t)) return FileSpreadsheetIcon;
  if (/json|javascript|typescript|xml|html/.test(t)) return FileCodeIcon;
  return FileIcon;
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

/** Anything the viewer cannot show inline: the type icon, name, size and a Download button. */
function OtherStage({
  item,
  onSwipe,
}: {
  item: FileViewerItem;
  onSwipe: (direction: Swipe) => void;
}) {
  const swipe = useSwipe(onSwipe);
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
        style={{
          transform: `translate3d(${swipe.offset.x}px, ${swipe.offset.y}px, 0)`,
        }}
      >
        {fileIcon(item.contentType, {
          "aria-hidden": true,
          className: "size-16 text-muted-foreground",
        })}
        <div className="flex max-w-full min-w-0 flex-col gap-1">
          <p className="text-base font-medium wrap-anywhere">{item.name}</p>
          {item.size != null ? (
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatBytes(item.size)}
            </p>
          ) : null}
        </div>
        <a
          href={item.downloadHref}
          download
          className={cn(
            buttonVariants({ variant: "secondary" }),
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

const chromeButton =
  "text-foreground pointer-coarse:size-11 [&_svg:not([class*='size-'])]:size-5";

/**
 * `FileViewer` — a full-screen, dark overlay for a list of stored files. Images open fit to the
 * screen with their blurred thumb fading into the full-size variant, and zoom (double-click or
 * double-tap, pinch, +/−/0) and pan; PDFs render page by page with pdf.js, loaded lazily, with
 * fit-width, zoom and a page indicator; anything else shows its type icon, size and Download.
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

  const kind: Kind = item
    ? failed.has(item.id)
      ? "other"
      : kindOf(item)
    : "other";
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
            {kind === "image" ? (
              <ImageStage
                key={item.id}
                item={item}
                onSwipe={onSwipe}
                zoomRef={zoomRef}
                onFail={onFail}
              />
            ) : kind === "pdf" ? (
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
            ) : (
              <OtherStage key={item.id} item={item} onSwipe={onSwipe} />
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

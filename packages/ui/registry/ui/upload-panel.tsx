// @vegastack upload-panel@0.24.5 sha256-BVmvONmRPfn9eYFsiuOg6lhTPZozljwYKzbVZYtXVas=

"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  FolderIcon,
  LoaderIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@vegastack/design";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { useIsMobile } from "@/components/ui/use-mobile";
import { FileTypeIcon, formatBytes } from "@/lib/file-kind";
import { formatBytesProgress, formatTimeLeft } from "@/lib/upload-progress";

/* ---
`UploadPanel` is the one place a person watches their uploads: a card pinned bottom-end that lists
every file and folder in flight, their progress, failures and where each one goes. It is
presentational and controlled — the host's upload engine owns the queue, the bytes and the
retries, and hands the panel `items` and a `summary`; the panel calls back with what the person
asked for. When everything finishes it shrinks into a done card that closes itself after 8 s
(paused while hovered or focused); a failure keeps it open until the person acts. On a phone it is
a compact bar that opens the list in a bottom sheet.

While it is on screen it publishes `--upload-panel-inset` on the document root, so the Toast stack
rises above it rather than covering it.

Deliberately NOT done here: uploading, measuring speed (`createRateEstimator` in
`upload-progress` does that for the host), drag and drop (`use-file-drop`), or list
virtualisation — past `maxRows` rows the list says how many more there are.
--- */

/** Where an upload sits in its life. */
export type UploadItemStatus =
  | "queued"
  | "uploading"
  | "finishing"
  | "done"
  | "failed"
  | "cancelled"
  | "interrupted";

/** Where an upload lands: its label ("Product › Specs") and the link that opens it. */
export interface UploadDestination {
  /**
   * What the destination is called. */
  label: string;
  /**
   * Its link, handed to `onOpen`. */
  href: string;
}

/** One file in the panel. */
export interface UploadFile {
  /**
   * Marks a file entry; optional. */
  type?: "file";
  /**
   * Stable key, handed back to the callbacks. */
  id: string;
  /** The file name, shown middle-truncated with its extension kept. */
  name: string;
  /** The file size in bytes. */
  size: number;
  /** Bytes acknowledged so far, while it uploads. */
  bytesDone?: number;
  /** The MIME type, for the file-type icon. */
  contentType?: string | null;
  /** Where it is in its life. */
  status: UploadItemStatus;
  /** A preview image URL (an object URL for a local image), shown instead of the icon. */
  thumbnailUrl?: string | null;
  /** Why it failed, shown under the name. */
  error?: string | null;
  /** Where it lands. */
  destination?: UploadDestination | null;
}

/** A folder upload: one row with a count and aggregate progress that expands to its files. */
export interface UploadFolder {
  /** Marks a folder entry. */
  type: "folder";
  /** Stable key, handed back to the callbacks. */
  id: string;
  /** The folder name. */
  name: string;
  /** Its files. */
  files: UploadFile[];
  /** Where it lands. */
  destination?: UploadDestination | null;
}

/** A row in the panel: a file or a folder. */
export type UploadEntry = UploadFile | UploadFolder;

/**
 * The batch as a whole: `uploading` while anything is queued or moving, `done` when everything
 * finished cleanly (the done card), `failed` when nothing is moving and something failed.
 */
export type UploadSummaryStatus = "uploading" | "done" | "failed";

/** The batch totals the header reads. */
export interface UploadSummary {
  /** Files in the batch. */
  total: number;
  /** Files uploaded. */
  done: number;
  /** Files that failed. */
  failed: number;
  /** Files cancelled. */
  cancelled: number;
  /** Bytes acknowledged across the batch. */
  bytesDone: number;
  /** Bytes in the batch. */
  bytesTotal: number;
  /** The estimated time left, or null while there is too little data (`createRateEstimator`). */
  timeLeftMs?: number | null;
  /** The batch's state. */
  status: UploadSummaryStatus;
}

/** Every string the panel shows or announces. */
export interface UploadPanelLabels {
  /** The panel's accessible name. */
  region: string;
  /** Header while uploading: "Uploading 3 items". */
  uploading: (remaining: number) => string;
  /** Header when done: "3 uploads complete". */
  complete: (done: number) => string;
  /** Header and folder row with failures: "1 upload failed", "2 of 5 uploads failed". */
  failed: (failed: number, total: number) => string;
  /** Header when everything was cancelled. */
  cancelled: string;
  /** The collapse button. */
  collapse: string;
  /** The expand button. */
  expand: string;
  /** The close button. */
  close: string;
  /** The footer's cancel-everything button. */
  cancelAll: string;
  /** The footer's retry-every-failure button. */
  retryFailed: string;
  /** The close-while-active confirm's title: "Cancel 2 uploads?". */
  confirmTitle: (active: number) => string;
  /** The confirm's description. */
  confirmDescription: string;
  /** The confirm's keep button. */
  keepUploading: string;
  /** The confirm's cancel button. */
  cancelUploads: string;
  /** A queued row. */
  queued: string;
  /** A row whose bytes are sent while the server verifies it. */
  finishing: string;
  /** A failed row with no `error`. */
  failedItem: string;
  /** A cancelled row. */
  cancelledItem: string;
  /** An interrupted row (the file must be chosen again to resume). */
  interrupted: string;
  /** A row's cancel button, named for its file. */
  cancelItem: (name: string) => string;
  /** A row's retry button, named for its file. */
  retryItem: (name: string) => string;
  /** An interrupted row's button. */
  chooseFile: string;
  /** A folder's expand button, named for the folder. */
  showFiles: (name: string) => string;
  /** A folder row's progress: "3 of 12 uploaded". */
  folderProgress: (done: number, total: number) => string;
  /** A finished folder row: "12 files". */
  files: (count: number) => string;
  /** The line under a capped list: "312 more". */
  more: (count: number) => string;
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

const DEFAULT_LABELS: UploadPanelLabels = {
  region: "Uploads",
  uploading: (n) => `Uploading ${plural(n, "item", "items")}`,
  complete: (n) => `${plural(n, "upload", "uploads")} complete`,
  failed: (failed, total) =>
    failed === total
      ? `${plural(failed, "upload", "uploads")} failed`
      : `${failed} of ${plural(total, "upload", "uploads")} failed`,
  cancelled: "Uploads cancelled",
  collapse: "Collapse uploads",
  expand: "Expand uploads",
  close: "Close uploads",
  cancelAll: "Cancel all",
  retryFailed: "Retry failed",
  confirmTitle: (n) => `Cancel ${plural(n, "upload", "uploads")}?`,
  confirmDescription: "Files that finished uploading are kept.",
  keepUploading: "Keep uploading",
  cancelUploads: "Cancel uploads",
  queued: "Waiting",
  finishing: "Finishing…",
  failedItem: "Couldn't upload",
  cancelledItem: "Cancelled",
  interrupted: "Interrupted",
  cancelItem: (name) => `Cancel ${name}`,
  retryItem: (name) => `Retry ${name}`,
  chooseFile: "Choose file",
  showFiles: (name) => `Show files in ${name}`,
  folderProgress: (done, total) => `${done} of ${total} uploaded`,
  files: (n) => plural(n, "file", "files"),
  more: (n) => `${n} more`,
};

/** What a row's actions call. */
interface UploadRowHandlers {
  /**
   * Cancel a queued or uploading file, or a folder's remaining files, by id. Without it no cancel
   * button shows.
   * @default undefined
   */
  onCancel?: (id: string) => void;
  /**
   * Retry a failed file, or a folder's failed files, by id. Without it no Retry button shows.
   * @default undefined
   */
  onRetry?: (id: string) => void;
  /**
   * Resume an interrupted file by id: the host asks for the file again ("Choose file").
   * @default undefined
   */
  onResume?: (id: string) => void;
  /**
   * Open a destination in-app; without it a destination link navigates by its `href`.
   * @default undefined
   */
  onOpen?: (href: string) => void;
}

const UploadLabelsContext =
  React.createContext<UploadPanelLabels>(DEFAULT_LABELS);

/**
 * Whole percent done. Unfinished work stops at 99, so a ring never reads 100% before the upload
 * (or the batch) is actually finished.
 */
const percentOf = (
  done: number | undefined,
  total: number,
  finished = false,
) => {
  if (finished) return 100;
  if (total <= 0) return 0;
  return Math.min(99, Math.max(0, Math.round(((done ?? 0) / total) * 100)));
};

/** A disclosure chevron keeps the ghost rest state while open (the variant tints a menu trigger). */
const DISCLOSURE = "aria-expanded:bg-transparent aria-expanded:hover:bg-muted";

/** The stem's last few characters stay beside the extension when a long name truncates. */
const KEPT_STEM = 4;

/** A file name that truncates in the middle and keeps its extension: `quarterly-rep…2026.pdf`. */
function UploadName({ name, className }: { name: string; className?: string }) {
  const dot = name.lastIndexOf(".");
  const extension = dot > 0 ? name.slice(dot) : "";
  const stem = extension ? name.slice(0, dot) : name;
  const split =
    stem.length > KEPT_STEM * 2 ? stem.length - KEPT_STEM : stem.length;
  return (
    <span
      data-slot="upload-name"
      title={name}
      className={cn("flex min-w-0 text-sm", className)}
    >
      <span className="truncate whitespace-pre">{stem.slice(0, split)}</span>
      <span className="shrink-0 whitespace-pre">
        {stem.slice(split)}
        {extension}
      </span>
    </span>
  );
}

/** A determinate progress ring, labelled with the file it measures. */
function UploadRing({ value, label }: { value: number; label: string }) {
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value}%`}
      data-slot="upload-ring"
      className="block size-5 rounded-full [mask-image:radial-gradient(farthest-side,transparent_calc(100%-var(--spacing)*0.75),black_calc(100%-var(--spacing)*0.5))]"
      style={{
        backgroundImage: `conic-gradient(var(--color-primary) ${value}%, var(--color-muted) 0)`,
      }}
    />
  );
}

/** The destination as a link; `onOpen` takes the click when the host routes in-app. */
function UploadDestinationLink({
  destination,
  onOpen,
}: {
  destination: UploadDestination;
  onOpen?: (href: string) => void;
}) {
  return (
    <a
      data-slot="upload-destination"
      href={destination.href}
      onClick={(event) => {
        if (!onOpen) return;
        event.preventDefault();
        onOpen(destination.href);
      }}
      className="min-w-0 shrink-[4] truncate rounded-sm underline-offset-4 hover:text-foreground hover:underline"
    >
      {destination.label}
    </a>
  );
}

/** The secondary line: the row's state text, then its destination. */
function UploadMeta({
  text,
  tone,
  destination,
  onOpen,
}: {
  text: string;
  tone?: "error";
  destination?: UploadDestination | null;
  onOpen?: (href: string) => void;
}) {
  return (
    <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
      <span
        data-slot="upload-meta"
        title={text}
        className={cn(
          "min-w-0 truncate",
          tone === "error" && "text-destructive-text",
        )}
      >
        {text}
      </span>
      {destination ? (
        <>
          <span aria-hidden>·</span>
          <UploadDestinationLink destination={destination} onOpen={onOpen} />
        </>
      ) : null}
    </span>
  );
}

/**
 * A state glyph that a hover- or focus-revealed cancel button takes the place of (always shown on a
 * touch screen), the way Drive swaps a row's ring for its ×.
 */
function CancelSwap({
  glyph,
  label,
  onCancel,
}: {
  glyph: React.ReactNode;
  label: string;
  onCancel?: () => void;
}) {
  if (!onCancel) return <>{glyph}</>;
  return (
    <span className="grid size-7 place-items-center *:col-start-1 *:row-start-1">
      <span className="transition-opacity group-focus-within/upload-row:opacity-0 group-hover/upload-row:opacity-0 pointer-coarse:opacity-0">
        {glyph}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        onClick={onCancel}
        className="opacity-0 transition-opacity group-focus-within/upload-row:opacity-100 group-hover/upload-row:opacity-100 pointer-coarse:opacity-100"
      >
        <XIcon />
      </Button>
    </span>
  );
}

/** Props accepted by `UploadItem`. */
export interface UploadItemProps
  extends
    Omit<React.ComponentPropsWithRef<"li">, "children">,
    UploadRowHandlers {
  /** The file the row shows. */
  file: UploadFile;
}

/**
 * `UploadItem` — one file's row: thumbnail or file-type icon, the middle-truncated name, its
 * progress or state and its destination link, and the state icon — a clock while queued, a
 * percentage ring while uploading (× on hover), a spinner while finishing, a check when done, an
 * alert and Retry when it failed, and "Choose file" when it was interrupted. A list item: render
 * it inside `UploadPanel`, or inside your own `ul`.
 *
 * @example
 * <ul><UploadItem file={file} onCancel={cancel} onRetry={retry} onOpen={router.push} /></ul>
 */
export function UploadItem({
  file,
  onCancel,
  onRetry,
  onResume,
  onOpen,
  className,
  ...props
}: UploadItemProps) {
  const labels = React.useContext(UploadLabelsContext);
  // The success pop plays only for a row seen finishing here, never for one that mounts done.
  const [mountedDone] = React.useState(file.status === "done");
  const percent = percentOf(file.bytesDone, file.size);

  let meta: string;
  let state: React.ReactNode;
  switch (file.status) {
    case "queued":
      meta = `${labels.queued} · ${formatBytes(file.size)}`;
      state = (
        <CancelSwap
          glyph={
            <ClockIcon aria-hidden className="size-4 text-muted-foreground" />
          }
          label={labels.cancelItem(file.name)}
          onCancel={onCancel && (() => onCancel(file.id))}
        />
      );
      break;
    case "uploading":
      meta = `${percent}% · ${formatBytesProgress(file.bytesDone ?? 0, file.size)}`;
      state = (
        <CancelSwap
          glyph={<UploadRing value={percent} label={file.name} />}
          label={labels.cancelItem(file.name)}
          onCancel={onCancel && (() => onCancel(file.id))}
        />
      );
      break;
    case "finishing":
      meta = labels.finishing;
      state = (
        <LoaderIcon
          aria-hidden
          className="size-4 animate-spin text-muted-foreground"
        />
      );
      break;
    case "done":
      meta = formatBytes(file.size);
      state = (
        <CircleCheckIcon
          aria-hidden
          data-slot="upload-done-icon"
          className={cn(
            "size-5 text-success-text",
            !mountedDone && "motion-pop-in",
          )}
        />
      );
      break;
    case "failed":
      meta = file.error || labels.failedItem;
      state = (
        <>
          <CircleAlertIcon
            aria-hidden
            className="size-4 text-destructive-text"
          />
          {onRetry ? (
            <Button
              variant="ghost"
              size="xs"
              aria-label={labels.retryItem(file.name)}
              onClick={() => onRetry(file.id)}
            >
              Retry
            </Button>
          ) : null}
        </>
      );
      break;
    case "cancelled":
      meta = labels.cancelledItem;
      state = null;
      break;
    case "interrupted":
      meta = labels.interrupted;
      state = onResume ? (
        <Button
          variant="outline"
          size="xs"
          aria-label={`${labels.chooseFile}: ${file.name}`}
          onClick={() => onResume(file.id)}
        >
          {labels.chooseFile}
        </Button>
      ) : null;
      break;
  }

  return (
    <li
      data-slot="upload-item"
      data-status={file.status}
      className={cn(
        "group/upload-row flex min-h-13 items-center gap-3 px-4 py-2 data-[status=cancelled]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {file.thumbnailUrl ? (
        <Image
          src={file.thumbnailUrl}
          alt=""
          aspectRatio="square"
          className={cn(
            "size-8 shrink-0",
            file.status === "cancelled" && "opacity-50",
          )}
          fallback={
            <FileTypeIcon
              contentType={file.contentType}
              name={file.name}
              tinted
              className="size-4"
            />
          }
        />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted">
          <FileTypeIcon
            contentType={file.contentType}
            name={file.name}
            tinted={file.status !== "cancelled"}
            className="size-4"
          />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <UploadName name={file.name} />
        <UploadMeta
          text={meta}
          tone={file.status === "failed" ? "error" : undefined}
          destination={file.destination}
          onOpen={onOpen}
        />
      </span>
      <span
        data-slot="upload-item-state"
        className="flex shrink-0 items-center gap-1"
      >
        {state}
      </span>
    </li>
  );
}

/** A folder's state, from its files. */
function folderStatus(files: UploadFile[]): UploadItemStatus {
  const has = (status: UploadItemStatus) =>
    files.some((f) => f.status === status);
  if (has("uploading") || has("queued")) return "uploading";
  if (has("finishing")) return "finishing";
  if (has("failed")) return "failed";
  if (has("interrupted")) return "interrupted";
  if (has("done")) return "done";
  return "cancelled";
}

/** Props accepted by `UploadGroup`. */
export interface UploadGroupProps
  extends
    Omit<React.ComponentPropsWithRef<"li">, "children">,
    UploadRowHandlers {
  /** The folder the row shows. */
  folder: UploadFolder;
  /**
   * Whether its files show (uncontrolled).
   * @default false
   */
  defaultExpanded?: boolean;
  /**
   * The most file rows it renders when expanded.
   * @default 200
   */
  maxRows?: number;
}

/**
 * `UploadGroup` — a folder upload as one row: the folder, "3 of 12 uploaded" and an aggregate
 * ring while it moves, "2 of 12 uploads failed" and Retry when something failed, and a chevron that
 * expands its files as `UploadItem` rows. Cancel and Retry call back with the folder's id.
 *
 * @example
 * <ul><UploadGroup folder={folder} onCancel={cancel} onRetry={retryFailedIn} /></ul>
 */
export function UploadGroup({
  folder,
  defaultExpanded = false,
  maxRows = 200,
  onCancel,
  onRetry,
  onResume,
  onOpen,
  className,
  ...props
}: UploadGroupProps) {
  const labels = React.useContext(UploadLabelsContext);
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const listId = React.useId();
  const { files } = folder;
  const status = folderStatus(files);
  const [mountedDone] = React.useState(status === "done");
  const total = files.length;
  const done = files.filter((f) => f.status === "done").length;
  const failed = files.filter((f) => f.status === "failed").length;
  const bytesTotal = files.reduce((sum, f) => sum + f.size, 0);
  const bytesDone = files.reduce(
    (sum, f) => sum + (f.status === "done" ? f.size : (f.bytesDone ?? 0)),
    0,
  );
  const percent = percentOf(bytesDone, bytesTotal, status === "done");

  let meta =
    status === "done"
      ? labels.files(total)
      : status === "failed"
        ? labels.failed(failed, total)
        : status === "cancelled"
          ? labels.cancelledItem
          : labels.folderProgress(done, total);
  if (status === "uploading") meta += ` · ${percent}%`;

  let state: React.ReactNode = null;
  if (status === "uploading")
    state = (
      <CancelSwap
        glyph={<UploadRing value={percent} label={folder.name} />}
        label={labels.cancelItem(folder.name)}
        onCancel={onCancel && (() => onCancel(folder.id))}
      />
    );
  else if (status === "finishing")
    state = (
      <LoaderIcon
        aria-hidden
        className="size-4 animate-spin text-muted-foreground"
      />
    );
  else if (status === "done")
    state = (
      <CircleCheckIcon
        aria-hidden
        className={cn(
          "size-5 text-success-text",
          !mountedDone && "motion-pop-in",
        )}
      />
    );
  else if (status === "failed")
    state = (
      <>
        <CircleAlertIcon aria-hidden className="size-4 text-destructive-text" />
        {onRetry ? (
          <Button
            variant="ghost"
            size="xs"
            aria-label={labels.retryItem(folder.name)}
            onClick={() => onRetry(folder.id)}
          >
            Retry
          </Button>
        ) : null}
      </>
    );

  return (
    <li
      data-slot="upload-group"
      data-status={status}
      data-expanded={expanded}
      className={cn("flex flex-col", className)}
      {...props}
    >
      <div className="group/upload-row flex min-h-13 items-center gap-3 px-4 py-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted">
          <FolderIcon aria-hidden className="size-4 text-muted-foreground" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm" title={folder.name}>
            {folder.name}
          </span>
          <UploadMeta
            text={meta}
            tone={status === "failed" ? "error" : undefined}
            destination={folder.destination}
            onOpen={onOpen}
          />
        </span>
        <span
          data-slot="upload-item-state"
          className="flex shrink-0 items-center gap-1"
        >
          {state}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={labels.showFiles(folder.name)}
            aria-expanded={expanded}
            aria-controls={expanded ? listId : undefined}
            onClick={() => setExpanded((open) => !open)}
            className={DISCLOSURE}
          >
            <ChevronDownIcon
              className={cn("transition-transform", expanded && "rotate-180")}
            />
          </Button>
        </span>
      </div>
      {expanded ? (
        <ul id={listId} data-slot="upload-group-files" className="ps-6">
          {files.slice(0, maxRows).map((file) => (
            <UploadItem
              key={file.id}
              file={file}
              onCancel={onCancel}
              onRetry={onRetry}
              onResume={onResume}
              onOpen={onOpen}
            />
          ))}
          {files.length > maxRows ? (
            <li className="px-4 py-2 text-xs text-muted-foreground">
              {labels.more(files.length - maxRows)}
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

/** Props accepted by `UploadPanel`. */
export interface UploadPanelProps
  extends
    Omit<React.ComponentPropsWithRef<"section">, "children">,
    UploadRowHandlers {
  /** The rows: files and folders, in the order to show them. An empty list renders nothing. */
  items: UploadEntry[];
  /** The batch totals and state. */
  summary: UploadSummary;
  /**
   * Whether the list is folded to the header (controlled; ignored by the compact bar, which
   * opens the list in a sheet).
   * @default false
   */
  collapsed?: boolean;
  /** Called when the person folds or unfolds the list.
   * @default undefined
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Cancel everything still moving (the close confirm and the footer's Cancel all).
   * @default undefined
   */
  onCancelAll?: () => void;
  /** Retry every failed file (the footer's Retry failed).
   * @default undefined
   */
  onRetryFailed?: () => void;
  /** The panel asks to go: closed when idle, after a confirmed cancel, or by the done card's timer.
   * @default undefined
   */
  onDismiss?: () => void;
  /**
   * How long the done card stays before it calls `onDismiss`, paused while hovered or focused;
   * `0` keeps it until closed.
   * @default 8000
   */
  autoDismissMs?: number;
  /**
   * Show the compact bar that opens the list in a sheet (a dialog on a wide screen). Unset, it
   * follows the viewport: the bar below 768px, the card from there up.
   * @default undefined
   */
  compact?: boolean;
  /**
   * The most rows it renders; the rest are counted on a closing line.
   * @default 200
   */
  maxRows?: number;
  /**
   * Any wording to replace.
   * @default undefined
   */
  labels?: Partial<UploadPanelLabels>;
}

/** The space the panel keeps between itself and a toast stack above it. */
const TOAST_GAP_PX = 8;
/** The Toast viewport's own bottom offset, which the inset is added to. */
const TOAST_OFFSET_PX = 16;

/**
 * `UploadPanel` — the uploads card pinned bottom-end: a header that names the batch ("Uploading 3
 * items", time left and bytes), collapse and close, then every file and folder row with its
 * progress, failures and destination. Closing while uploads are moving asks first. When the batch
 * finishes cleanly it shrinks into a done card that dismisses itself; on a phone it is a bar that
 * opens the list in a bottom sheet. Controlled: the host's engine passes `items` and `summary`.
 *
 * @example
 * <UploadPanel
 *   items={uploads.items}
 *   summary={uploads.summary}
 *   collapsed={collapsed}
 *   onCollapsedChange={setCollapsed}
 *   onCancel={uploads.cancel}
 *   onRetry={uploads.retry}
 *   onResume={uploads.resume}
 *   onOpen={router.push}
 *   onCancelAll={uploads.cancelAll}
 *   onRetryFailed={uploads.retryFailed}
 *   onDismiss={uploads.clear}
 * />
 */
export function UploadPanel({
  items,
  summary,
  collapsed = false,
  onCollapsedChange,
  onCancel,
  onRetry,
  onResume,
  onOpen,
  onCancelAll,
  onRetryFailed,
  onDismiss,
  autoDismissMs = 8000,
  compact,
  maxRows = 200,
  labels: labelOverrides,
  className,
  ...props
}: UploadPanelProps) {
  const labels = React.useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelOverrides }),
    [labelOverrides],
  );
  const viewportMobile = useIsMobile();
  const mobile = compact ?? viewportMobile;
  const { announce, Announcer } = useAnnouncer();
  const [root, setRoot] = React.useState<HTMLElement | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  // The sheet exists only in the compact form: leaving it (a resize to desktop) closes it, or the
  // done card would stay paused by a sheet nobody can see.
  if (!mobile && sheetOpen) setSheetOpen(false);
  const [confirm, setConfirm] = React.useState<"close" | "cancel-all" | null>(
    null,
  );
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  // Where focus was before it entered the panel, to hand it back when the panel goes.
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  // What the confirm resolved to, read by its `finalFocus`.
  const outcomeRef = React.useRef<"kept" | "cancelled" | "dismissed">("kept");
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  // The done card reopens as the list on request; a new batch resets that.
  const [doneOpened, setDoneOpened] = React.useState(false);
  const [status, setStatus] = React.useState(summary.status);
  if (status !== summary.status) {
    setStatus(summary.status);
    if (summary.status !== "done") setDoneOpened(false);
  }
  const doneCard = summary.status === "done" && !doneOpened;
  const remaining = Math.max(
    0,
    summary.total - summary.done - summary.failed - summary.cancelled,
  );
  const active = summary.status === "uploading" && remaining > 0;
  const visible = items.length > 0;

  const title =
    summary.status === "uploading"
      ? labels.uploading(remaining)
      : summary.failed > 0
        ? labels.failed(summary.failed, summary.total)
        : summary.done > 0
          ? labels.complete(summary.done)
          : labels.cancelled;
  const subtitle = active
    ? [
        summary.timeLeftMs == null ? null : formatTimeLeft(summary.timeLeftMs),
        summary.bytesTotal > 0
          ? formatBytesProgress(summary.bytesDone, summary.bytesTotal)
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const percent = percentOf(summary.bytesDone, summary.bytesTotal);

  // Milestones only, never every tick: the batch starting, a new failure, and its final state.
  // A failure while others still upload is announced as the failure, not as "Uploading…".
  const milestone = `${summary.status}:${summary.failed}`;
  const milestoneSpeech =
    summary.status === "uploading" && summary.failed > 0
      ? labels.failed(summary.failed, summary.total)
      : title;
  const milestoneText = React.useRef(milestoneSpeech);
  React.useEffect(() => {
    milestoneText.current = milestoneSpeech;
  });
  React.useEffect(() => {
    if (visible) announce(milestoneText.current);
  }, [milestone, visible, announce]);

  // Toasts rise above the panel while it is on screen.
  React.useLayoutEffect(() => {
    if (!root) return;
    const host = document.documentElement;
    const measure = () =>
      host.style.setProperty(
        "--upload-panel-inset",
        `${Math.max(0, Math.round(window.innerHeight - root.getBoundingClientRect().top + TOAST_GAP_PX - TOAST_OFFSET_PX))}px`,
      );
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      host.style.removeProperty("--upload-panel-inset");
    };
  }, [root]);

  // The done card closes itself, unless the person is reading it.
  const dismissRef = React.useRef(onDismiss);
  React.useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);
  const paused = hovered || focused || sheetOpen;
  React.useEffect(() => {
    if (!doneCard || paused || !autoDismissMs || !visible) return;
    const timer = window.setTimeout(
      () => dismissRef.current?.(),
      autoDismissMs,
    );
    return () => window.clearTimeout(timer);
  }, [doneCard, paused, autoDismissMs, visible]);

  if (!visible) return <Announcer />;

  /** Focus outside the panel before it goes: where focus came from, else the main region. */
  const focusOutside = (): HTMLElement | null => {
    const previous = returnFocusRef.current;
    if (previous?.isConnected && !root?.contains(previous)) return previous;
    const main = document.querySelector<HTMLElement>("main, [role='main']");
    if (main && !main.hasAttribute("tabindex"))
      main.setAttribute("tabindex", "-1");
    return main;
  };
  const dismiss = () => {
    if (root?.contains(document.activeElement))
      focusOutside()?.focus({ preventScroll: true });
    onDismiss?.();
  };
  const requestClose = () => {
    if (active) setConfirm("close");
    else dismiss();
  };
  const confirmCancel = () => {
    const intent = confirm;
    outcomeRef.current = intent === "close" ? "dismissed" : "cancelled";
    setConfirm(null);
    onCancelAll?.();
    if (intent === "close") onDismiss?.();
  };
  // After the confirm: Keep returns to the button that opened it; Cancel all to the panel's close
  // button (Cancel all itself is gone); a dismissal to where focus was before the panel.
  const confirmFinalFocus = () => {
    const outcome = outcomeRef.current;
    outcomeRef.current = "kept";
    if (outcome === "dismissed") return focusOutside() ?? true;
    if (outcome === "cancelled") return closeRef.current ?? true;
    return true;
  };

  const glyph =
    summary.status === "done" ? (
      <CircleCheckIcon
        aria-hidden
        className="size-5 shrink-0 text-success-text"
      />
    ) : summary.status === "failed" ? (
      <CircleAlertIcon
        aria-hidden
        className="size-5 shrink-0 text-destructive-text"
      />
    ) : null;

  const visibleItems = items.slice(0, maxRows);
  const list = (
    <ul
      data-slot="upload-panel-list"
      aria-label={labels.region}
      className="py-1"
    >
      {visibleItems.map((entry) =>
        entry.type === "folder" ? (
          <UploadGroup
            key={entry.id}
            folder={entry}
            maxRows={maxRows}
            onCancel={onCancel}
            onRetry={onRetry}
            onResume={onResume}
            onOpen={onOpen}
          />
        ) : (
          <UploadItem
            key={entry.id}
            file={entry}
            onCancel={onCancel}
            onRetry={onRetry}
            onResume={onResume}
            onOpen={onOpen}
          />
        ),
      )}
      {items.length > maxRows ? (
        <li className="px-4 py-2 text-xs text-muted-foreground">
          {labels.more(items.length - maxRows)}
        </li>
      ) : null}
    </ul>
  );

  const footerActions =
    (active && onCancelAll) || (summary.failed > 0 && onRetryFailed) ? (
      <>
        {summary.failed > 0 && onRetryFailed ? (
          <Button variant="ghost" size="sm" onClick={onRetryFailed}>
            {labels.retryFailed}
          </Button>
        ) : null}
        {active && onCancelAll ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirm("cancel-all")}
          >
            {labels.cancelAll}
          </Button>
        ) : null}
      </>
    ) : null;

  const closeButton = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={labels.close}
      ref={closeRef}
      onClick={requestClose}
    >
      <XIcon />
    </Button>
  );

  return (
    <UploadLabelsContext.Provider value={labels}>
      <section
        ref={setRoot}
        aria-label={labels.region}
        data-slot="upload-panel"
        data-state={
          doneCard ? "done" : mobile || collapsed ? "collapsed" : "expanded"
        }
        data-status={summary.status}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={(event) => {
          setFocused(true);
          const from = event.relatedTarget as HTMLElement | null;
          // Coming back from the panel's own confirm or sheet is not "where focus was".
          if (
            from &&
            !event.currentTarget.contains(from) &&
            !from.closest(
              '[data-slot="alert-dialog-content"], [data-slot="sheet-content"], [data-slot="dialog-content"]',
            )
          )
            returnFocusRef.current = from;
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setFocused(false);
        }}
        className={cn(
          "fixed end-4 bottom-[calc(var(--spacing)*4+env(safe-area-inset-bottom)+var(--dock-inset-bottom,0px))] z-50 flex flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground border border-border shadow-lg motion-enter-up",
          mobile ? "start-4" : "w-90 max-w-[calc(100vw-var(--spacing)*8)]",
          className,
        )}
        {...props}
      >
        {mobile ? (
          <div
            data-slot="upload-panel-header"
            className="flex items-center gap-1 p-1.5"
          >
            <Button
              variant="ghost"
              aria-haspopup="dialog"
              onClick={() => setSheetOpen(true)}
              className="h-auto min-w-0 flex-1 justify-start gap-3 px-2.5 py-1.5 text-start"
            >
              {glyph}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{title}</span>
                {subtitle ? (
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {subtitle}
                  </span>
                ) : null}
              </span>
              <ChevronUpIcon aria-hidden className="text-muted-foreground" />
            </Button>
            {closeButton}
          </div>
        ) : (
          <div
            data-slot="upload-panel-header"
            className="flex min-h-12 items-center gap-2 py-2 ps-4 pe-2"
          >
            {glyph}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{title}</span>
              {subtitle ? (
                <span className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </span>
              ) : null}
            </span>
            {doneCard ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={labels.expand}
                aria-expanded={false}
                onClick={() => setDoneOpened(true)}
              >
                <ChevronUpIcon />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={collapsed ? labels.expand : labels.collapse}
                aria-expanded={!collapsed}
                onClick={() => onCollapsedChange?.(!collapsed)}
                className={DISCLOSURE}
              >
                <ChevronDownIcon
                  className={cn(
                    "transition-transform",
                    collapsed && "rotate-180",
                  )}
                />
              </Button>
            )}
            {closeButton}
          </div>
        )}
        {active && (mobile || collapsed) ? (
          <Progress
            value={percent}
            aria-label={title}
            data-slot="upload-panel-progress"
            className="px-4 pb-3"
          />
        ) : null}
        {!mobile && !doneCard && !collapsed ? (
          <>
            <div className="max-h-[60dvh] overflow-y-auto border-t">{list}</div>
            {footerActions ? (
              <div
                data-slot="upload-panel-footer"
                className="flex justify-end gap-1 border-t px-2 py-1.5"
              >
                {footerActions}
              </div>
            ) : null}
          </>
        ) : null}
        <Announcer />
      </section>

      {mobile ? (
        <ResponsiveDialog open={sheetOpen} onOpenChange={setSheetOpen}>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
              {subtitle ? (
                <ResponsiveDialogDescription>
                  {subtitle}
                </ResponsiveDialogDescription>
              ) : null}
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody className="-mx-4 px-0">
              {list}
            </ResponsiveDialogBody>
            {footerActions ? (
              <ResponsiveDialogFooter>{footerActions}</ResponsiveDialogFooter>
            ) : null}
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      ) : null}

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent size="sm" finalFocus={confirmFinalFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {labels.confirmTitle(remaining)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {labels.confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.keepUploading}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmCancel}>
              {labels.cancelUploads}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UploadLabelsContext.Provider>
  );
}

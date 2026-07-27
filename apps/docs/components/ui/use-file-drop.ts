// @vegastack use-file-drop@0.4.0 sha256-LwrW56g0ksG631wkTEUY+fxxnpCvDnpN703n9on+hOg=

"use client";

import * as React from "react";
import {
  useDropzone,
  type Accept,
  type DropzoneInputProps,
  type DropzoneRootProps,
  type FileRejection,
} from "react-dropzone";

/* ---
`use-file-drop` is the ONE file that imports the drop engine (`react-dropzone`,
sanctioned D4) — `dropzone` is a thin visual shell over it, and a rich-text editor
accepting a pasted image gets the acquisition logic with none of the surface. The
engine solves what hand-rolls reliably get wrong: the child-element `dragleave`
flapping (drag-depth counting), directory traversal via the FileSystem entries API,
`accept` matching, and keyboard activation of the drop surface. The engine's model
makes the ROOT the focusable control (`tabIndex=0`, Enter/Space opens the picker via
its own keydown handler) with the real `<input type=file>` as a hidden form bridge —
so `dropProps` carries the engine's root ref: a consumer needing its own ref must
MERGE it (see `dropzone.tsx`), never overwrite it, or the keyboard path and the
drag-depth counting both die silently.

What the engine does not own, and this hook adds in the system's vocabulary:
- the PASTE path (`onPaste` → `clipboardData.files`), which no drop library treats as
  acquisition even though a composer treats a pasted screenshot exactly like a drop;
- TYPED rejection reasons (`FileDropRejection`) aligned with the app-side per-file
  state machine that `AttachmentState` renders — one word list from acquisition to
  upload chrome;
- the ANNOUNCEMENT payload — accepted/rejected outcomes flow through a polite live
  region the consumer renders;
- the window-level `dragover`/`drop` `preventDefault` so a drop that misses the
  target does not navigate the browser away (on by default, opt-out).

Deliberately NOT done here:
- No upload machinery. Presigning, XHR progress, retries, and per-file lifecycle are
  app territory; `Attachment` renders that state, this hook only ACQUIRES files.
- No visual surface. `dropzone` composes this; consumers style off
  `isDragging`/`isDragInvalid` and the `data-*` flags in `dropProps`.
--- */

/** Why one file was refused — the system's typed rejection vocabulary. */
export type FileDropRejectionReason =
  | "file-invalid-type"
  | "file-too-large"
  | "file-too-small"
  | "too-many-files"
  | "validation-failed";

/** One refused file with every reason that applied. */
export interface FileDropRejection {
  /** The refused file. */
  file: File;
  /** Every reason that applied. */
  reasons: FileDropRejectionReason[];
}

/** Options for {@link useFileDrop}. */
export interface UseFileDropOptions {
  /** Receives the accepted files of each drop/paste/browse batch. */
  onFilesAccepted: (files: File[]) => void;
  /**
   * Receives the refused files of a batch, with typed reasons.

   * @default undefined
   */
  onFilesRejected?: (rejections: FileDropRejection[]) => void;
  /**
   * Accepted types, MIME-to-extensions (react-dropzone's `Accept` shape):
   * `{ "image/*": [".png", ".jpg"] }`.

   * @default undefined
   */
  accept?: Accept;
  /**
   * Allow more than one file per batch.
   * @default true
   */
  multiple?: boolean;
  /** Per-file maximum size in bytes.
   * @default undefined
   */
  maxSize?: number;
  /** Per-file minimum size in bytes.
   * @default undefined
   */
  minSize?: number;
  /** Maximum files per batch.
   * @default undefined
   */
  maxFiles?: number;
  /**
   * Disable acquisition entirely.
   * @default false
   */
  disabled?: boolean;
  /**
   * Also accept files pasted from the clipboard while focus is inside the
   * drop surface.
   * @default true
   */
  paste?: boolean;
  /**
   * Keep a document-level guard armed so a missed FILE drop never navigates
   * the browser away. The guard is shared and ref-counted across every
   * mounted hook on the page (it stays armed while ANY instance wants it),
   * and it is payload-scoped: only drags carrying files are cancelled — text
   * dragged into an unrelated input keeps working.
   * @default true
   */
  preventWindowDrop?: boolean;
}

/** What {@link useFileDrop} returns. */
export interface UseFileDropReturn {
  /**
   * Spread onto the drop surface element. Carries the engine's drag handlers,
   * the paste handler, and `data-dragging` / `data-drag-invalid` flags for the
   * `group-data-[…]` styling idiom.
   */
  dropProps: DropzoneRootProps & {
    onPaste: (event: React.ClipboardEvent) => void;
    "data-dragging": "" | undefined;
    "data-drag-invalid": "" | undefined;
  };
  /** Spread onto the visually hidden `<input type="file">`. */
  inputProps: DropzoneInputProps;
  /** A drag is over the surface. */
  isDragging: boolean;
  /** The dragged payload cannot be accepted. */
  isDragInvalid: boolean;
  /** Open the file browser programmatically. A no-op while `disabled`. */
  open: () => void;
  /** Props for the consumer-rendered polite live region. */
  getLiveRegionProps: () => {
    role: "status";
    "aria-live": "polite";
    "aria-atomic": "true";
    className: string;
    children: React.ReactNode;
  };
}

/** Collapse the engine's error codes into the typed vocabulary. */
function toReason(code: string): FileDropRejectionReason {
  switch (code) {
    case "file-invalid-type":
    case "file-too-large":
    case "file-too-small":
    case "too-many-files":
      return code;
    default:
      return "validation-failed";
  }
}

/** Spoken form of each reason — announcements must say WHY (WCAG 3.3.1). */
const REASON_TEXT: Record<FileDropRejectionReason, string> = {
  "file-invalid-type": "wrong type",
  "file-too-large": "too large",
  "file-too-small": "too small",
  "too-many-files": "too many files",
  "validation-failed": "not accepted",
};

function refusalText(rejections: readonly FileDropRejection[]): string {
  const reasons = [...new Set(rejections.flatMap((r) => r.reasons))]
    .map((reason) => REASON_TEXT[reason])
    .join(", ");
  return rejections.length === 1
    ? `${rejections[0]!.file.name} was refused — ${reasons}`
    : `${rejections.length} files were refused — ${reasons}`;
}

/**
 * Paste-path `accept` matching, mirroring the file-picker's attribute
 * semantics: a file passes if EITHER its MIME type matches a key (including
 * `type/*` wildcards) or its extension matches a listed extension.
 */
function pasteAccepted(file: File, accept: Accept | undefined): boolean {
  if (!accept) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const mimeOk = Object.keys(accept).some((pattern) => {
    const wanted = pattern.trim().toLowerCase();
    if (wanted.endsWith("/*")) return type.startsWith(wanted.slice(0, -1));
    return type === wanted;
  });
  const extOk = Object.values(accept)
    .flat()
    .some((extension) => name.endsWith(extension.toLowerCase()));
  return mimeOk || extOk;
}

/**
 * The shared document-level missed-drop guard. Module-scoped and
 * ref-counted: one listener pair serves every mounted hook, armed while ANY
 * instance wants protection — so one instance's opt-out cannot be silently
 * re-armed page-wide by another, and unmounting the last instance disarms
 * it. Payload-scoped on purpose: only drags carrying files are cancelled,
 * so text dragged into an unrelated textarea keeps working.
 */
let windowGuardCount = 0;
function guardWindowDrag(event: DragEvent) {
  if (
    event.dataTransfer &&
    Array.from(event.dataTransfer.types).includes("Files")
  )
    event.preventDefault();
}
function armWindowFileDropGuard(): () => void {
  windowGuardCount += 1;
  if (windowGuardCount === 1) {
    window.addEventListener("dragover", guardWindowDrag);
    window.addEventListener("drop", guardWindowDrag);
  }
  return () => {
    windowGuardCount -= 1;
    if (windowGuardCount === 0) {
      window.removeEventListener("dragover", guardWindowDrag);
      window.removeEventListener("drop", guardWindowDrag);
    }
  };
}

/**
 * `useFileDrop` — file acquisition (drop, browse, paste) over the sanctioned
 * `react-dropzone` engine, returning `{ dropProps, inputProps, isDragging,
 * isDragInvalid }` plus the announcement live region. The `dropzone` component
 * is a thin shell over this; compose the hook directly when a surface (a
 * rich-text composer) wants the behaviour without the chrome.
 *
 * @example
 * const drop = useFileDrop({
 *   accept: { "image/*": [".png", ".jpg", ".webp"] },
 *   onFilesAccepted: (files) => stageUploads(files),
 * });
 * // <div {...drop.dropProps}> <input {...drop.inputProps} /> … </div>
 * // <span {...drop.getLiveRegionProps()} />
 */
export function useFileDrop({
  onFilesAccepted,
  onFilesRejected,
  accept,
  multiple = true,
  maxSize,
  minSize,
  maxFiles,
  disabled = false,
  paste = true,
  preventWindowDrop = true,
}: UseFileDropOptions): UseFileDropReturn {
  const [announcement, setAnnouncementState] = React.useState({
    text: "",
    seq: 0,
  });
  const announce = React.useCallback((text: string) => {
    setAnnouncementState((prev) => ({ text, seq: prev.seq + 1 }));
  }, []);

  const acceptedRef = React.useRef(onFilesAccepted);
  acceptedRef.current = onFilesAccepted;
  const rejectedRef = React.useRef(onFilesRejected);
  rejectedRef.current = onFilesRejected;

  const handleBatch = React.useCallback(
    (accepted: File[], rejections: readonly FileRejection[]) => {
      if (accepted.length > 0) acceptedRef.current(accepted);
      const typed: FileDropRejection[] = rejections.map((rejection) => ({
        file: rejection.file,
        reasons: rejection.errors.map((error) => toReason(error.code)),
      }));
      if (typed.length > 0) rejectedRef.current?.(typed);
      // Voice: counts only when they inform; no "successfully".
      const parts: string[] = [];
      if (accepted.length > 0)
        parts.push(
          accepted.length === 1
            ? `Added ${accepted[0]!.name}`
            : `Added ${accepted.length} files`,
        );
      if (typed.length > 0) parts.push(refusalText(typed));
      if (parts.length > 0) announce(parts.join(" · "));
    },
    [announce],
  );

  const dropzone = useDropzone({
    accept,
    multiple,
    maxSize,
    minSize,
    maxFiles,
    disabled,
    // The engine's own document-level cancellation is payload-BLIND (it
    // kills text drags into unrelated inputs) and per-instance (one default
    // instance re-arms it for the whole page, defeating another instance's
    // opt-out). Always off — the ref-counted, Files-scoped guard below owns
    // this concern.
    preventDropOnDocument: false,
    onDrop: (accepted, rejections) => handleBatch(accepted, rejections),
  });

  // A missed FILE drop must never navigate the browser away.
  React.useEffect(() => {
    if (!preventWindowDrop) return;
    return armWindowFileDropGuard();
  }, [preventWindowDrop]);

  const handlePaste = React.useCallback(
    (event: React.ClipboardEvent) => {
      if (!paste || disabled) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) return;
      event.preventDefault();
      // The engine only sees drops — pasted files reuse the same constraint
      // set: accept, per-file size bounds, and the batch cap all apply, with
      // the surplus (not the whole batch) refused as too-many-files, matching
      // the engine's drop semantics. `maxFiles: 0` means unlimited, as on drop.
      const limit =
        maxFiles !== undefined && maxFiles >= 1 ? maxFiles : Infinity;
      const cap = multiple ? limit : Math.min(limit, 1);
      const within = cap === Infinity ? files : files.slice(0, cap);
      const accepted: File[] = [];
      const rejections: FileDropRejection[] = [];
      for (const file of within) {
        const reasons: FileDropRejectionReason[] = [];
        if (!pasteAccepted(file, accept)) reasons.push("file-invalid-type");
        if (maxSize !== undefined && file.size > maxSize)
          reasons.push("file-too-large");
        if (minSize !== undefined && file.size < minSize)
          reasons.push("file-too-small");
        if (reasons.length > 0) rejections.push({ file, reasons });
        else accepted.push(file);
      }
      for (const file of files.slice(within.length))
        rejections.push({ file, reasons: ["too-many-files"] });
      if (accepted.length > 0) acceptedRef.current(accepted);
      if (rejections.length > 0) rejectedRef.current?.(rejections);
      if (accepted.length > 0 || rejections.length > 0)
        announce(
          [
            accepted.length > 0
              ? accepted.length === 1
                ? `Added ${accepted[0]!.name}`
                : `Added ${accepted.length} files`
              : null,
            rejections.length > 0 ? refusalText(rejections) : null,
          ]
            .filter(Boolean)
            .join(" · "),
        );
    },
    [paste, disabled, accept, maxFiles, maxSize, minSize, multiple, announce],
  );

  return {
    dropProps: {
      ...dropzone.getRootProps(),
      onPaste: handlePaste,
      "data-dragging": dropzone.isDragActive ? "" : undefined,
      "data-drag-invalid": dropzone.isDragReject ? "" : undefined,
    },
    inputProps: dropzone.getInputProps(),
    isDragging: dropzone.isDragActive,
    isDragInvalid: dropzone.isDragReject,
    // The engine nulls `open` while disabled; keep the declared type honest.
    open: () => {
      dropzone.open?.();
    },
    getLiveRegionProps: () => ({
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
      className: "sr-only",
      children: React.createElement(
        "span",
        { key: announcement.seq },
        announcement.text,
      ),
    }),
  };
}

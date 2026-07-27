// @vegastack use-file-drop@0.3.0 sha256-Sl0w7Yy8y1iEKYX8Z7ywg6knBmT5gMe0Xj+B2qbtFrU=

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
`accept` matching, and a keyboard-operable hidden `<input type=file>`.

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
   * Prevent the window-level default for stray `dragover`/`drop` so a missed
   * drop never navigates the browser away from the app.
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
  /** Open the file browser programmatically (the click-to-browse bridge). */
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
      if (typed.length > 0)
        parts.push(
          typed.length === 1
            ? `${typed[0]!.file.name} was refused`
            : `${typed.length} files were refused`,
        );
      if (parts.length > 0) announce(parts.join(" · "));
    },
    [announce],
  );

  const dropzone = useDropzone({
    accept,
    multiple,
    maxSize,
    maxFiles,
    disabled,
    onDrop: (accepted, rejections) => handleBatch(accepted, rejections),
  });

  // A missed drop must never navigate the browser away from the app.
  React.useEffect(() => {
    if (!preventWindowDrop) return;
    const prevent = (event: DragEvent) => {
      event.preventDefault();
    };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, [preventWindowDrop]);

  const handlePaste = React.useCallback(
    (event: React.ClipboardEvent) => {
      if (!paste || disabled) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) return;
      event.preventDefault();
      // The engine only sees drops — pasted files reuse the same batch path
      // (size/count limits enforced here; `accept` matching is drop/browse
      // territory where the picker already filters).
      const limited = maxFiles !== undefined ? files.slice(0, maxFiles) : files;
      const accepted: File[] = [];
      const rejections: FileDropRejection[] = [];
      for (const file of multiple ? limited : limited.slice(0, 1)) {
        if (maxSize !== undefined && file.size > maxSize)
          rejections.push({ file, reasons: ["file-too-large"] });
        else accepted.push(file);
      }
      for (const file of files.slice(limited.length))
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
            rejections.length > 0
              ? `${rejections.length} pasted ${rejections.length === 1 ? "file was" : "files were"} refused`
              : null,
          ]
            .filter(Boolean)
            .join(" · "),
        );
    },
    [paste, disabled, maxFiles, maxSize, multiple, announce],
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
    open: dropzone.open,
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

// @vegastack dropzone@0.3.0 sha256-3ZJPUxmBZxPPNt6okQUIDBURO9PRZxNboRM8LNNp6DY=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  useFileDrop,
  type FileDropRejection,
  type UseFileDropOptions,
} from "@/components/ui/use-file-drop";

/* ---
`Dropzone` is deliberately THIN: acquisition only. Everything behavioural — drag-depth
handling, directory traversal, accept matching, the paste path, typed rejections, the
announcements, the window-level preventDefault — lives in `use-file-drop`, so a
rich-text composer gets the behaviour with none of this surface. And everything after
acquisition — per-file upload state, progress, retries — is `Attachment`'s territory
("it owns no upload logic, only the visual state machine"): the two meet at a plain
`File[]` callback and share the rejection/state vocabulary.

The a11y story is SIMPLER with a real, visually hidden `<input type="file">` than any
div-based target: the input IS the control (named, focusable, keyboard-operable,
form-participating); the drop surface is decoration around it. That input is this
file's one `RAW_INTERACTIVE_EXEMPTIONS` entry — the engine's prop-getter must attach
to a native input, and no VegaStack control can substitute for the file-picker bridge.

Deliberately NOT done here:
- No `attachments` prop and no internal `Attachment` rendering — the host owns the
  staged-file list and its lifecycle.
- No dashed-border re-implementation. Consumers compose `Empty bordered` (its prop
  doc literally reads "the classic 'drop zone' look") or any content as children.
--- */

/** Props accepted by `Dropzone`. */
export interface DropzoneProps extends Omit<
  UseFileDropOptions,
  "onFilesAccepted" | "onFilesRejected"
> {
  /** Receives the accepted files of each drop/paste/browse batch. */
  onFilesAccepted: (files: File[]) => void;
  /**
   * Receives the refused files of a batch, with typed reasons.

   * @default undefined
   */
  onFilesRejected?: (rejections: FileDropRejection[]) => void;
  /**
   * Accessible name for the file input.
   * @default "Upload files"
   */
  "aria-label"?: string;
  /** The idle affordance — typically `Empty bordered` content. */
  children: React.ReactNode;
  /** Extra classes for the drop surface.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the drop surface (`data-slot="dropzone"`).

   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * `Dropzone` — the visual shell over `use-file-drop`: a click-to-browse,
 * drop-and-paste surface with a real hidden `<input type="file">` as the
 * accessible control. Styling hooks: `data-dragging` and `data-drag-invalid`
 * on the surface for the `group-data-[…]` idiom.
 *
 * @example
 * <Dropzone
 *   accept={{ "image/*": [".png", ".jpg"] }}
 *   onFilesAccepted={(files) => stageUploads(files)}
 *   onFilesRejected={(rejections) => flagRejections(rejections)}
 * >
 *   <Empty size="sm" bordered>
 *     <EmptyHeader>
 *       <EmptyTitle>Drop images here</EmptyTitle>
 *       <EmptyDescription>or click to browse — PNG or JPG</EmptyDescription>
 *     </EmptyHeader>
 *   </Empty>
 * </Dropzone>
 * <AttachmentGroup>…render the staged files with Attachment…</AttachmentGroup>
 */
export function Dropzone({
  onFilesAccepted,
  onFilesRejected,
  "aria-label": ariaLabel = "Upload files",
  children,
  className,
  ref,
  ...options
}: DropzoneProps) {
  const drop = useFileDrop({ onFilesAccepted, onFilesRejected, ...options });
  const { "data-dragging": dragging, "data-drag-invalid": dragInvalid } =
    drop.dropProps;

  return (
    <>
      <div
        {...drop.dropProps}
        ref={ref}
        data-slot="dropzone"
        data-disabled={options.disabled ? "" : undefined}
        className={cn(
          "group/dropzone relative w-full min-w-0 cursor-pointer rounded-lg",
          // The whole surface reflects the drag: primary tint while a valid
          // payload hovers, destructive tint when it cannot be accepted.
          "data-dragging:[&_[data-slot=empty]]:border-primary/(--alpha-outline-border)",
          "data-drag-invalid:[&_[data-slot=empty]]:border-destructive/(--alpha-outline-border)",
          options.disabled && "pointer-events-none opacity-(--opacity-dim)",
          className,
        )}
        data-dragging={dragging}
        data-drag-invalid={dragInvalid}
      >
        {/* The REAL control: named, focusable, keyboard-operable. */}
        <input {...drop.inputProps} aria-label={ariaLabel} />
        {children}
      </div>
      <span {...drop.getLiveRegionProps()} />
    </>
  );
}

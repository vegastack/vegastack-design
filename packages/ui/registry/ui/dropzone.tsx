// @vegastack dropzone@0.7.2 sha256-i5MJ3dIxRHH1gNnuFkgQ5IV5XilrJx0kzKEPxNY8J5g=

"use client";

import * as React from "react";
import { cn, mergeRefs } from "@vegastack/design";
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

The a11y model is the ENGINE'S, made honest: the drop surface is the focusable
control (`role="button"`, named via `aria-label`, `tabIndex=0`, Enter/Space opens the
picker through the engine's keydown), and the real `<input type="file">` behind it is
the display:none form/picker bridge — not a tab stop. The engine's root ref is
load-bearing (keyboard activation AND drag-depth counting both check it), so the
consumer ref is MERGED with it below, never assigned over it. That input is this
file's one `RAW_INTERACTIVE_EXEMPTIONS` entry — the engine's prop-getter must attach
to a native input, and no VegaStack control can substitute for the file-picker bridge.

Deliberately NOT done here:
- No `attachments` prop and no internal `Attachment` rendering — the host owns the
  staged-file list and its lifecycle.
- No dashed-border re-implementation. Consumers compose `Empty variant="dashed"` (its prop
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
   * Accessible name for the drop surface (the focusable control).
   * @default "Upload files"
   */
  "aria-label"?: string;
  /** The idle affordance — typically `Empty variant="dashed"` content. */
  children: React.ReactNode;
  /**
   * Force the drag-over presentation without a real drag. A drag-over state can only be produced
   * by a live `DataTransfer`, which a static documentation example and the behaviour-contract lane
   * cannot synthesise — so the two states would otherwise be undocumented and unverified. It
   * paints only: the engine still owns the real `data-dragging`/`data-drag-invalid` attributes and
   * a live drag always wins over this prop.
   * @default undefined
   */
  dragState?: "dragging" | "drag-invalid";
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
 * accessible control. The surface itself outlines while a payload hovers —
 * primary when it can be accepted, destructive when it cannot — so the feedback
 * does not depend on what is inside it. `data-dragging` and `data-drag-invalid`
 * stay on the surface for the `group-data-[…]/dropzone` idiom, so a child can
 * follow the drag state — an `Empty variant="dashed"`, say, tinting its border
 * in step with the outline.
 *
 * @example
 * <Dropzone
 *   accept={{ "image/*": [".png", ".jpg"] }}
 *   onFilesAccepted={(files) => stageUploads(files)}
 *   onFilesRejected={(rejections) => flagRejections(rejections)}
 * >
 *   <Empty size="sm" variant="dashed">
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
  dragState,
  className,
  ref,
  ...options
}: DropzoneProps) {
  const drop = useFileDrop({ onFilesAccepted, onFilesRejected, ...options });
  const {
    "data-dragging": dragging,
    "data-drag-invalid": dragInvalid,
    ref: engineRef,
    ...surfaceProps
  } = drop.dropProps as typeof drop.dropProps & {
    ref: React.RefObject<HTMLDivElement | null>;
  };
  // Both refs are load-bearing: the engine's gates its keyboard + drag-depth
  // paths on rootRef; the consumer's is the public contract. Merge, never pick.
  const mergedRef = React.useMemo(
    () => mergeRefs(engineRef, ref),
    [engineRef, ref],
  );

  return (
    <>
      <div
        {...surfaceProps}
        ref={mergedRef}
        role="button"
        aria-label={ariaLabel}
        aria-disabled={options.disabled ? true : undefined}
        data-slot="dropzone"
        data-disabled={options.disabled ? "" : undefined}
        className={cn(
          "group/dropzone relative w-full min-w-0 cursor-pointer rounded-lg",
          // The SURFACE reflects the drag, not one privileged descendant: an
          // outline hugging its own `rounded-lg`, primary while a valid payload
          // hovers and destructive when it cannot be accepted. Before this the
          // tint was a `[&_[data-slot=empty]]` border override, so a Dropzone
          // wrapping an image, a card, or any non-`Empty` child showed no
          // drag-over state at all (audit B8-07). `outline` rather than `border`
          // so the feedback costs no layout — the child keeps its box.
          "outline-offset-0 data-dragging:outline-2 data-dragging:outline-primary/(--alpha-outline-border)",
          "data-drag-invalid:outline-2 data-drag-invalid:outline-destructive/(--alpha-outline-border)",
          options.disabled && "pointer-events-none opacity-(--opacity-dim)",
          className,
        )}
        data-dragging={dragging ?? (dragState === "dragging" ? "" : undefined)}
        data-drag-invalid={
          dragInvalid ?? (dragState === "drag-invalid" ? "" : undefined)
        }
      >
        {children}
      </div>
      {/* The form/picker bridge — display:none, never a tab stop, and a
          SIBLING of the surface: an interactive control may not contain
          another (axe nested-interactive). The engine reaches it by ref. */}
      <input {...drop.inputProps} />
      <drop.Announcer />
    </>
  );
}

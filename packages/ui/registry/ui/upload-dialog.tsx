// @vegastack upload-dialog@0.23.64 sha256-UkE20eqBJidyHpJe7ZwdEXb5TUVlHzYFhOHT9e1K4cA=

"use client";

import * as React from "react";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@vegastack/design";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropzone } from "@/components/ui/dropzone";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { FieldError } from "@/components/ui/field";
import { Image } from "@/components/ui/image";
import type {
  FileDropRejection,
  UseFileDropOptions,
} from "@/components/ui/use-file-drop";

/* ---
`UploadDialog` is the "Add files" flow in one modal: a drop zone and the staged list first, then —
only when the host passes `renderDetails` — a second view where the host asks for each file's
properties (a name, a category). It owns acquisition and staging only: nothing uploads here.
`onSubmit` hands the staged files back and the dialog closes, so the host's upload queue (and its
progress on the host's own tiles) carries on after the dialog is gone.

Deliberately NOT done here:
- No upload machinery, progress or retry — `Attachment` tiles on the host page render that.
- No stepper chrome: the details view simply replaces the files view, with Back in the footer.
- No per-file form state — the host keeps it, keyed by `UploadDialogFile.id`.
--- */

/** One staged file. */
export interface UploadDialogFile {
  /** Stable key for the staged file (unique within the dialog's life). */
  id: string;
  /** The file itself. */
  file: File;
  /**
   * A local preview link for an image (an object URL the dialog revokes when it resets), or null.
   */
  previewUrl: string | null;
}

/** Props accepted by `UploadDialog`. */
export interface UploadDialogProps extends Pick<
  UseFileDropOptions,
  "accept" | "maxSize" | "multiple"
> {
  /** Whether the dialog is open (controlled). */
  open: boolean;
  /** Called when the dialog asks to open or close. */
  onOpenChange: (open: boolean) => void;
  /**
   * The dialog title.
   * @default "Add files"
   */
  title?: string;
  /**
   * A line under the title.
   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * The drop area's title.
   * @default "Drop files here"
   */
  dropTitle?: React.ReactNode;
  /**
   * The drop area's hint — the accepted types and limits.
   * @default "or click to browse"
   */
  dropHint?: React.ReactNode;
  /**
   * The most files that can be staged; extra files are refused with a message.
   * @default undefined
   */
  maxFiles?: number;
  /**
   * Refuse a file with a message (return null to accept it) — per-type size limits, formats the
   * host can't take.
   * @default undefined
   */
  validate?: (file: File) => string | null;
  /**
   * The details view: one row per staged file, with the host's fields. Without it the dialog
   * has one view and its primary action submits.
   * @default undefined
   */
  renderDetails?: (
    files: UploadDialogFile[],
    helpers: { remove: (id: string) => void },
  ) => React.ReactNode;
  /**
   * Whether the details are complete for these files; false disables Add.
   * @default undefined
   */
  detailsValid?: (files: UploadDialogFile[]) => boolean;
  /**
   * The submit button's label.
   * @default "Add"
   */
  submitLabel?: string;
  /** Receives the staged files; the dialog then closes. */
  onSubmit: (files: UploadDialogFile[]) => void;
}

const REJECTED: Record<string, (name: string) => string> = {
  "file-invalid-type": (name) => `${name} isn't a supported file type.`,
  "file-too-large": (name) => `${name} is too large.`,
  "file-too-small": (name) => `${name} is empty.`,
};

/** A byte count as a short size: `820 KB`, `4.2 MB`. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toLocaleString("en", { maximumFractionDigits: value < 10 ? 1 : 0 })} ${units[unit]}`;
}

/** A staged file's media: the image's local preview, or a file icon. */
function UploadDialogMedia({ file }: { file: UploadDialogFile }) {
  return file.previewUrl ? (
    <AttachmentMedia variant="image">
      <Image src={file.previewUrl} alt="" aspectRatio="square" />
    </AttachmentMedia>
  ) : (
    <AttachmentMedia>
      <FileText aria-hidden />
    </AttachmentMedia>
  );
}

/** Props accepted by `UploadDialogFileRow`. */
export interface UploadDialogFileRowProps extends React.ComponentProps<"div"> {
  /** The staged file the row describes. */
  file: UploadDialogFile;
}

/**
 * A details-view row: the staged file's thumbnail or icon beside the host's fields.
 *
 * @example
 * <UploadDialogFileRow file={f}>
 *   <Field>…name…</Field>
 *   <Field>…category…</Field>
 * </UploadDialogFileRow>
 */
function UploadDialogFileRow({
  file,
  className,
  children,
  ...props
}: UploadDialogFileRowProps) {
  return (
    <Attachment
      className={cn("w-full flex-nowrap items-start", className)}
      {...props}
    >
      <UploadDialogMedia file={file} />
      <AttachmentContent className="flex flex-col gap-3">
        {children}
      </AttachmentContent>
    </Attachment>
  );
}

/**
 * `UploadDialog` — the "Add files" modal: drop or browse, review the staged files (thumbnail or
 * icon, name, size, ×), then Next to the host's per-file details (`renderDetails`) and Add. Without
 * `renderDetails` the primary action adds at once. It stages files only; the host uploads them.
 *
 * @example
 * <Button variant="outline" onClick={() => setOpen(true)}><Plus />Add files</Button>
 * <UploadDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   dropHint="Images up to 20 MB, other files up to 500 MB"
 *   renderDetails={(files) => files.map((f) => (
 *     <UploadDialogFileRow key={f.id} file={f}>…fields…</UploadDialogFileRow>
 *   ))}
 *   onSubmit={(files) => startUploads(files)}
 * />
 */
function UploadDialog({
  open,
  onOpenChange,
  title = "Add files",
  description,
  dropTitle = "Drop files here",
  dropHint = "or click to browse",
  accept,
  maxSize,
  multiple = true,
  maxFiles,
  validate,
  renderDetails,
  detailsValid,
  submitLabel = "Add",
  onSubmit,
}: UploadDialogProps) {
  const baseId = React.useId();
  const counter = React.useRef(0);
  const [files, setFiles] = React.useState<UploadDialogFile[]>([]);
  const [stage, setStage] = React.useState<"files" | "details">("files");
  const [errors, setErrors] = React.useState<string[]>([]);
  // The object URLs this dialog made, revoked on reset and on unmount.
  const urls = React.useRef(new Set<string>());

  const revoke = React.useCallback((url: string | null) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    urls.current.delete(url);
  }, []);
  React.useEffect(() => {
    const made = urls.current;
    return () => made.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function reset() {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
    setFiles([]);
    setErrors([]);
    setStage("files");
  }

  function stageFiles(accepted: File[]) {
    const next: UploadDialogFile[] = [];
    const refused: string[] = [];
    const room =
      maxFiles === undefined ? Infinity : Math.max(0, maxFiles - files.length);
    for (const file of accepted) {
      const problem = validate?.(file) ?? null;
      if (problem) refused.push(problem);
      else if (next.length >= room)
        refused.push(
          `Only ${maxFiles} ${maxFiles === 1 ? "file" : "files"} can be added.`,
        );
      else {
        const previewUrl = /^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)
          ? URL.createObjectURL(file)
          : null;
        if (previewUrl) urls.current.add(previewUrl);
        counter.current += 1;
        next.push({ id: `${baseId}-${counter.current}`, file, previewUrl });
      }
    }
    setErrors([...new Set(refused)]);
    setFiles((list) => (multiple ? [...list, ...next] : next.slice(0, 1)));
  }

  function rejectFiles(rejections: FileDropRejection[]) {
    setErrors(
      rejections.map(({ file, reasons }) => {
        const reason = reasons.find((r) => REJECTED[r]);
        return reason
          ? REJECTED[reason]!(file.name)
          : `${file.name} can't be added.`;
      }),
    );
  }

  function remove(id: string) {
    setFiles((list) => {
      const gone = list.find((f) => f.id === id);
      if (gone) revoke(gone.previewUrl);
      const rest = list.filter((f) => f.id !== id);
      if (!rest.length) setStage("files");
      return rest;
    });
  }

  function submit() {
    if (!files.length) return;
    onSubmit(files);
    onOpenChange(false);
  }

  const details = stage === "details" && renderDetails !== undefined;
  const incomplete =
    details && detailsValid !== undefined && !detailsValid(files);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      onOpenChangeComplete={(next) => {
        if (!next) reset();
      }}
    >
      <DialogContent size="lg" data-slot="upload-dialog" data-stage={stage}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4 py-1">
          {details ? (
            <div
              data-slot="upload-dialog-details"
              className="flex flex-col gap-3"
            >
              {renderDetails(files, { remove })}
            </div>
          ) : (
            <>
              <Dropzone
                multiple={multiple}
                accept={accept}
                maxSize={maxSize}
                onFilesAccepted={stageFiles}
                onFilesRejected={rejectFiles}
                aria-label="Drop files here or browse"
                disabled={maxFiles !== undefined && files.length >= maxFiles}
              >
                <Empty className="border" icon={<Upload aria-hidden />}>
                  <EmptyHeader>
                    <EmptyTitle>{dropTitle}</EmptyTitle>
                    <EmptyDescription>{dropHint}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </Dropzone>
              {errors.length ? (
                <FieldError errors={errors.map((message) => ({ message }))} />
              ) : null}
              {files.length ? (
                <div
                  role="list"
                  aria-label="Files to add"
                  data-slot="upload-dialog-files"
                  className="flex flex-col gap-2"
                >
                  {files.map((f) => (
                    <Attachment
                      key={f.id}
                      role="listitem"
                      className="w-full flex-nowrap"
                    >
                      <UploadDialogMedia file={f} />
                      <AttachmentContent>
                        <AttachmentTitle>{f.file.name}</AttachmentTitle>
                        <AttachmentDescription>
                          {formatSize(f.file.size)}
                        </AttachmentDescription>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction
                          aria-label={`Remove ${f.file.name}`}
                          onClick={() => remove(f.id)}
                        >
                          <X aria-hidden />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </DialogBody>
        <DialogFooter>
          {details ? (
            <Button variant="outline" onClick={() => setStage("files")}>
              Back
            </Button>
          ) : (
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
          )}
          {renderDetails && !details ? (
            <Button
              disabled={!files.length}
              onClick={() => files.length && setStage("details")}
            >
              Next
            </Button>
          ) : (
            <Button
              disabled={!files.length || incomplete}
              onClick={() => {
                if (incomplete) return;
                submit();
              }}
            >
              {submitLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { UploadDialog, UploadDialogFileRow };

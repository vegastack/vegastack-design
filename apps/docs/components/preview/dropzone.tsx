"use client";

import { type ReactNode, useState } from "react";
import { X } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/dropzone` (dogfoods the registry) → auto-scanned.
import { Dropzone } from "@/components/ui/dropzone";
import type { FileDropRejection } from "@/components/ui/use-file-drop";
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { IconButton } from "@/components/ui/icon-button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

function formatSize(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function dropzone(): ReactNode {
  const [files, setFiles] = useState<File[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [removalAnnouncement, setRemovalAnnouncement] = useState("");

  const removeFile = (file: File, indexToRemove: number) => {
    setFiles((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );
    setRemovalAnnouncement(`Removed ${file.name}`);
  };

  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <Dropzone
          accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
          aria-label="Upload images"
          onFilesAccepted={(accepted) => {
            setFiles((prev) => [...prev, ...accepted]);
            setRejections([]);
          }}
          onFilesRejected={(refused) =>
            setRejections(
              refused.map(
                ({ file, reasons }) => `${file.name}: ${reasons.join(", ")}`,
              ),
            )
          }
        >
          <Empty size="sm" variant="dashed">
            <EmptyHeader>
              <EmptyTitle>Drop images here</EmptyTitle>
              <EmptyDescription>
                or click to browse — PNG, JPG, or WebP
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Dropzone>
        {files.length > 0 ? (
          <AttachmentGroup>
            {files.map((file, index) => (
              <Attachment key={`${file.name}-${index}`} state="complete">
                <AttachmentMedia />
                <AttachmentContent>
                  <AttachmentTitle>{file.name}</AttachmentTitle>
                  <AttachmentDescription>
                    {formatSize(file.size)}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <IconButton
                    aria-label={`Remove ${file.name}`}
                    variant="ghost"
                    size="xs"
                    onClick={() => removeFile(file, index)}
                  >
                    <X />
                  </IconButton>
                </AttachmentActions>
              </Attachment>
            ))}
          </AttachmentGroup>
        ) : null}
        {rejections.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm text-destructive-text">
            {rejections.map((rejection, index) => (
              <li key={`${rejection}-${index}`} className="min-w-0">
                {rejection}
              </li>
            ))}
          </ul>
        ) : null}
        <span className="sr-only" role="status" aria-live="polite">
          {removalAnnouncement}
        </span>
      </div>
    </Wrapper>
  );
}

export function dropzoneRejections(): ReactNode {
  const [log, setLog] = useState<Array<{ message: string; rejected: boolean }>>(
    [],
  );
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <Dropzone
          maxSize={200 * 1024}
          aria-label="Upload small files"
          onFilesAccepted={(accepted) =>
            setLog((prev) => [
              ...prev,
              ...accepted.map((f) => ({
                message: `Added ${f.name}`,
                rejected: false,
              })),
            ])
          }
          onFilesRejected={(rejections: FileDropRejection[]) =>
            setLog((prev) => [
              ...prev,
              ...rejections.map((r) => ({
                message: `${r.file.name}: ${r.reasons.join(", ")}`,
                rejected: true,
              })),
            ])
          }
        >
          <Empty size="sm" variant="dashed">
            <EmptyHeader>
              <EmptyTitle>Files up to 200 KB</EmptyTitle>
              <EmptyDescription>
                Anything larger is refused with a typed reason
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Dropzone>
        {log.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {log.slice(-4).map((entry, i) => (
              <li
                key={i}
                className={
                  entry.rejected
                    ? "min-w-0 text-destructive-text"
                    : "min-w-0 text-muted-foreground"
                }
              >
                {entry.message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Wrapper>
  );
}

/**
 * Drag-over states — `dragState` paints them without a live `DataTransfer`, which neither a static
 * documentation example nor the behaviour-contract lane can synthesise. The STROKE is on the
 * dropzone surface itself (audit B8-07), so the feedback survives a child that is not an `Empty`:
 * the third card here holds a plain panel and still gains it. An `Empty variant="dashed"` child can tint
 * its dashed border in step through `group-data-dragging/dropzone`.
 */
export function dropzoneDragging(): ReactNode {
  const noop = () => {};
  return (
    <Wrapper className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Dropzone
        aria-label="Valid payload"
        dragState="dragging"
        onFilesAccepted={noop}
      >
        <Empty
          size="sm"
          variant="dashed"
          className="group-data-dragging/dropzone:border-primary/(--alpha-outline-border)"
        >
          <EmptyHeader>
            <EmptyTitle>Release to upload</EmptyTitle>
            <EmptyDescription>A valid payload is hovering</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Dropzone>
      <Dropzone
        aria-label="Refused payload"
        dragState="drag-invalid"
        accept={{ "image/*": [".png"] }}
        onFilesAccepted={noop}
      >
        <Empty
          size="sm"
          variant="dashed"
          className="group-data-drag-invalid/dropzone:border-destructive/(--alpha-outline-border)"
        >
          <EmptyHeader>
            <EmptyTitle>Not accepted</EmptyTitle>
            <EmptyDescription>This file type is refused</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Dropzone>
      <Dropzone
        aria-label="Custom child"
        dragState="dragging"
        onFilesAccepted={noop}
      >
        <div className="rounded-lg bg-surface-1 p-4 text-center text-sm text-muted-foreground">
          A non-Empty child still shows the drag state — the stroke belongs to
          the surface.
        </div>
      </Dropzone>
    </Wrapper>
  );
}

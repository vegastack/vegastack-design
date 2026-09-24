"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  FileTextIcon,
  FileWarningIcon,
  RotateCwIcon,
  Trash2Icon,
  X,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/dropzone` (dogfoods the registry) → auto-scanned.
import { Dropzone } from "@/components/ui/dropzone";
import type { FileDropRejection } from "@/components/ui/use-file-drop";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentProgress,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          <Empty className="border">
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
              <Attachment key={`${file.name}-${index}`} state="done">
                <AttachmentMedia />
                <AttachmentContent>
                  <AttachmentTitle>{file.name}</AttachmentTitle>
                  <AttachmentDescription>
                    {formatSize(file.size)}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <Button
                    aria-label={`Remove ${file.name}`}
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeFile(file, index)}
                  >
                    <X />
                  </Button>
                </AttachmentActions>
              </Attachment>
            ))}
          </AttachmentGroup>
        ) : null}
        {rejections.length > 0 ? (
          <ul className="flex flex-col gap-1 text-xs text-destructive-text">
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
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Files up to 200 KB</EmptyTitle>
              <EmptyDescription>
                Anything larger is refused with a typed reason
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Dropzone>
        {log.length > 0 ? (
          <ul className="flex flex-col gap-1 text-xs">
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
 * the third card here holds a plain panel and still gains it. An `Empty className="border"` child can tint
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
        <Empty className="border group-data-dragging/dropzone:border-primary/50">
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
        <Empty className="border group-data-drag-invalid/dropzone:border-destructive/50">
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
        <div className="rounded-lg bg-muted p-4 text-center text-xs text-muted-foreground">
          A non-Empty child still shows the drag state — the stroke belongs to
          the surface.
        </div>
      </Dropzone>
    </Wrapper>
  );
}

/* ── Upload queue ─────────────────────────────────────────────────────────────────────────────── */

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const UPLOAD_KINDS = [
  { label: "Datasheet", value: "datasheet" },
  { label: "Product photo", value: "photo" },
  { label: "Certificate", value: "certificate" },
];

/**
 * A stand-in for the host's real upload call. It reports progress, honours `signal`, and fails
 * the first attempt of every file whose size is a multiple of three bytes, so the preview can show
 * the retry path without a server. Swap it for `fetch`/`XMLHttpRequest` in an app.
 */
function uploadFile(
  file: File,
  opts: { onProgress: (n: number) => void; signal: AbortSignal },
): Promise<void> {
  const failOnce = file.size % 3 === 0 && !retried.has(file);
  return new Promise((resolve, reject) => {
    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + 12);
      opts.onProgress(progress);
      if (failOnce && progress >= 60) {
        window.clearInterval(timer);
        retried.add(file);
        reject(new Error("The connection dropped."));
      } else if (progress === 100) {
        window.clearInterval(timer);
        resolve();
      }
    }, 250);
    opts.signal.addEventListener("abort", () => {
      window.clearInterval(timer);
      reject(new DOMException("Upload cancelled", "AbortError"));
    });
  });
}
const retried = new WeakSet<File>();

type QueueItem = {
  id: string;
  file: File;
  kind: string;
  state: "uploading" | "error" | "done";
  progress: number;
  error?: string;
  /** Refused by the drop surface, so there is nothing to retry. */
  rejected?: boolean;
};

function sampleFile(name: string, bytes: number, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

/** The seeded failure has already spent its one failed attempt, so its retry succeeds. */
function retriedOnce(file: File): File {
  retried.add(file);
  return file;
}

let nextQueueId = 0;

export function dropzoneUploadQueue(): ReactNode {
  const [kind, setKind] = useState("datasheet");
  const [queue, setQueue] = useState<QueueItem[]>(() => [
    {
      id: "seed-done",
      file: sampleFile("beam-angle-spec.pdf", 2_400_000, "application/pdf"),
      kind: "datasheet",
      state: "done",
      progress: 100,
    },
    {
      id: "seed-error",
      file: retriedOnce(
        sampleFile("fixture-photo.png", 1_200_000, "image/png"),
      ),
      kind: "photo",
      state: "error",
      progress: 60,
      error: "The connection dropped.",
    },
  ]);
  const [announcement, setAnnouncement] = useState("");
  const controllers = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const running = controllers.current;
    return () => running.forEach((controller) => controller.abort());
  }, []);

  const patch = (id: string, next: Partial<QueueItem>) =>
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, ...next } : item)),
    );

  const start = (id: string, file: File) => {
    const controller = new AbortController();
    controllers.current.set(id, controller);
    patch(id, { state: "uploading", progress: 0, error: undefined });
    uploadFile(file, {
      signal: controller.signal,
      onProgress: (progress) => patch(id, { progress }),
    }).then(
      () => {
        controllers.current.delete(id);
        patch(id, { state: "done", progress: 100 });
        setAnnouncement(`${file.name} uploaded.`);
      },
      (reason: unknown) => {
        controllers.current.delete(id);
        if (controller.signal.aborted) return;
        const message =
          reason instanceof Error ? reason.message : "The upload failed.";
        patch(id, { state: "error", error: message });
        setAnnouncement(`${file.name} didn't upload. ${message}`);
      },
    );
  };

  const discard = (item: QueueItem) => {
    controllers.current.get(item.id)?.abort();
    controllers.current.delete(item.id);
    setQueue((current) => current.filter(({ id }) => id !== item.id));
    setAnnouncement(`${item.file.name} discarded.`);
  };

  const cancel = (item: QueueItem) => {
    controllers.current.get(item.id)?.abort();
    controllers.current.delete(item.id);
    patch(item.id, { state: "error", error: "Upload cancelled." });
    setAnnouncement(`Upload of ${item.file.name} cancelled.`);
  };

  const accept = (files: File[]) => {
    const added = files.map((file) => ({
      id: `upload-${nextQueueId++}`,
      file,
      kind,
      state: "uploading" as const,
      progress: 0,
    }));
    setQueue((current) => [...current, ...added]);
    added.forEach((item) => start(item.id, item.file));
  };

  const reject = (rejections: FileDropRejection[]) =>
    setQueue((current) => [
      ...current,
      ...rejections.map(({ file, reasons }): QueueItem => ({
        id: `upload-${nextQueueId++}`,
        file,
        kind,
        state: "error",
        progress: 0,
        error: reasons.includes("file-too-large")
          ? `${file.name} is larger than 25 MB.`
          : `${file.name} isn't a supported file type.`,
        rejected: true,
      })),
    ]);

  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
        <Field>
          <FieldLabel htmlFor="upload-kind">Attach as</FieldLabel>
          <Select
            items={UPLOAD_KINDS}
            value={kind}
            onValueChange={(value) => value && setKind(value)}
          >
            <SelectTrigger id="upload-kind" className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {UPLOAD_KINDS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Dropzone
          multiple
          maxSize={MAX_UPLOAD_BYTES}
          accept={{
            "application/pdf": [".pdf"],
            "image/*": [".png", ".jpg", ".jpeg", ".webp"],
          }}
          aria-label="Upload files"
          onFilesAccepted={accept}
          onFilesRejected={reject}
        >
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Drop files here or browse</EmptyTitle>
              <EmptyDescription>
                PDF or images, up to 25 MB each
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Dropzone>
        {queue.length > 0 ? (
          <AttachmentGroup layout="grid" aria-label="Upload queue" role="group">
            {queue.map((item) => {
              const label =
                UPLOAD_KINDS.find(({ value }) => value === item.kind)?.label ??
                item.kind;
              return (
                <Attachment
                  key={item.id}
                  state={item.state}
                  orientation="vertical"
                >
                  <AttachmentMedia>
                    {item.state === "error" ? (
                      <FileWarningIcon />
                    ) : item.state === "done" ? (
                      <CheckIcon />
                    ) : (
                      <FileTextIcon />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{item.file.name}</AttachmentTitle>
                    <AttachmentDescription>
                      {item.state === "error"
                        ? item.error
                        : item.state === "uploading"
                          ? `${label} · ${item.progress}%`
                          : `${label} · ${formatSize(item.file.size)}`}
                    </AttachmentDescription>
                  </AttachmentContent>
                  {item.state === "uploading" ? (
                    <AttachmentProgress
                      value={item.progress}
                      aria-label={`Uploading ${item.file.name}`}
                    />
                  ) : null}
                  <AttachmentActions>
                    {item.state === "uploading" ? (
                      <AttachmentAction
                        aria-label={`Cancel upload of ${item.file.name}`}
                        title="Cancel upload"
                        onClick={() => cancel(item)}
                      >
                        <X />
                      </AttachmentAction>
                    ) : null}
                    {item.state === "error" && !item.rejected ? (
                      <AttachmentAction
                        aria-label={`Retry upload of ${item.file.name}`}
                        title="Retry upload"
                        onClick={() => start(item.id, item.file)}
                      >
                        <RotateCwIcon />
                      </AttachmentAction>
                    ) : null}
                    {item.state !== "uploading" ? (
                      <AttachmentAction
                        aria-label={`Discard file ${item.file.name}`}
                        title="Discard file"
                        onClick={() => discard(item)}
                      >
                        <Trash2Icon />
                      </AttachmentAction>
                    ) : null}
                  </AttachmentActions>
                </Attachment>
              );
            })}
          </AttachmentGroup>
        ) : null}
        <span className="sr-only" role="status" aria-live="polite">
          {announcement}
        </span>
      </div>
    </Wrapper>
  );
}

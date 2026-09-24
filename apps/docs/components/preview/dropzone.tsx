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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

/**
 * A stand-in for the host's "attach these uploads to the record" call. Its first call fails, so
 * the preview shows the uploaded-but-not-saved branch: the bytes are stored, only the save retries.
 */
function saveFiles(
  records: { name: string; category: string }[],
  attempt: number,
): Promise<void> {
  return new Promise((resolve, reject) =>
    window.setTimeout(
      () =>
        attempt === 0 && records.length > 0
          ? reject(new Error("The server didn't respond."))
          : resolve(),
      600,
    ),
  );
}

type QueueItem = {
  id: string;
  file: File;
  /** The record's name, editable per file; starts as the file name without its extension. */
  name: string;
  category: string;
  state: "uploading" | "error" | "done";
  progress: number;
  error?: string;
  /** Refused by the drop surface, so there is nothing to retry. */
  rejected?: boolean;
  /** Attached to the record; until then a done upload is "uploaded, not saved". */
  saved?: boolean;
};

function sampleFile(name: string, bytes: number, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

/** The seeded failure has already spent its one failed attempt, so its retry succeeds. */
function retriedOnce(file: File): File {
  retried.add(file);
  return file;
}

const baseName = (file: File) => file.name.replace(/\.[^.]+$/, "");

let nextQueueId = 0;

function seededQueue(): QueueItem[] {
  const spec = sampleFile("beam-angle-spec.pdf", 2_400_000, "application/pdf");
  const photo = retriedOnce(
    sampleFile("fixture-photo.png", 1_200_000, "image/png"),
  );
  return [
    {
      id: "seed-done",
      file: spec,
      name: baseName(spec),
      category: "datasheet",
      state: "done",
      progress: 100,
    },
    {
      id: "seed-error",
      file: photo,
      name: baseName(photo),
      category: "photo",
      state: "error",
      progress: 60,
      error: "The connection dropped.",
    },
  ];
}

export function dropzoneUploadQueue(): ReactNode {
  return <UploadQueueDemo />;
}

function UploadQueueDemo(): ReactNode {
  const [mode, setMode] = useState<"single" | "multiple">("multiple");
  const multiple = mode === "multiple";
  const [queue, setQueue] = useState<QueueItem[]>(seededQueue);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showInvalid, setShowInvalid] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const controllers = useRef(new Map<string, AbortController>());
  const saveAttempts = useRef(0);

  useEffect(() => {
    const running = controllers.current;
    return () => running.forEach((controller) => controller.abort());
  }, []);

  const patch = (id: string, next: Partial<QueueItem>) =>
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, ...next } : item)),
    );

  const abortAll = () => {
    controllers.current.forEach((controller) => controller.abort());
    controllers.current.clear();
  };

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

  const remove = (id: string) =>
    setQueue((current) => current.filter((item) => item.id !== id));

  const discard = (item: QueueItem) => {
    remove(item.id);
    setAnnouncement(`${item.file.name} discarded.`);
  };

  // Cancelling drops the file from the queue: nothing was stored, so the surface is back to idle.
  const cancel = (item: QueueItem) => {
    controllers.current.get(item.id)?.abort();
    controllers.current.delete(item.id);
    remove(item.id);
    setAnnouncement(`Upload of ${item.file.name} cancelled.`);
  };

  const accept = (files: File[]) => {
    const added = files.map((file): QueueItem => ({
      id: `upload-${nextQueueId++}`,
      file,
      name: baseName(file),
      category: UPLOAD_KINDS[0]!.value,
      state: "uploading",
      progress: 0,
    }));
    if (!multiple) abortAll();
    setQueue((current) => (multiple ? [...current, ...added] : added));
    setSaveError(null);
    added.forEach((item) => start(item.id, item.file));
  };

  const reject = (rejections: FileDropRejection[]) => {
    const refused = rejections.map(({ file, reasons }): QueueItem => ({
      id: `upload-${nextQueueId++}`,
      file,
      name: baseName(file),
      category: UPLOAD_KINDS[0]!.value,
      state: "error",
      progress: 0,
      error: reasons.includes("file-too-large")
        ? `${file.name} is larger than 25 MB.`
        : `${file.name} isn't a supported file type.`,
      rejected: true,
    }));
    if (!multiple) abortAll();
    setQueue((current) => (multiple ? [...current, ...refused] : refused));
  };

  const switchMode = (next: "single" | "multiple") => {
    abortAll();
    setMode(next);
    setQueue([]);
    setSaveError(null);
    setShowInvalid(false);
  };

  const editable = queue.filter((item) => !item.rejected && !item.saved);
  const unsaved = queue.filter((item) => item.state === "done" && !item.saved);
  const uploading = queue.some((item) => item.state === "uploading");

  const save = () => {
    if (unsaved.some((item) => item.name.trim() === "")) {
      setShowInvalid(true);
      return;
    }
    setShowInvalid(false);
    setSaving(true);
    const ids = new Set(unsaved.map((item) => item.id));
    saveFiles(
      unsaved.map(({ name, category }) => ({ name: name.trim(), category })),
      saveAttempts.current++,
    ).then(
      () => {
        setSaving(false);
        setSaveError(null);
        setQueue((current) =>
          current.map((item) =>
            ids.has(item.id) ? { ...item, saved: true } : item,
          ),
        );
        setAnnouncement(
          ids.size === 1 ? "1 file saved." : `${ids.size} files saved.`,
        );
      },
      (reason: unknown) => {
        setSaving(false);
        setSaveError(
          reason instanceof Error ? reason.message : "The save failed.",
        );
      },
    );
  };

  const describe = (item: QueueItem) => {
    if (item.state === "error") return item.error;
    if (item.state === "uploading") return `${item.progress}%`;
    const size = formatSize(item.file.size);
    return item.saved ? `Saved · ${size}` : `Uploaded, not saved · ${size}`;
  };

  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
        <ToggleGroup
          size="sm"
          variant="outline"
          deselectable={false}
          aria-label="Files per upload"
          value={[mode]}
          onValueChange={(value) => {
            const next = value[0];
            if (next === "single" || next === "multiple") switchMode(next);
          }}
        >
          <ToggleGroupItem value="single">One file</ToggleGroupItem>
          <ToggleGroupItem value="multiple">Several files</ToggleGroupItem>
        </ToggleGroup>
        <Dropzone
          multiple={multiple}
          maxSize={MAX_UPLOAD_BYTES}
          accept={{
            "application/pdf": [".pdf"],
            "image/*": [".png", ".jpg", ".jpeg", ".webp"],
          }}
          aria-label={multiple ? "Upload files" : "Upload a file"}
          onFilesAccepted={accept}
          onFilesRejected={reject}
        >
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>
                {multiple
                  ? "Drop files here or browse"
                  : "Drop a file here or browse"}
              </EmptyTitle>
              <EmptyDescription>
                {multiple
                  ? "PDF or images, up to 25 MB each"
                  : "PDF or image, up to 25 MB"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Dropzone>
        {queue.length > 0 ? (
          <AttachmentGroup layout="grid" aria-label="Upload queue" role="group">
            {queue.map((item) => (
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
                    {describe(item)}
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
                  {item.state !== "uploading" && !item.saved ? (
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
            ))}
          </AttachmentGroup>
        ) : null}
        {editable.map((item) => {
          const invalid = showInvalid && item.name.trim() === "";
          return (
            <FieldSet key={item.id}>
              <FieldLegend variant="label">{item.file.name}</FieldLegend>
              <FieldGroup className="grid gap-3 sm:grid-cols-2">
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={`${item.id}-name`}>Name</FieldLabel>
                  <Input
                    id={`${item.id}-name`}
                    value={item.name}
                    aria-invalid={invalid || undefined}
                    onChange={(event) =>
                      patch(item.id, { name: event.target.value })
                    }
                  />
                  {invalid ? <FieldError>Enter a name.</FieldError> : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${item.id}-category`}>
                    Category
                  </FieldLabel>
                  <Select
                    items={UPLOAD_KINDS}
                    value={item.category}
                    onValueChange={(value) =>
                      value && patch(item.id, { category: value })
                    }
                  >
                    <SelectTrigger
                      id={`${item.id}-category`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {UPLOAD_KINDS.map((kind) => (
                          <SelectItem key={kind.value} value={kind.value}>
                            {kind.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </FieldSet>
          );
        })}
        {saveError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {unsaved.length === 1
                ? "1 file is uploaded but not saved"
                : `${unsaved.length} files are uploaded but not saved`}
            </AlertTitle>
            <AlertDescription>
              {saveError} The uploads are kept; saving again won't upload them
              twice.
            </AlertDescription>
          </Alert>
        ) : null}
        {unsaved.length > 0 ? (
          <Button
            className="self-start"
            loading={saving}
            disabled={uploading}
            onClick={save}
          >
            {saveError
              ? "Retry save"
              : unsaved.length === 1
                ? "Save file"
                : `Save ${unsaved.length} files`}
          </Button>
        ) : null}
        <span className="sr-only" role="status" aria-live="polite">
          {announcement}
        </span>
      </div>
    </Wrapper>
  );
}

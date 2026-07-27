"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/dropzone` (dogfoods the registry) → auto-scanned.
import { Dropzone } from "@/components/ui/dropzone";
import type { FileDropRejection } from "@/components/ui/use-file-drop";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
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
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <Dropzone
          accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
          aria-label="Upload images"
          onFilesAccepted={(accepted) =>
            setFiles((prev) => [...prev, ...accepted])
          }
        >
          <Empty size="sm" bordered>
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
              </Attachment>
            ))}
          </AttachmentGroup>
        ) : null}
      </div>
    </Wrapper>
  );
}

export function dropzoneRejections(): ReactNode {
  const [log, setLog] = useState<string[]>([]);
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <Dropzone
          maxSize={200 * 1024}
          aria-label="Upload small files"
          onFilesAccepted={(accepted) =>
            setLog((prev) => [
              ...prev,
              ...accepted.map((f) => `Added ${f.name}`),
            ])
          }
          onFilesRejected={(rejections: FileDropRejection[]) =>
            setLog((prev) => [
              ...prev,
              ...rejections.map(
                (r) => `${r.file.name}: ${r.reasons.join(", ")}`,
              ),
            ])
          }
        >
          <Empty size="sm" bordered>
            <EmptyHeader>
              <EmptyTitle>Files up to 200 KB</EmptyTitle>
              <EmptyDescription>
                Anything larger is refused with a typed reason
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Dropzone>
        {log.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {log.slice(-4).map((line, i) => (
              <li key={i} className="min-w-0 truncate">
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Wrapper>
  );
}

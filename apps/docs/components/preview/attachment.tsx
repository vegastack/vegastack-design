"use client";

import { useState, type ReactNode } from "react";
import { File, FileSpreadsheet, FileText, X } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/attachment` → auto-scanned.
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentProgress,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { IconButton } from "@/components/ui/icon-button";
import { Image } from "@/components/ui/image";

export function attachmentFileChip(): ReactNode {
  return (
    <Wrapper>
      <Attachment state="complete" className="w-full max-w-64">
        <AttachmentMedia>
          <FileText />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>release-notes.pdf</AttachmentTitle>
          <AttachmentDescription>248 KB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <IconButton aria-label="Remove release-notes.pdf" variant="ghost" size="xs">
            <X />
          </IconButton>
        </AttachmentActions>
      </Attachment>
    </Wrapper>
  );
}

export function attachmentImageThumbnail(): ReactNode {
  return (
    <Wrapper>
      {/* One step wider than the default `w-28` so the demo's own filename fits —
          truncation is demonstrated by the compose-list example below. */}
      <Attachment orientation="vertical" state="complete" className="w-32">
        <AttachmentMedia variant="image">
          {/* A deterministic local fixture (apps/docs/public/preview/landscape.svg) stands in
              for the thumbnail — no network dependency; the media box clips its corners. */}
          <Image
            src="/preview/landscape.svg"
            alt=""
            aspectRatio="square"
            rounded="none"
            className="size-full"
          />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>cover-photo.png</AttachmentTitle>
          <AttachmentDescription>1920×1080 · 3.4 MB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <IconButton aria-label="Remove cover-photo.png" variant="ghost" size="xs">
            <X />
          </IconButton>
        </AttachmentActions>
        <AttachmentTrigger aria-label="Open cover-photo.png" />
      </Attachment>
    </Wrapper>
  );
}

export function attachmentUploading(): ReactNode {
  return (
    <Wrapper>
      <Attachment state="uploading" className="w-full max-w-64">
        <AttachmentMedia>
          <FileSpreadsheet />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>quarterly-report.xlsx</AttachmentTitle>
          <AttachmentDescription live>Uploading — 67%</AttachmentDescription>
          <AttachmentProgress
            value={67}
            aria-label="quarterly-report.xlsx upload progress"
          />
        </AttachmentContent>
        <AttachmentActions>
          <IconButton
            aria-label="Cancel upload of quarterly-report.xlsx"
            variant="ghost"
            size="xs"
          >
            <X />
          </IconButton>
        </AttachmentActions>
      </Attachment>
    </Wrapper>
  );
}

export function attachmentError(): ReactNode {
  return (
    <Wrapper>
      <Attachment state="error" className="w-full max-w-64">
        <AttachmentMedia>
          <File />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>budget-2027.numbers</AttachmentTitle>
          <AttachmentDescription live>
            Upload failed — file type not supported
          </AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <IconButton
            aria-label="Remove budget-2027.numbers"
            variant="ghost"
            size="xs"
          >
            <X />
          </IconButton>
        </AttachmentActions>
      </Attachment>
    </Wrapper>
  );
}

interface ComposeAttachment {
  id: string;
  name: string;
  meta: string;
  icon: ReactNode;
}

const initialComposeAttachments: ComposeAttachment[] = [
  { id: "1", name: "release-notes.pdf", meta: "248 KB", icon: <FileText /> },
  { id: "2", name: "quarterly-report.xlsx", meta: "1.1 MB", icon: <FileSpreadsheet /> },
  { id: "3", name: "roadmap.docx", meta: "84 KB", icon: <File /> },
];

export function attachmentComposeList(): ReactNode {
  const [attachments, setAttachments] = useState(initialComposeAttachments);

  return (
    <Wrapper className="justify-stretch">
      <div className="w-full max-w-md">
        {attachments.length > 0 ? (
          <AttachmentGroup>
            {attachments.map((file) => (
              <Attachment key={file.id} state="complete" size="sm">
                <AttachmentMedia>{file.icon}</AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{file.name}</AttachmentTitle>
                  <AttachmentDescription>{file.meta}</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <IconButton
                    aria-label={`Remove ${file.name}`}
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((a) => a.id !== file.id),
                      )
                    }
                  >
                    <X />
                  </IconButton>
                </AttachmentActions>
              </Attachment>
            ))}
          </AttachmentGroup>
        ) : (
          <p className="text-sm text-muted-foreground">
            No attachments — removed them all.
          </p>
        )}
      </div>
    </Wrapper>
  );
}

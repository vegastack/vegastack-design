"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  UploadPanel,
  type UploadEntry,
  type UploadFile,
  type UploadPanelProps,
  type UploadSummary,
} from "@/components/ui/upload-panel";
import { FILE_KIND_LABEL, FileTypeIcon, type FileKind } from "@/lib/file-kind";

const MB = 1024 * 1024;
const SPECS = { label: "Product › Specs", href: "#specs" };
const PHOTOS = { label: "Site visit › Photos", href: "#photos" };

const UPLOADING: UploadEntry[] = [
  {
    id: "survey",
    name: "quarterly-site-survey-final-2026.pdf",
    size: 12.4 * MB,
    bytesDone: 7.9 * MB,
    contentType: "application/pdf",
    status: "uploading",
    destination: SPECS,
  },
  {
    id: "facade",
    name: "facade-east.jpg",
    size: 3.4 * MB,
    contentType: "image/jpeg",
    thumbnailUrl: "/preview/landscape.svg",
    status: "done",
    destination: PHOTOS,
  },
  {
    id: "luminaire",
    name: "luminaire-LX200.ies",
    size: 48 * 1024,
    status: "finishing",
    destination: SPECS,
  },
  {
    id: "walkthrough",
    name: "walkthrough.mov",
    size: 240 * MB,
    contentType: "video/quicktime",
    status: "queued",
    destination: PHOTOS,
  },
];

const UPLOADING_SUMMARY: UploadSummary = {
  total: 4,
  done: 1,
  failed: 0,
  cancelled: 0,
  bytesDone: 11.3 * MB,
  bytesTotal: 255.8 * MB,
  timeLeftMs: 130_000,
  status: "uploading",
};

/** A box the panel sits in, bottom-end, instead of the viewport corner. */
function Stage({
  children,
  height = "min-h-112",
}: {
  children: ReactNode;
  height?: string;
}) {
  return (
    <Wrapper className="block p-0">
      <div className={`relative w-full overflow-hidden ${height}`}>
        {children}
      </div>
    </Wrapper>
  );
}

/** The panel as a preview places it: inside its stage, not the page corner. */
function Panel({ collapsed: initial = false, ...props }: UploadPanelProps) {
  const [collapsed, setCollapsed] = React.useState(initial);
  return (
    <UploadPanel
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      onOpen={() => {}}
      onCancel={() => {}}
      onCancelAll={() => {}}
      {...props}
      className="absolute"
    />
  );
}

/**
 * Uploading — the header names the batch with time left and bytes; each row shows its progress
 * ring (× on hover), a spinner while the server verifies it, a check when done, and where it goes.
 */
export function uploadPanel(): ReactNode {
  return (
    <Stage>
      <Panel items={UPLOADING} summary={UPLOADING_SUMMARY} />
    </Stage>
  );
}

/** Collapsed — the header alone, with one bar for the whole batch. */
export function uploadPanelCollapsed(): ReactNode {
  return (
    <Stage height="min-h-40">
      <Panel items={UPLOADING} summary={UPLOADING_SUMMARY} collapsed />
    </Stage>
  );
}

const FOLDER_FILES: UploadFile[] = Array.from({ length: 12 }, (_, i) => ({
  id: `photo-${i}`,
  name: `IMG_${4810 + i}.HEIC`,
  size: 2.6 * MB,
  contentType: "image/heic",
  status: i < 5 ? "done" : i === 5 ? "uploading" : "queued",
  bytesDone: i === 5 ? 1.1 * MB : undefined,
}));

/** A folder — one row with a count and aggregate progress that expands to its files. */
export function uploadPanelFolder(): ReactNode {
  return (
    <Stage>
      <Panel
        items={[
          {
            type: "folder",
            id: "site-photos",
            name: "Site photos",
            files: FOLDER_FILES,
            destination: PHOTOS,
          },
          {
            id: "notes",
            name: "visit-notes.docx",
            size: 220 * 1024,
            status: "done",
            destination: PHOTOS,
          },
        ]}
        summary={{
          total: 13,
          done: 6,
          failed: 0,
          cancelled: 0,
          bytesDone: 14.3 * MB,
          bytesTotal: 31.4 * MB,
          timeLeftMs: 40_000,
          status: "uploading",
        }}
      />
    </Stage>
  );
}

/**
 * Errors — failures stay until the person acts: the reason under the name, Retry on the row and
 * Retry failed below; an interrupted upload asks for its file again.
 */
export function uploadPanelErrors(): ReactNode {
  return (
    <Stage height="min-h-96">
      <Panel
        items={[
          {
            id: "a",
            name: "stair-core.dwg",
            size: 8.1 * MB,
            status: "done",
            destination: SPECS,
          },
          {
            id: "b",
            name: "render-final.psd",
            size: 512 * MB,
            status: "failed",
            error: "Too large. The limit is 500 MB",
          },
          {
            id: "c",
            name: "handover.zip",
            size: 1.2 * 1024 * MB,
            status: "interrupted",
            destination: SPECS,
          },
          {
            id: "d",
            name: "old-draft.pptx",
            size: 4 * MB,
            status: "cancelled",
          },
        ]}
        summary={{
          total: 4,
          done: 1,
          failed: 1,
          cancelled: 1,
          bytesDone: 8.1 * MB,
          bytesTotal: 1.7 * 1024 * MB,
          status: "failed",
        }}
        onRetry={() => {}}
        onResume={() => {}}
        onRetryFailed={() => {}}
      />
    </Stage>
  );
}

/** Done — the panel shrinks into a card that closes itself after 8 s, paused on hover or focus. */
export function uploadPanelDone(): ReactNode {
  const [shown, setShown] = React.useState(true);
  return (
    <Stage height="min-h-40">
      {shown ? (
        <Panel
          items={UPLOADING.map((item) => ({ ...item, status: "done" }))}
          summary={{
            ...UPLOADING_SUMMARY,
            done: 4,
            bytesDone: UPLOADING_SUMMARY.bytesTotal,
            status: "done",
          }}
          onDismiss={() => setShown(false)}
        />
      ) : (
        <div className="grid min-h-40 place-items-center">
          <Button variant="outline" onClick={() => setShown(true)}>
            Show the done card again
          </Button>
        </div>
      )}
    </Stage>
  );
}

/**
 * Phone — a compact bar with the batch's progress; tapping it opens every row in a bottom sheet
 * (a dialog on a wide screen). Below 768px the panel takes this form by itself.
 */
export function uploadPanelPhone(): ReactNode {
  return (
    <Stage height="min-h-32">
      <div className="relative mx-auto h-32 max-w-sm">
        <Panel items={UPLOADING} summary={UPLOADING_SUMMARY} compact />
      </div>
    </Stage>
  );
}

const KIND_SAMPLES: Record<FileKind, string> = {
  image: "photo.heic",
  pdf: "spec.pdf",
  document: "brief.docx",
  text: "notes.md",
  spreadsheet: "budget.xlsx",
  data: "export.csv",
  presentation: "pitch.pptx",
  video: "tour.mov",
  audio: "memo.m4a",
  archive: "handover.zip",
  code: "index.ts",
  json: "config.json",
  config: "deploy.yaml",
  script: "setup.sh",
  cad: "plan.dwg",
  photometric: "LX200.ies",
  design: "render.psd",
  ebook: "manual.epub",
  email: "thread.eml",
  calendar: "visit.ics",
  contact: "priya.vcf",
  key: "server.pem",
  encrypted: "secrets.gpg",
  font: "Geist.woff2",
  other: "data.bin",
};

/** Every file kind: its tinted icon, its label and a file it covers. */
export function fileTypeIconGallery(): ReactNode {
  return (
    <Wrapper className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {(Object.keys(FILE_KIND_LABEL) as FileKind[]).map((kind) => (
        <div
          key={kind}
          className="flex min-w-0 items-center gap-2 rounded-md bg-muted/50 p-2"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted">
            <FileTypeIcon kind={kind} tinted className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm">{FILE_KIND_LABEL[kind]}</span>
            <span className="truncate text-xs text-muted-foreground">
              {KIND_SAMPLES[kind]}
            </span>
          </span>
        </div>
      ))}
    </Wrapper>
  );
}

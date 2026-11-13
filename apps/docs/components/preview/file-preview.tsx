"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/file-preview` (dogfoods the registry) → auto-scanned.
import { FilePreview } from "@/components/ui/file-preview";
import { FileViewer, type FileViewerItem } from "@/components/ui/file-viewer";

function textUrl(text: string, type = "text/plain") {
  return `data:${type};charset=utf-8,${encodeURIComponent(text)}`;
}

const MARKDOWN = `# Open tasks

- **P9 skip test** — To do, no due date
- **Review Q3 discount approvals** — overdue since Monday
- **Office lighting survey** — waiting on the floor plans

## This week

1. Send the revised quote to Harbour Road
2. Book the photometry check for the warehouse bays
3. Confirm the LED drivers with the supplier

> Two items need a decision from Asha before Friday.

| Task | Owner | Due |
| --- | --- | --- |
| Quote | Manoj | Thu |
| Photometry | Simran | Fri |
`;

const CSV = `Fixture,Room,Lux,UGR,Watts
LED panel 600,Open office,500,19,36
Downlight 150,Corridor,150,22,12
Linear 1200,Meeting room,500,19,40
High bay 150,Warehouse,300,25,150
Track spot,Reception,300,19,18
Batten 1500,Plant room,200,25,45
Wall washer,Lobby,200,22,24
`;

const FILES = {
  markdown: {
    url: textUrl(MARKDOWN, "text/markdown"),
    mediaType: "text/markdown",
    filename: "open-tasks.md",
    size: new Blob([MARKDOWN]).size,
  },
  csv: {
    url: textUrl(CSV, "text/csv"),
    mediaType: "text/csv",
    filename: "fixture-schedule.csv",
    size: new Blob([CSV]).size,
  },
  pdf: {
    url: "/preview/spec-sheet.pdf",
    mediaType: "application/pdf",
    filename: "spec-sheet.pdf",
    size: 48_213,
  },
  image: {
    url: "/preview/landscape.svg",
    mediaType: "image/svg+xml",
    filename: "site-photo.svg",
    size: 2_640,
  },
  other: {
    url: "/preview/missing.zip",
    mediaType: "application/zip",
    filename: "drawings.zip",
    size: 4_212_000,
  },
  broken: {
    url: "/preview/no-such-file.md",
    mediaType: "text/markdown",
    filename: "notes.md",
    size: 830,
  },
} as const;

type FileKey = keyof typeof FILES;

/** Previews that open the side viewer, as a chat would. */
function Previews({ keys }: { keys: readonly FileKey[] }) {
  const items: FileViewerItem[] = keys.map((key) => {
    const file = FILES[key];
    return {
      id: key,
      name: file.filename,
      contentType: file.mediaType,
      size: file.size,
      src: file.url,
      pdfSrc: file.mediaType === "application/pdf" ? file.url : null,
      downloadHref: file.url,
    };
  });
  const [index, setIndex] = React.useState<number | null>(null);
  return (
    <>
      {keys.map((key, position) => (
        <FilePreview
          key={key}
          {...FILES[key]}
          onOpen={() => setIndex(position)}
          className="w-full"
        />
      ))}
      <FileViewer
        mode="side"
        items={items}
        index={index}
        onIndexChange={setIndex}
        onOpenChange={(open) => !open && setIndex(null)}
      />
    </>
  );
}

export function filePreview(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-stretch gap-3 bg-background">
      <Previews keys={["markdown", "pdf"]} />
    </Wrapper>
  );
}

export function filePreviewKinds(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-stretch gap-3 bg-background">
      <Previews keys={["csv", "image", "other"]} />
    </Wrapper>
  );
}

export function filePreviewError(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-stretch gap-3 bg-background">
      <Previews keys={["broken"]} />
    </Wrapper>
  );
}

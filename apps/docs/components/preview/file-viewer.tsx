"use client";

import { type ReactNode, useState } from "react";
import {
  FileAudioIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/file-viewer` (dogfoods the registry) → auto-scanned.
import { FileViewer, type FileViewerItem } from "@/components/ui/file-viewer";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";

/** A tiny stand-in for the landscape fixture — what a stored image's `blur` data URL holds. */
const BLUR = "/preview/landscape-blur.svg";

const IMAGES: FileViewerItem[] = [
  {
    id: "landscape",
    name: "landscape.svg",
    contentType: "image/svg+xml",
    size: 519,
    src: "/preview/landscape.svg",
    thumb: { src: "/preview/landscape.svg", blur: BLUR },
    downloadHref: "/preview/landscape.svg",
  },
  {
    id: "ada",
    name: "portrait-ada.svg",
    contentType: "image/svg+xml",
    src: "/preview/avatar-1.svg",
    thumb: { src: "/preview/avatar-1.svg" },
    downloadHref: "/preview/avatar-1.svg",
  },
  {
    id: "linus",
    name: "portrait-linus.svg",
    contentType: "image/svg+xml",
    src: "/preview/avatar-2.svg",
    thumb: { src: "/preview/avatar-2.svg" },
    downloadHref: "/preview/avatar-2.svg",
  },
];

const PDF: FileViewerItem = {
  id: "spec",
  name: "nova-pendant-spec-sheet.pdf",
  contentType: "application/pdf",
  size: 1530,
  pdfSrc: "/preview/spec-sheet.pdf",
  downloadHref: "/preview/spec-sheet.pdf",
};

const OTHER: FileViewerItem = {
  id: "quote",
  name: "quote-2026-104.xlsx",
  contentType:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  size: 2_516_582,
  downloadHref: "/preview/spec-sheet.pdf",
};

/** Controlled state for a viewer, the way every host holds it. */
function useViewer() {
  const [index, setIndex] = useState<number | null>(null);
  return {
    index,
    open: setIndex,
    props: {
      index,
      onIndexChange: setIndex,
      onOpenChange: (open: boolean) => {
        if (!open) setIndex(null);
      },
    },
  };
}

/** An image gallery: thumbnails open the viewer; the blur fades into the full image. */
export function fileViewer(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <div className="flex flex-wrap gap-2">
        {IMAGES.map((item, i) => (
          <Button
            key={item.id}
            variant="outline"
            onClick={() => viewer.open(i)}
            className="h-20 w-28 overflow-hidden p-0"
            aria-label={`Open ${item.name}`}
          >
            <img
              src={item.thumb?.src}
              alt=""
              className="size-full object-cover"
            />
          </Button>
        ))}
      </div>
      <FileViewer items={IMAGES} {...viewer.props} />
    </Wrapper>
  );
}

/** A PDF: pages render on demand with pdf.js, fit-width, with zoom and a page indicator. */
export function fileViewerPdf(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => viewer.open(0)}>
        <FileTextIcon data-icon="inline-start" />
        Open spec sheet
      </Button>
      <FileViewer items={[PDF]} {...viewer.props} />
    </Wrapper>
  );
}

/** A file the viewer cannot show: its type icon, name, size and Download. */
export function fileViewerOther(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => viewer.open(0)}>
        <FileSpreadsheetIcon data-icon="inline-start" />
        Open quote
      </Button>
      <FileViewer items={[OTHER]} {...viewer.props} />
    </Wrapper>
  );
}

/** One item: no "1 of 1" count and no paging buttons. */
export function fileViewerSingle(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => viewer.open(0)}>
        Open landscape
      </Button>
      <FileViewer items={IMAGES.slice(0, 1)} {...viewer.props} />
    </Wrapper>
  );
}

const MIXED: FileViewerItem[] = [...IMAGES, PDF, OTHER];

/** Attachment tiles open it: `AttachmentTrigger` is a button, so `onClick` sets the index. */
export function fileViewerAttachments(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper className="block">
      <AttachmentGroup>
        {MIXED.map((item, i) => (
          <Attachment key={item.id} orientation="vertical">
            <AttachmentMedia variant={item.thumb ? "image" : "icon"}>
              {item.thumb ? (
                <img src={item.thumb.src} alt="" />
              ) : item.contentType === "application/pdf" ? (
                <FileTextIcon />
              ) : (
                <FileSpreadsheetIcon />
              )}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{item.name}</AttachmentTitle>
              <AttachmentDescription>
                {item.contentType === "application/pdf"
                  ? "PDF"
                  : item.thumb
                    ? "Image"
                    : "Spreadsheet"}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentTrigger
              aria-label={`Open ${item.name}`}
              onClick={() => viewer.open(i)}
            />
          </Attachment>
        ))}
      </AttachmentGroup>
      <FileViewer items={MIXED} {...viewer.props} />
    </Wrapper>
  );
}

const MEDIA: FileViewerItem[] = [
  {
    id: "demo-video",
    name: "install-walkthrough.mp4",
    contentType: "video/mp4",
    src: "/preview/media-player-demo.mp4",
    downloadHref: "/preview/media-player-demo.mp4",
  },
  {
    id: "demo-audio",
    name: "site-visit-note.wav",
    contentType: "audio/wav",
    size: 812_000,
    src: "/preview/media-player-demo.wav",
    downloadHref: "/preview/media-player-demo.wav",
  },
];

/** Video and audio play on the stage in the system players, and pause when you page away. */
export function fileViewerMedia(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => viewer.open(0)}>
          <FileVideoIcon data-icon="inline-start" />
          Open video
        </Button>
        <Button variant="outline" onClick={() => viewer.open(1)}>
          <FileAudioIcon data-icon="inline-start" />
          Open audio
        </Button>
      </div>
      <FileViewer items={MEDIA} {...viewer.props} />
    </Wrapper>
  );
}

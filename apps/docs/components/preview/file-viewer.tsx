"use client";

import { type ReactNode, useState } from "react";
import {
  FileAudioIcon,
  FileCodeIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  PresentationIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/file-viewer` (dogfoods the registry) → auto-scanned.
import {
  FileViewer,
  type FileViewerItem,
  type FileViewerPreview,
} from "@/components/ui/file-viewer";
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

/** A file's text as a URL the viewer can read — in an app, the file's own inline URL. */
function textUrl(text: string, type = "text/plain") {
  return `data:${type};charset=utf-8,${encodeURIComponent(text)}`;
}

const TEXT: FileViewerItem = {
  id: "config",
  name: "site-survey.json",
  contentType: "application/json",
  size: 412,
  src: textUrl(
    JSON.stringify(
      {
        site: "12 Harbour Road",
        rooms: [
          { name: "Kitchen", area: 14.2, fixtures: ["pendant", "downlights"] },
          { name: "Hall", area: 6.5, fixtures: ["wall light"] },
        ],
        notes:
          "Ceiling void is 180 mm; check the joist direction before cutting.",
      },
      null,
      2,
    ),
    "application/json",
  ),
  downloadHref: "/preview/spec-sheet.pdf",
};

const CSV_ROWS = [
  "Room,Fixture,Qty,Notes",
  'Kitchen,"Nova pendant, brass",3,"Hang at 750 mm above the island"',
  'Hall,Wall light,2,"Say ""warm white"" on the order"',
  ...Array.from(
    { length: 620 },
    (_, i) => `Bedroom ${i + 1},Downlight,4,Fire-rated`,
  ),
];

const CSV: FileViewerItem = {
  id: "schedule",
  name: "lighting-schedule.csv",
  contentType: "text/csv",
  size: 26_400,
  src: textUrl(CSV_ROWS.join("\r\n"), "text/csv"),
  downloadHref: "/preview/spec-sheet.pdf",
};

const MARKDOWN: FileViewerItem = {
  id: "notes",
  name: "site-visit-notes.md",
  contentType: "text/markdown",
  size: 380,
  src: textUrl(
    [
      "# Site visit — 12 Harbour Road",
      "",
      "Met the client on site. **Kitchen first**, then the hall.",
      "",
      "## To do",
      "",
      "- [x] Measure the island",
      "- [ ] Confirm the pendant finish",
      "",
      "| Room | Fixtures |",
      "| --- | --- |",
      "| Kitchen | 3 pendants |",
      "| Hall | 2 wall lights |",
    ].join("\n"),
    "text/markdown",
  ),
  downloadHref: "/preview/spec-sheet.pdf",
};

const DECK: FileViewerItem = {
  id: "deck",
  name: "q3-client-review.pptx",
  contentType:
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  size: 4_404_019,
  // The picture PowerPoint saves inside the file (`extractPptxThumbnail` at upload).
  thumb: { src: "/preview/landscape.svg" },
  downloadHref: "/preview/spec-sheet.pdf",
};

/** Text and code files show their first megabyte in a scrollable, focusable sheet. */
export function fileViewerText(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => viewer.open(0)}>
        <FileCodeIcon data-icon="inline-start" />
        Open site-survey.json
      </Button>
      <FileViewer items={[TEXT]} {...viewer.props} />
    </Wrapper>
  );
}

/** A CSV is a table: the first row is the header, and at most 500 rows show. */
export function fileViewerCsv(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => viewer.open(0)}>
        <FileSpreadsheetIcon data-icon="inline-start" />
        Open lighting-schedule.csv
      </Button>
      <FileViewer items={[CSV]} {...viewer.props} />
    </Wrapper>
  );
}

/** Markdown (and MDX) render through MarkdownView; JSX is never executed. */
export function fileViewerMarkdown(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => viewer.open(0)}>
        <FileTextIcon data-icon="inline-start" />
        Open site-visit-notes.md
      </Button>
      <FileViewer items={[MARKDOWN]} {...viewer.props} />
    </Wrapper>
  );
}

/** Office and other files: a card with the file's own picture when it has one, else its icon. */
export function fileViewerCards(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => viewer.open(0)}>
          <PresentationIcon data-icon="inline-start" />
          With a thumbnail
        </Button>
        <Button variant="outline" onClick={() => viewer.open(1)}>
          <FileSpreadsheetIcon data-icon="inline-start" />
          Without
        </Button>
      </div>
      <FileViewer items={[DECK, OTHER]} {...viewer.props} />
    </Wrapper>
  );
}

/**
 * The app parses what the system does not: here a stand-in for SheetJS returns the first sheet
 * of a spreadsheet as a table, and a stand-in for mammoth returns a Word file as HTML.
 */
async function loadPreview(
  item: FileViewerItem,
): Promise<FileViewerPreview | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (item.name.endsWith(".xlsx"))
    return {
      kind: "table",
      rows: [
        ["Item", "Qty", "Unit", "Total"],
        ["Nova pendant", "3", "240.00", "720.00"],
        ["Downlight", "24", "18.50", "444.00"],
        ["Wall light", "2", "96.00", "192.00"],
      ],
      totalRows: 3,
    };
  if (item.name.endsWith(".docx"))
    return {
      kind: "html",
      html: "<h1>Scope of works</h1><p>Supply and fit <strong>all lighting</strong> on the ground floor.</p><ul><li>Kitchen: three pendants</li><li>Hall: two wall lights</li></ul>",
    };
  return null;
}

const PARSED: FileViewerItem[] = [
  OTHER,
  {
    id: "scope",
    name: "scope-of-works.docx",
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 48_200,
    downloadHref: "/preview/spec-sheet.pdf",
  },
];

/** `loadPreview` hands the viewer an app-parsed table or HTML for an Office file. */
export function fileViewerLoadPreview(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => viewer.open(0)}>
          <FileSpreadsheetIcon data-icon="inline-start" />
          Open quote.xlsx
        </Button>
        <Button variant="outline" onClick={() => viewer.open(1)}>
          <FileTextIcon data-icon="inline-start" />
          Open scope.docx
        </Button>
      </div>
      <FileViewer items={PARSED} loadPreview={loadPreview} {...viewer.props} />
    </Wrapper>
  );
}

const EVERY_KIND: FileViewerItem[] = [
  IMAGES[0]!,
  PDF,
  ...MEDIA,
  TEXT,
  CSV,
  MARKDOWN,
  DECK,
  OTHER,
];

/** One of every kind, to page through with ← and →. */
export function fileViewerEveryKind(): ReactNode {
  const viewer = useViewer();
  return (
    <Wrapper>
      <div className="flex flex-wrap gap-2">
        {EVERY_KIND.map((item, i) => (
          <Button
            key={item.id}
            variant="outline"
            size="sm"
            onClick={() => viewer.open(i)}
          >
            {item.name}
          </Button>
        ))}
      </div>
      <FileViewer items={EVERY_KIND} {...viewer.props} />
    </Wrapper>
  );
}

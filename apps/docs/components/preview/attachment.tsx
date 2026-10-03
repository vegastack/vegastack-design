"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  FileCodeIcon,
  FileSearchIcon,
  FileTextIcon,
  FileWarningIcon,
  RefreshCwIcon,
  TableIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/attachment` (dogfoods the registry) → auto-scanned.
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentPreview,
  AttachmentProgress,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FileViewerItem } from "@/components/ui/file-viewer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

/*
 * Upstream's own examples, adapted for our import paths and for LOCAL image fixtures: upstream's
 * `Image` and `Group` demos point at images.unsplash.com, and neither a documentation page nor the
 * geometry lane may depend on a live third-party image service. The files under
 * `apps/docs/public/preview/` are the same fixtures `avatar` and `aspect-ratio` use; the names and
 * metadata below describe what is actually served.
 */

type ImageFixture = {
  name: string;
  meta: string;
  src: string;
  alt: string;
};

const IMAGES: ImageFixture[] = [
  {
    name: "landscape.svg",
    meta: "SVG · 820 KB",
    src: "/preview/landscape.svg",
    alt: "A scenic landscape",
  },
  {
    name: "portrait-ada.svg",
    meta: "SVG · 12 KB",
    src: "/preview/avatar-1.svg",
    alt: "An abstract portrait mark",
  },
  {
    name: "portrait-linus.svg",
    meta: "SVG · 12 KB",
    src: "/preview/avatar-2.svg",
    alt: "A second abstract portrait mark",
  },
];

/** The column every upstream example lays its attachments out in, minus upstream's page padding. */
const COLUMN = "flex w-full max-w-sm flex-col gap-3";

export function attachment(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <AttachmentGroup>
          {IMAGES.map((image) => (
            <Attachment key={image.name} orientation="vertical">
              <AttachmentMedia variant="image">
                <img src={image.src} alt={image.alt} />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{image.name}</AttachmentTitle>
                <AttachmentDescription>{image.meta}</AttachmentDescription>
              </AttachmentContent>
            </Attachment>
          ))}
        </AttachmentGroup>
        <Attachment state="uploading" className="w-full">
          <AttachmentMedia>
            <Spinner />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
            <AttachmentDescription>Uploading · 64%</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Cancel upload">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment className="w-full">
          <AttachmentMedia>
            <FileCodeIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>message-renderer.tsx</AttachmentTitle>
            <AttachmentDescription>TypeScript · 12 KB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove message-renderer.tsx">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>
    </Wrapper>
  );
}

export function attachmentComposition(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <Attachment className="w-full">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
            <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove sales-dashboard.pdf">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>
    </Wrapper>
  );
}

export function attachmentFeatures(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        {/* Icon media, the default size, and an action. */}
        <Attachment className="w-full">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>briefing-notes.pdf</AttachmentTitle>
            <AttachmentDescription>PDF · 1.4 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove briefing-notes.pdf">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        {/* A progress state: the title shimmers while the upload runs. */}
        <Attachment state="processing" className="w-full">
          <AttachmentMedia>
            <Spinner />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>market-research.pdf</AttachmentTitle>
            <AttachmentDescription>Processing document</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        {/* Image media, vertical orientation, and the compact size. */}
        <div className="flex items-start gap-3">
          <Attachment orientation="vertical">
            <AttachmentMedia variant="image">
              <img src={IMAGES[0]!.src} alt={IMAGES[0]!.alt} />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{IMAGES[0]!.name}</AttachmentTitle>
              <AttachmentDescription>{IMAGES[0]!.meta}</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
          <Attachment size="xs">
            <AttachmentMedia>
              <FileCodeIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>renderer.tsx</AttachmentTitle>
            </AttachmentContent>
          </Attachment>
        </div>
      </div>
    </Wrapper>
  );
}

export function attachmentImage(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <AttachmentGroup className="w-full">
          {IMAGES.map((image) => (
            <Attachment key={image.name} orientation="vertical">
              <AttachmentMedia variant="image">
                <img src={image.src} alt={image.alt} />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{image.name}</AttachmentTitle>
                <AttachmentDescription>{image.meta}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction aria-label={`Remove ${image.name}`}>
                  <XIcon />
                </AttachmentAction>
              </AttachmentActions>
              <AttachmentTrigger
                render={
                  <a
                    href={image.src}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${image.name}`}
                  />
                }
              />
            </Attachment>
          ))}
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

export function attachmentStates(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Attachment state="idle" className="w-full">
          <AttachmentMedia>
            <ClockIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>selected-file.pdf</AttachmentTitle>
            <AttachmentDescription>Ready to upload</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove selected-file.pdf">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state="uploading" className="w-full">
          <AttachmentMedia>
            <Spinner />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>design-system.zip</AttachmentTitle>
            <AttachmentDescription>Uploading · 64%</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Cancel upload">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state="processing" className="w-full">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>market-research.pdf</AttachmentTitle>
            <AttachmentDescription>Processing document</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove market-research.pdf">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state="error" className="w-full">
          <AttachmentMedia>
            <FileWarningIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>financial-model.xlsx</AttachmentTitle>
            <AttachmentDescription>
              Upload failed. Try again.
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Retry upload">
              <RefreshCwIcon />
            </AttachmentAction>
            <AttachmentAction aria-label="Remove financial-model.xlsx">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state="done" className="w-full">
          <AttachmentMedia>
            <CheckIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>uploaded-report.pdf</AttachmentTitle>
            <AttachmentDescription>Uploaded · 1.8 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove uploaded-report.pdf">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>
    </Wrapper>
  );
}

export function attachmentSizes(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <Attachment size="default" className="w-full">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Default attachment</AttachmentTitle>
            <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment size="sm" className="w-full">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Small attachment</AttachmentTitle>
            <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment size="xs" className="w-full">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Extra small attachment</AttachmentTitle>
          </AttachmentContent>
        </Attachment>
        <Attachment size="lg" className="w-full">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Large attachment</AttachmentTitle>
            <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <AttachmentGroup>
          <Attachment size="lg" orientation="vertical">
            <AttachmentMedia variant="image">
              <img src="/preview/landscape.svg" alt="A scenic landscape" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>landscape.svg</AttachmentTitle>
              <AttachmentDescription>Large tile · 10rem</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

type GroupItem = {
  name: string;
  meta: string;
  icon?: LucideIcon;
  src?: string;
  alt?: string;
};

const GROUP_ITEMS: GroupItem[] = [
  { name: "briefing-notes.pdf", meta: "PDF · 1.4 MB", icon: FileTextIcon },
  {
    name: "landscape.svg",
    meta: "SVG · 820 KB",
    src: "/preview/landscape.svg",
    alt: "A scenic landscape",
  },
  { name: "customers.csv", meta: "CSV · 18 KB", icon: TableIcon },
  { name: "renderer.tsx", meta: "TSX · 12 KB", icon: FileCodeIcon },
];

export function attachmentGroup(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <AttachmentGroup className="w-full">
          {GROUP_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <Attachment key={item.name} className="w-64">
                {item.src ? (
                  <AttachmentMedia variant="image">
                    <img src={item.src} alt={item.alt ?? ""} />
                  </AttachmentMedia>
                ) : Icon ? (
                  <AttachmentMedia>
                    <Icon />
                  </AttachmentMedia>
                ) : null}
                <AttachmentContent>
                  <AttachmentTitle>{item.name}</AttachmentTitle>
                  <AttachmentDescription>{item.meta}</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction aria-label={`Remove ${item.name}`}>
                    <XIcon />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            );
          })}
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

export function attachmentTrigger(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        <Dialog>
          <Attachment className="w-full">
            <AttachmentMedia>
              <FileSearchIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>research-summary.pdf</AttachmentTitle>
              <AttachmentDescription>Open preview dialog</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Copy link">
                <CopyIcon />
              </AttachmentAction>
              <AttachmentAction aria-label="Remove research-summary.pdf">
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
            <DialogTrigger
              render={
                <AttachmentTrigger aria-label="Preview research-summary.pdf" />
              }
            />
          </Attachment>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>research-summary.pdf</DialogTitle>
              <DialogDescription>
                The attachment trigger fills the card and opens the dialog,
                while the actions stay independently clickable above it.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </Wrapper>
  );
}

export function attachmentAccessibility(): ReactNode {
  return (
    <Wrapper>
      <div className={COLUMN}>
        {/* An icon-only action says what it does AND to which file. */}
        <Attachment className="w-full">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
            <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove sales-dashboard.pdf">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
          <AttachmentTrigger
            render={
              <a
                href="/preview/landscape.svg"
                target="_blank"
                rel="noreferrer"
                aria-label="Open sales-dashboard.pdf"
              />
            }
          />
        </Attachment>
        {/* The failure reason lives in the description, so `error` is never colour alone. */}
        <Attachment state="error" className="w-full">
          <AttachmentMedia>
            <FileWarningIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>financial-model.xlsx</AttachmentTitle>
            <AttachmentDescription>
              Upload failed — the file is larger than 25 MB.
            </AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        {/* A row of PRESENTATIONAL attachments: the group itself becomes the keyboard scroller. */}
        <AttachmentGroup
          tabIndex={0}
          role="group"
          aria-label="Attached files"
          className="w-full"
        >
          {GROUP_ITEMS.filter((item) => item.icon).map((item) => {
            const Icon = item.icon!;

            return (
              <Attachment key={item.name} className="w-64">
                <AttachmentMedia>
                  <Icon />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{item.name}</AttachmentTitle>
                  <AttachmentDescription>{item.meta}</AttachmentDescription>
                </AttachmentContent>
              </Attachment>
            );
          })}
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

/**
 * Ours (API-28): a record's files as a grid of tiles. `layout="grid"` wraps the tiles into equal
 * columns instead of the scrolling row, `AttachmentProgress` gives an upload a determinate bar, and
 * `muted` dims a file the record no longer uses while its description says why.
 */
export function attachmentRecordFiles(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-xl">
        <AttachmentGroup layout="grid" role="group" aria-label="Product files">
          {IMAGES.slice(0, 2).map((image) => (
            <Attachment key={image.name} orientation="vertical">
              <AttachmentMedia variant="image">
                <img src={image.src} alt={image.alt} />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{image.name}</AttachmentTitle>
                <AttachmentDescription>{image.meta}</AttachmentDescription>
              </AttachmentContent>
            </Attachment>
          ))}
          <Attachment state="uploading" orientation="vertical">
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>ip-rating-cert.pdf</AttachmentTitle>
              <AttachmentDescription>1.1 MB of 2.4 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentProgress
              value={46}
              aria-label="Uploading ip-rating-cert.pdf"
            />
          </Attachment>
          <Attachment muted orientation="vertical">
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>2024-datasheet.pdf</AttachmentTitle>
              <AttachmentDescription>
                Replaced by the 2026 sheet
              </AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

/** The files the tile examples open: two images, a PDF and a file with no preview. */
const FILES: (FileViewerItem & { meta: string; icon?: LucideIcon })[] = [
  {
    id: "landscape",
    name: "landscape.svg",
    meta: "SVG · 820 KB",
    contentType: "image/svg+xml",
    src: "/preview/landscape.svg",
    thumb: {
      src: "/preview/landscape.svg",
      blur: "/preview/landscape-blur.svg",
    },
    downloadHref: "/preview/landscape.svg",
  },
  {
    id: "portrait",
    name: "portrait-ada.svg",
    meta: "SVG · 12 KB",
    contentType: "image/svg+xml",
    src: "/preview/avatar-1.svg",
    downloadHref: "/preview/avatar-1.svg",
  },
  {
    id: "spec",
    name: "spec-sheet.pdf",
    meta: "PDF · 64 KB",
    contentType: "application/pdf",
    pdfSrc: "/preview/spec-sheet.pdf",
    downloadHref: "/preview/spec-sheet.pdf",
    icon: FileTextIcon,
  },
  {
    id: "ies",
    name: "beam-30deg-with-a-long-photometry-file-name.ies",
    meta: "IES · 4 KB",
    contentType: "application/octet-stream",
    size: 4096,
    downloadHref: "/preview/spec-sheet.pdf",
    icon: FileCodeIcon,
  },
];

function FileTile({
  file,
  actions = true,
  children,
  ...props
}: {
  file: (typeof FILES)[number];
  actions?: boolean;
} & Omit<ComponentProps<typeof Attachment>, "file">) {
  const Icon = file.icon;
  return (
    <Attachment orientation="vertical" file={file} {...props}>
      {children}
      <AttachmentMedia variant={Icon ? "icon" : "image"}>
        {Icon ? <Icon /> : <img src={file.src ?? ""} alt={file.name} />}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{file.name}</AttachmentTitle>
        <AttachmentDescription>{file.meta}</AttachmentDescription>
      </AttachmentContent>
      {actions ? (
        <AttachmentActions>
          <AttachmentAction
            aria-label={`Download ${file.name}`}
            render={<a href={file.downloadHref} download />}
          >
            <DownloadIcon />
          </AttachmentAction>
          <AttachmentAction aria-label={`Remove ${file.name}`}>
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
      ) : null}
    </Attachment>
  );
}

/**
 * Ours (API-28): square tiles for a form. `layout="tiles"` shows at most four a row (`columns`),
 * three and then two as the container narrows, with square media; each tile opens the viewer.
 */
export function attachmentFormTiles(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-2xl">
        <AttachmentGroup layout="tiles" role="group" aria-label="Form files">
          {FILES.map((file) => (
            <FileTile key={file.id} file={file} />
          ))}
          <Attachment state="uploading" orientation="vertical">
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>ip-rating-cert.pdf</AttachmentTitle>
              <AttachmentDescription>62%</AttachmentDescription>
            </AttachmentContent>
            <AttachmentProgress
              value={62}
              aria-label="Uploading ip-rating-cert.pdf"
            />
          </Attachment>
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

/**
 * Ours (API-28): the tile's overlay slots. `AttachmentActions side="start"` is the top-left slot
 * (a drag handle, a selection), the default `side="end"` the top-right one (at most two icon
 * actions: ×, ⋯, download). Both show on hover or focus within the tile — always on a touch
 * screen — on the blurred scrim, and a slot you do not render is simply not there.
 */
export function attachmentOverlay(): ReactNode {
  const [photo, pdf] = [FILES[0]!, FILES[2]!];
  return (
    <Wrapper>
      <div className="w-full max-w-2xl">
        <AttachmentGroup layout="tiles" role="group" aria-label="Overlay slots">
          <FileTile file={photo} actions={false}>
            <AttachmentActions side="start">
              <AttachmentAction aria-label="Mark landscape.svg as the cover">
                <CheckIcon />
              </AttachmentAction>
            </AttachmentActions>
            <AttachmentActions>
              <AttachmentAction aria-label="Remove landscape.svg">
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          </FileTile>
          <FileTile file={pdf} actions={false}>
            <AttachmentActions>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <AttachmentAction aria-label="Actions for spec-sheet.pdf">
                      <EllipsisVerticalIcon />
                    </AttachmentAction>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    render={<a href={pdf.downloadHref} download />}
                  >
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>Replace</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </AttachmentActions>
          </FileTile>
          <FileTile file={FILES[1]!} actions={false} />
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

/**
 * Ours (API-28): open on click. A tile given a `file` is one "Open {name}" button: a click, or
 * Enter or Space, opens the `FileViewer` — an image to zoom, a PDF page by page, a download card
 * for anything else — paging through the group. `AttachmentPreview` spans several groups;
 * `preview={false}` (on a tile or a group) keeps plain cards, and `onOpen` replaces the viewer.
 */
export function attachmentPreview(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <AttachmentPreview>
          <AttachmentGroup layout="tiles" role="group" aria-label="Photos">
            {FILES.slice(0, 2).map((file) => (
              <FileTile key={file.id} file={file} actions={false} />
            ))}
          </AttachmentGroup>
          <AttachmentGroup layout="tiles" role="group" aria-label="Documents">
            {FILES.slice(2).map((file) => (
              <FileTile key={file.id} file={file} actions={false} />
            ))}
          </AttachmentGroup>
        </AttachmentPreview>
        <AttachmentGroup
          layout="tiles"
          preview={false}
          role="group"
          aria-label="Without preview"
        >
          <FileTile file={FILES[0]!} actions={false} />
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

/**
 * Ours (API-28): a scrolling row sized to the row. `layout="scroll"` with `columns={4}` makes
 * each tile a quarter of the row, so four fit and the rest scroll — two and a peek on a phone.
 */
export function attachmentScrollColumns(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-2xl">
        <AttachmentGroup layout="scroll" columns={4} aria-label="Product files">
          {[...FILES, ...FILES].map((file, index) => (
            <FileTile
              key={`${file.id}-${index}`}
              file={{ ...file, id: `${file.id}-${index}` }}
              size="lg"
              actions={false}
            />
          ))}
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

/**
 * Ours (API-28): dense rows for a folder's files or an upload queue. `layout="list"` stacks
 * full-width horizontal rows with a 32px media box; a row uploading puts its progress under the
 * title, a failed one keeps its tinted border and offers Retry; each finished row opens the viewer.
 */
export function attachmentList(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-lg">
        <AttachmentGroup layout="list" role="list" aria-label="Folder files">
          {FILES.map((file) => {
            const Icon = file.icon;
            return (
              <Attachment key={file.id} file={file} role="listitem">
                <AttachmentMedia variant={Icon ? "icon" : "image"}>
                  {Icon ? <Icon /> : <img src={file.src ?? ""} alt="" />}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{file.name}</AttachmentTitle>
                  <AttachmentDescription>
                    {file.meta} · Asha Rao · 2 days ago
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    aria-label={`Download ${file.name}`}
                    render={<a href={file.downloadHref} download />}
                  >
                    <DownloadIcon />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            );
          })}
          <Attachment state="uploading" role="listitem">
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>install-guide.pdf</AttachmentTitle>
              <AttachmentProgress
                value={64}
                aria-label="Uploading install-guide.pdf"
              />
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Cancel install-guide.pdf">
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
          <Attachment state="error" role="listitem">
            <AttachmentMedia>
              <FileWarningIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>warranty-scan.tiff</AttachmentTitle>
              <AttachmentDescription>
                Upload failed. Check your connection and retry.
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Retry warranty-scan.tiff">
                <RefreshCwIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

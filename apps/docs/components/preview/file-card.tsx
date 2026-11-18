"use client";

import type { ReactNode } from "react";
import {
  DownloadIcon,
  LibraryIcon,
  LinkIcon,
  MessageSquareIcon,
  TrashIcon,
} from "lucide-react";
import { AttachmentPreview } from "@/components/ui/attachment";
import { Wrapper } from "./wrapper";
import { AttachmentGroup } from "@/components/ui/attachment";
import type { FileViewerItem } from "@/components/ui/file-viewer";
import { FileCard, UploadCard } from "@/components/ui/file-card";

const LANDSCAPE: FileViewerItem = {
  id: "landscape",
  name: "landscape.svg",
  contentType: "image/svg+xml",
  src: "/preview/landscape.svg",
  thumb: {
    src: "/preview/landscape.svg",
    blur: "/preview/landscape-blur.svg",
  },
  downloadHref: "/preview/landscape.svg",
};

const SPEC: FileViewerItem = {
  id: "spec",
  name: "spec-sheet.pdf",
  contentType: "application/pdf",
  pdfSrc: "/preview/spec-sheet.pdf",
  downloadHref: "/preview/spec-sheet.pdf",
};

/** A Download link to the file's own URL, a divider and Remove. */
const menuFor = (href: string) => [
  {
    label: "Download",
    icon: <DownloadIcon aria-hidden />,
    render: <a href={href} download />,
  },
  { type: "separator" as const },
  {
    label: "Remove",
    icon: <TrashIcon aria-hidden />,
    destructive: true,
    onSelect: () => {},
  },
];

const REMOVE = menuFor("").slice(2);

/** Cards in a `cards` group: the viewer opens on click, paging through the files. */
export function fileCard(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full">
        <AttachmentGroup layout="cards" role="list" aria-label="Files">
          <FileCard
            name={LANDSCAPE.name}
            contentType={LANDSCAPE.contentType}
            thumb={LANDSCAPE.thumb}
            descriptions={["820 KB", "Asha Rao · 2 days ago"]}
            file={LANDSCAPE}
            actions={menuFor(LANDSCAPE.downloadHref)}
          />
          <FileCard
            name={SPEC.name}
            contentType={SPEC.contentType}
            descriptions={["64 KB", "Asha Rao · today"]}
            file={SPEC}
            actions={menuFor(SPEC.downloadHref)}
          />
          <FileCard
            name="beam-30deg-with-a-long-photometry-file-name.ies"
            contentType="application/octet-stream"
            descriptions={["4 KB", "Ravi Nair · last week"]}
            actions={menuFor("/preview/spec-sheet.pdf")}
          />
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

/** `href` makes the whole card a link: a download, a page, an external site. */
export function fileCardLinks(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-xl">
        <AttachmentGroup layout="list" role="list" aria-label="Linked files">
          <FileCard
            name="install-guide.zip"
            contentType="application/zip"
            descriptions={["12 MB · downloads"]}
            href="/preview/spec-sheet.pdf"
            download
          />
          <FileCard
            name="Mounting bracket"
            icon={<LinkIcon aria-hidden />}
            descriptions={["Accessory · opens in a new tab"]}
            href="https://design.vegastack.com"
            target="_blank"
            actions={REMOVE}
          />
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

/** A muted card: the media dims, and the description says why. */
export function fileCardMuted(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-xl">
        <AttachmentGroup layout="list" role="list" aria-label="Files">
          <FileCard
            name="old-datasheet.pdf"
            contentType="application/pdf"
            descriptions={["Replaced by spec-sheet.pdf"]}
            muted
            actions={REMOVE}
          />
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

/** `UploadCard` beside finished cards: progress, preparing, and a failure with Retry. */
export function uploadCard(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-xl">
        <AttachmentGroup layout="list" role="list" aria-label="Files">
          <FileCard
            name="spec-sheet.pdf"
            contentType="application/pdf"
            descriptions={["64 KB"]}
            file={SPEC}
          />
          <UploadCard
            name="install-guide.pdf"
            type="application/pdf"
            progress={64}
            error={null}
            onCancel={() => {}}
            onRetry={() => {}}
          />
          <UploadCard
            name="site-photo.jpg"
            type="image/jpeg"
            progress={null}
            error={null}
            onCancel={() => {}}
            onRetry={() => {}}
          />
          <UploadCard
            name="warranty-scan.tiff"
            type="image/tiff"
            progress={20}
            error="Upload failed. Check your connection and retry."
            onCancel={() => {}}
            onRetry={() => {}}
          />
        </AttachmentGroup>
      </div>
    </Wrapper>
  );
}

/** Rows in a side panel's Files section: 44px, the name, one meta line, the source as an icon. */
export function fileCardRow(): ReactNode {
  return (
    <Wrapper className="items-start">
      <div className="w-80 border-s bg-background px-4 py-3">
        <AttachmentPreview>
          <ul role="list" className="-mx-2 flex min-w-0 flex-col gap-0.5">
            <FileCard
              variant="row"
              name="spec-sheet.pdf"
              contentType="application/pdf"
              descriptions={["2.2 MB", "3w ago"]}
              source={{ icon: <MessageSquareIcon />, label: "From a comment" }}
              file={SPEC}
              actions={menuFor("/preview/spec-sheet.pdf")}
            />
            <FileCard
              variant="row"
              name="landscape.svg"
              contentType="image/svg+xml"
              thumb={LANDSCAPE.thumb}
              descriptions={["48 KB", "2d ago"]}
              source={{ icon: <LibraryIcon />, label: "From the Library" }}
              file={LANDSCAPE}
              actions={menuFor("/preview/landscape.svg")}
            />
          </ul>
        </AttachmentPreview>
      </div>
    </Wrapper>
  );
}

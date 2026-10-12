"use client";

import type { ReactNode } from "react";
import { DownloadIcon, LinkIcon, TrashIcon } from "lucide-react";
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

const MENU = [
  {
    label: "Download",
    icon: <DownloadIcon aria-hidden />,
    render: <a href="/preview/spec-sheet.pdf" download />,
  },
  { type: "separator" as const },
  {
    label: "Remove",
    icon: <TrashIcon aria-hidden />,
    destructive: true,
    onSelect: () => {},
  },
];

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
            actions={MENU}
          />
          <FileCard
            name={SPEC.name}
            contentType={SPEC.contentType}
            descriptions={["64 KB", "Asha Rao · today"]}
            file={SPEC}
            actions={MENU}
          />
          <FileCard
            name="beam-30deg-with-a-long-photometry-file-name.ies"
            contentType="application/octet-stream"
            descriptions={["4 KB", "Ravi Nair · last week"]}
            actions={MENU}
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
            actions={MENU.slice(2)}
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
            actions={MENU.slice(2)}
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

"use client";

import type { ReactNode } from "react";
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
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
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
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

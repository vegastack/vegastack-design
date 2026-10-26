// @vegastack file-card@0.25.83 sha256-Hf9aawTMkJ0HbdiKI6620LLh7eoHhtfI3bw2ulYye4c=

import * as React from "react";
import { MoreHorizontal, RefreshCwIcon, XIcon } from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentProgress,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import {
  RowActionMenuItems,
  pickShortcut,
  type RowAction,
} from "@/components/ui/data-table-parts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FileViewerItem } from "@/components/ui/file-viewer";
import { Image } from "@/components/ui/image";
import { FileTypeIcon } from "@/lib/file-kind";

/** A file's small preview image: structurally the same as a `FileViewerItem`'s `thumb`. */
export type FileCardThumb = {
  /** The thumbnail URL. */
  src: string;
  /** Accepted so a stored file's thumb can be passed as is; the card shows `src`. */
  srcSet?: string;
  /** A tiny blurred preview (data URL), shown until the thumbnail has loaded. */
  blur?: string | null;
};

/** Props of {@link FileCard}. */
export interface FileCardProps {
  /** The file name: the card's title. */
  name: string;
  /**
   * MIME type, which picks the type icon when there is no thumbnail.
   * @default undefined
   */
  contentType?: string | null;
  /**
   * The stored thumbnail. With it (or `preview`) the media shows the image instead of a type icon.
   * @default undefined
   */
  thumb?: FileCardThumb | null;
  /**
   * In place of the thumbnail or type icon — a lock, a page's emoji.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * The lines under the name (size, who, when). The first reads in tabular figures; a `null`
   * entry is skipped.
   * @default undefined
   */
  descriptions?: React.ReactNode[];
  /**
   * The file this card stands for. With it the whole card is one "Open {name}" button that opens
   * the file viewer — the enclosing group's preview, or `onOpen` — and `href` is ignored.
   * @default undefined
   */
  file?: FileViewerItem;
  /**
   * Called instead of the built-in viewer when the card is opened. Needs `file`.
   * @default undefined
   */
  onOpen?: (file: FileViewerItem) => void;
  /**
   * Make the whole card a link, for a file that opens elsewhere: a download for a file the viewer
   * cannot show, or a page to navigate to. Ignored when `file` is set.
   * @default undefined
   */
  href?: string;
  /**
   * With `href`: the link downloads the file instead of navigating, and is named "Download {name}".
   * @default false
   */
  download?: boolean;
  /**
   * With `href`: the link's `target`. `_blank` also sets `rel="noopener"` and names the link
   * "Open {name} in a new tab".
   * @default undefined
   */
  target?: React.HTMLAttributeAnchorTarget;
  /**
   * Dim the media (the file is no longer in use); say why in `descriptions`.
   * @default false
   */
  muted?: boolean;
  /**
   * The ⋯ menu, named "Actions for {name}". Empty (and no `extra`) draws no actions.
   * @default []
   */
  actions?: RowAction[];
  /**
   * Controls before the ⋯ menu (a "Go to comment" link, a remove button).
   * @default undefined
   */
  extra?: React.ReactNode;
  /**
   * The picked image's local preview (an object URL): shown while there is no thumbnail yet, and
   * under the thumbnail until it loads, so the card never flashes blank.
   * @default undefined
   */
  preview?: string | null;
  /**
   * The card's size.
   * @default "default"
   */
  size?: React.ComponentProps<typeof Attachment>["size"];
  /**
   * Override the built-in link and menu names (for another language or wording). Each is given
   * the file name.
   * @default undefined
   */
  labels?: FileCardLabels;
}

/** The names `FileCard` gives its link and menu; override them through `labels`. */
export interface FileCardLabels {
  /** The ⋯ menu button. Default: "Actions for {name}". */
  actions?: (name: string) => string;
  /** The `download` link. Default: "Download {name}". */
  download?: (name: string) => string;
  /** The `target="_blank"` link. Default: "Open {name} in a new tab". */
  openInNewTab?: (name: string) => string;
  /** The plain `href` link. Default: "Open {name}". */
  open?: (name: string) => string;
}

/**
 * `FileCard` — one file as a card: its thumbnail (or type icon), name, description lines and a ⋯
 * menu of `actions`. Give it a `file` and the whole card opens the viewer; give it an `href` and
 * the whole card is a link (a download, or a page elsewhere). Put cards in an `AttachmentGroup`
 * (`layout="cards"` for a responsive grid) with `role="list"`; each card is a `listitem`.
 *
 * @example
 * <AttachmentGroup layout="cards" role="list">
 *   <FileCard
 *     name="spec-sheet.pdf"
 *     contentType="application/pdf"
 *     descriptions={["PDF · 2.4 MB"]}
 *     href="/files/spec-sheet.pdf"
 *     download
 *     actions={[{ label: "Remove", onSelect: remove, destructive: true }]}
 *   />
 * </AttachmentGroup>
 */
export function FileCard({
  name,
  contentType,
  thumb,
  icon,
  descriptions,
  file,
  onOpen,
  href,
  download = false,
  target,
  muted,
  actions = [],
  extra,
  preview,
  size,
  labels,
}: FileCardProps) {
  const src = thumb?.src ?? preview;
  const link = href !== undefined && file === undefined;
  return (
    <Attachment
      role="listitem"
      muted={muted}
      file={file}
      onOpen={onOpen}
      size={size}
    >
      <AttachmentMedia variant={!icon && src ? "image" : "icon"}>
        {icon ??
          (src ? (
            // Eager: a list that scrolls on its own never starts loading a lazy image below its
            // fold (only its blur would show).
            <Image
              src={src}
              placeholder={
                (thumb ? (preview ?? thumb.blur) : null) ?? undefined
              }
              loading="eager"
              alt=""
            />
          ) : (
            <FileTypeIcon contentType={contentType} name={name} />
          ))}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{name}</AttachmentTitle>
        {descriptions?.map((line, i) =>
          line == null ? null : (
            // Every line reads in tabular figures (AttachmentDescription's own, API-36).
            <AttachmentDescription key={i}>{line}</AttachmentDescription>
          ),
        )}
      </AttachmentContent>
      {link ? (
        <AttachmentTrigger
          render={
            <a
              href={href}
              download={download || undefined}
              target={target}
              rel={target === "_blank" ? "noopener" : undefined}
              aria-label={
                download
                  ? (labels?.download?.(name) ?? `Download ${name}`)
                  : target === "_blank"
                    ? (labels?.openInNewTab?.(name) ??
                      `Open ${name} in a new tab`)
                    : (labels?.open?.(name) ?? `Open ${name}`)
              }
            />
          }
        />
      ) : null}
      {actions.length > 0 || extra ? (
        <AttachmentActions>
          {extra}
          {actions.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <AttachmentAction
                    aria-label={
                      labels?.actions?.(name) ?? `Actions for ${name}`
                    }
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onKeyDown={pickShortcut}>
                <RowActionMenuItems actions={actions} />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </AttachmentActions>
      ) : null}
    </Attachment>
  );
}

/** Props of {@link UploadCard}. */
export interface UploadCardProps {
  /** The file name: the card's title. */
  name: string;
  /** MIME type, which picks the type icon. */
  type: string;
  /**
   * The picked image as an object URL: shown at once, while it uploads.
   * @default undefined
   */
  preview?: string | null;
  /**
   * The card's size.
   * @default "default"
   */
  size?: React.ComponentProps<typeof Attachment>["size"];
  /** Upload progress, 0–100; `null` while preparing (fingerprint, ticket). */
  progress: number | null;
  /** The failure reason; shows the error state with Retry. `null` for none. */
  error: string | null;
  /**
   * The bytes are up and the upload is being completed: the bar becomes "Finishing upload" and
   * Cancel is disabled.
   * @default false
   */
  finishing?: boolean;
  /**
   * Whether Cancel is enabled.
   * @default true
   */
  cancellable?: boolean;
  /** Cancel the upload. */
  onCancel: () => void;
  /** Retry after an error. */
  onRetry: () => void;
  /**
   * Override the built-in text and names (for another language or wording).
   * @default undefined
   */
  labels?: UploadCardLabels;
}

/** The text and names `UploadCard` shows; override them through `labels`. */
export interface UploadCardLabels {
  /** The line shown once the bytes are up. Default: "Finishing upload". */
  finishing?: string;
  /** The progress bar while uploading. Default: "Uploading {name}". */
  uploading?: (name: string) => string;
  /** The progress bar while preparing. Default: "Preparing {name}". */
  preparing?: (name: string) => string;
  /** The Retry button. Default: "Retry {name}". */
  retry?: (name: string) => string;
  /** The Cancel button. Default: "Cancel {name}". */
  cancel?: (name: string) => string;
}

/**
 * `UploadCard` — a file uploading into a list: its progress (or "preparing"), or its error with
 * Retry, and Cancel. Lays out like a `FileCard`, so a list can swap one for the other.
 *
 * @example
 * <UploadCard
 *   name="photo.jpg"
 *   type="image/jpeg"
 *   progress={42}
 *   error={null}
 *   onCancel={cancel}
 *   onRetry={retry}
 * />
 */
export function UploadCard({
  name,
  type,
  progress,
  error,
  onCancel,
  onRetry,
  preview,
  size,
  finishing = false,
  cancellable = true,
  labels,
}: UploadCardProps) {
  const state = error
    ? "error"
    : progress === null
      ? "processing"
      : "uploading";
  return (
    <Attachment state={state} role="listitem" size={size}>
      <AttachmentMedia variant={preview && !error ? "image" : "icon"}>
        {preview && !error ? (
          <Image src={preview} loading="eager" alt="" />
        ) : (
          <FileTypeIcon
            contentType={type}
            name={name}
            className="text-current"
          />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{name}</AttachmentTitle>
        {error ? (
          <AttachmentDescription>{error}</AttachmentDescription>
        ) : finishing ? (
          <AttachmentDescription>
            {labels?.finishing ?? "Finishing upload"}
          </AttachmentDescription>
        ) : (
          <AttachmentProgress
            value={progress}
            aria-label={
              state === "processing"
                ? (labels?.preparing?.(name) ?? `Preparing ${name}`)
                : (labels?.uploading?.(name) ?? `Uploading ${name}`)
            }
          />
        )}
      </AttachmentContent>
      {/* Retry and Cancel are two 24px targets: a gap keeps each one's centred square its own. */}
      <AttachmentActions className="gap-1">
        {error ? (
          <AttachmentAction
            aria-label={labels?.retry?.(name) ?? `Retry ${name}`}
            onClick={onRetry}
          >
            <RefreshCwIcon />
          </AttachmentAction>
        ) : null}
        <AttachmentAction
          disabled={finishing || !cancellable}
          aria-label={labels?.cancel?.(name) ?? `Cancel ${name}`}
          onClick={onCancel}
        >
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

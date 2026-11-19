// @vegastack file-card@0.118.0 sha256-O5QkyoR05VZHjwZlKolIzAFaTg3cSrE6J0YsF019qdQ=

import * as React from "react";
import { cn } from "@vegastack/design";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  /**
   * `card` — a bordered tile for a grid or list of files; `row` — a side panel's file row: 44px,
   * borderless, a 20px type icon or thumbnail, the name, one muted meta line (`descriptions`
   * joined with " · "), an optional `source` icon right after the name, and its actions only on
   * hover or focus (always on touch), taking no room until then. A row renders its own `<li>`: put rows in a `RecordPanelList`, so they share the
   * other rows' left edge.
   * @default "card"
   */
  variant?: "card" | "row";
  /**
   * `row`: where the file came from — a comment, the Library — as a 14px icon on the name's line,
   * right after it, named by its tooltip.
   * @default undefined
   */
  source?: FileCardSource | null;
}

/** Where a `FileCard` row's file came from: an icon, named by its tooltip ("From a comment"). */
export interface FileCardSource {
  /** The 16px icon. */
  icon: React.ReactNode;
  /** Its tooltip and accessible name. */
  label: string;
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
 * <RecordPanelList>
 *   <FileCard
 *     variant="row"
 *     name="spec-sheet.pdf"
 *     contentType="application/pdf"
 *     descriptions={["2.2 MB", "3w ago"]}
 *     source={{ icon: <MessageSquare />, label: "From a comment" }}
 *     file={file}
 *     actions={[{ label: "Remove", onSelect: remove, destructive: true }]}
 *   />
 * </RecordPanelList>
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
  variant = "card",
  source,
}: FileCardProps) {
  const src = thumb?.src ?? preview;
  const link = href !== undefined && file === undefined;
  const row = variant === "row";
  const lines = descriptions?.filter((line) => line != null) ?? [];
  const card = (
    <Attachment
      role={row ? undefined : "listitem"}
      muted={muted}
      file={file}
      onOpen={onOpen}
      size={row ? "default" : size}
      data-variant={variant}
      className={
        row
          ? // 44px and borderless, 8px in (RecordPanelItem's edge); its padding overrides the
            // tile's own, which is set per part present.
            "h-11 w-full min-w-0 flex-nowrap items-center gap-2 rounded-item border-0 bg-transparent has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-0 has-data-[slot=attachment-media]:px-2 has-data-[slot=attachment-media]:py-0"
          : undefined
      }
    >
      <AttachmentMedia
        variant={!icon && src ? "image" : "icon"}
        className={
          row
            ? cn(
                "w-5",
                (icon || !src) && "bg-transparent text-muted-foreground",
              )
            : undefined
        }
      >
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
        {row && source ? (
          // The source rides the name's line, a 14px mark right after it: no column of its own.
          <span className="flex min-w-0 items-center gap-1">
            <AttachmentTitle className="font-normal">{name}</AttachmentTitle>
            <Tooltip>
              <TooltipTrigger
                render={
                  // Over the row's open button, so its tooltip answers hover and focus.
                  <span
                    role="img"
                    tabIndex={0}
                    aria-label={source.label}
                    data-slot="file-card-source"
                    className="relative z-20 inline-flex size-5 shrink-0 items-center justify-center rounded-icon text-muted-foreground outline-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5"
                  />
                }
              >
                {source.icon}
              </TooltipTrigger>
              <TooltipContent>{source.label}</TooltipContent>
            </Tooltip>
          </span>
        ) : (
          <AttachmentTitle className={row ? "font-normal" : undefined}>
            {name}
          </AttachmentTitle>
        )}
        {row ? (
          lines.length > 0 ? (
            <AttachmentDescription className="mt-0">
              {lines.map((line, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? " · " : null}
                  {line}
                </React.Fragment>
              ))}
            </AttachmentDescription>
          ) : null
        ) : (
          descriptions?.map((line, i) =>
            line == null ? null : (
              // Every line reads in tabular figures (AttachmentDescription's own, API-36).
              <AttachmentDescription key={i}>{line}</AttachmentDescription>
            ),
          )
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
        <AttachmentActions
          className={
            row
              ? // A row's actions show on hover or focus, while their menu is open, and always on
                // touch — and take no room until then, so a row's name runs to its end at rest.
                "hidden group-focus-within/attachment:flex group-hover/attachment:flex has-aria-expanded:flex pointer-coarse:flex"
              : undefined
          }
        >
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
  return row ? (
    <li data-slot="file-card-row" className="min-w-0">
      {card}
    </li>
  ) : (
    card
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

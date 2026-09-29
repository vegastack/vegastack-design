// @vegastack file-kind@0.23.75 sha256-E6f3GvcxHrnBGjnasFF6uahGlO/CJtutD5h6m16kJaE=

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  FileArchiveIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileTypeIcon as FileDocumentIcon,
  FileVideoIcon,
  PresentationIcon,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/* ---
`file-kind` is the one place a file surface asks "what is this file and how big is it": a byte
count as a person reads it, the kind of a file from its MIME type (the extension when the type is
missing or generic), and the icon for that kind. Attachment rows, the FileViewer's file card, the
UploadDialog, the AvatarPicker and FolderTree all read these, so "1.5 KB" and a spreadsheet's icon
look the same everywhere.

Deliberately NOT done here: sniffing file contents, localising the units, or any preview logic —
what a viewer can show is the viewer's business (`FileViewer`'s own kinds).
--- */

/** What a file is, as far as a file surface needs to know. */
export type FileKind =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "text"
  | "archive"
  | "spreadsheet"
  | "document"
  | "presentation"
  | "code"
  | "other";

/** Options for {@link formatBytes}. */
export interface FormatBytesOptions {
  /**
   * Decimal places for a value under 10 in its unit (a value of 10 or more is rounded).
   * @default 1
   */
  decimals?: number;
}

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/**
 * A byte count as a person reads it, on a 1024 base: `0 B`, `999 B`, `1.5 KB`, `12 KB`,
 * `3.4 MB`, `1.1 GB`. One decimal under 10 in the unit, none from 10 up; bytes are always whole.
 *
 * @example
 * formatBytes(1536); // "1.5 KB"
 * formatBytes(2_516_582); // "2.4 MB"
 */
export function formatBytes(
  bytes: number,
  { decimals = 1 }: FormatBytesOptions = {},
): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  if (unit === 0) return `${Math.round(value)} B`;
  const places = value < 10 ? Math.max(0, decimals) : 0;
  // `toFixed` then Number drops a trailing ".0" ("2 KB", not "2.0 KB").
  let shown = Number(value.toFixed(places));
  // 1023.95 KB rounds to "1024 KB": step up a unit instead.
  if (shown >= 1024 && unit < UNITS.length - 1) {
    unit++;
    shown = 1;
  }
  return `${shown} ${UNITS[unit]}`;
}

const EXTENSION_KIND: Record<string, FileKind> = {};
function extensions(kind: FileKind, list: string) {
  for (const extension of list.split(" ")) EXTENSION_KIND[extension] = kind;
}
extensions(
  "image",
  "png jpg jpeg gif webp avif svg bmp ico tif tiff heic heif",
);
extensions("pdf", "pdf");
extensions("video", "mp4 m4v mov webm mkv avi wmv mpeg mpg ogv");
extensions("audio", "mp3 m4a wav ogg oga flac aac opus weba");
extensions("text", "txt md markdown rtf log");
extensions("archive", "zip rar 7z tar gz tgz bz2 xz");
extensions("spreadsheet", "xls xlsx xlsm ods csv tsv numbers");
extensions("document", "doc docx odt pages");
extensions("presentation", "ppt pptx odp key");
extensions(
  "code",
  "json js mjs cjs ts tsx jsx html htm css xml yaml yml sql sh py rb go rs java c h cpp",
);

/** The kind a MIME type names outright, or `null` when it is missing or generic. */
function kindOfType(type: string): FileKind | null {
  if (!type || type === "application/octet-stream") return null;
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf") return "pdf";
  if (/zip|x-tar|gzip|compressed|x-rar|x-7z|x-bzip|x-xz/.test(type))
    return "archive";
  if (/spreadsheet|ms-excel|text\/csv|tab-separated/.test(type))
    return "spreadsheet";
  if (/presentation|powerpoint/.test(type)) return "presentation";
  if (/wordprocessing|msword|opendocument\.text|rtf/.test(type))
    return "document";
  if (
    /json|javascript|typescript|ecmascript|xml|html|css|x-sh|x-python|yaml|sql/.test(
      type,
    )
  )
    return "code";
  if (type.startsWith("text/")) return "text";
  return null;
}

/**
 * The kind of a file: its MIME type first, its name's extension when the type is missing or
 * generic (`application/octet-stream`), else `"other"`.
 *
 * @example
 * fileKindOf("image/png"); // "image"
 * fileKindOf("application/octet-stream", "q3.xlsx"); // "spreadsheet"
 */
export function fileKindOf(
  contentType: string | null | undefined,
  name?: string | null,
): FileKind {
  const byType = kindOfType((contentType ?? "").trim().toLowerCase());
  if (byType) return byType;
  const dot = name ? name.lastIndexOf(".") : -1;
  if (name && dot > 0 && dot < name.length - 1) {
    const byExtension = EXTENSION_KIND[name.slice(dot + 1).toLowerCase()];
    if (byExtension) return byExtension;
  }
  return "other";
}

/** The lucide icon for each kind. */
const KIND_ICON: Record<FileKind, LucideIcon> = {
  image: FileImageIcon,
  pdf: FileTextIcon,
  video: FileVideoIcon,
  audio: FileAudioIcon,
  text: FileTextIcon,
  archive: FileArchiveIcon,
  spreadsheet: FileSpreadsheetIcon,
  document: FileDocumentIcon,
  presentation: PresentationIcon,
  code: FileCodeIcon,
  other: FileIcon,
};

/** Props accepted by {@link FileTypeIcon}. */
export interface FileTypeIconProps extends Omit<LucideProps, "ref" | "name"> {
  /**
   * The file's MIME type. Missing or generic types fall back to `name`'s extension.
   * @default undefined
   */
  contentType?: string | null;
  /**
   * The file name, read for its extension when `contentType` does not say.
   * @default undefined
   */
  name?: string | null;
  /**
   * An already-known kind, which skips detection.
   * @default undefined
   */
  kind?: FileKind;
}

/**
 * `FileTypeIcon` — the lucide icon for a file's kind, muted and hidden from assistive technology
 * by default (the file's name says what it is). A `className` with its own `text-*` wins.
 *
 * @example
 * <FileTypeIcon contentType="application/pdf" name="spec.pdf" className="size-4" />
 */
export function FileTypeIcon({
  contentType,
  name,
  kind,
  className,
  ...props
}: FileTypeIconProps) {
  const resolved = kind ?? fileKindOf(contentType, name);
  const attributes: LucideProps & Record<`data-${string}`, string> = {
    "aria-hidden": true,
    "data-slot": "file-type-icon",
    "data-kind": resolved,
    ...props,
    className: cn("shrink-0 text-muted-foreground", className),
  };
  return React.createElement(KIND_ICON[resolved], attributes);
}

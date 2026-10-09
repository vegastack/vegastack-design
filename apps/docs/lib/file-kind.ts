// @vegastack file-kind@0.25.4 sha256-wksrItdQ2Mh7e0+7MvLyf1To3oFiW0gFflnejiUIj34=

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  FileArchiveIcon,
  FileBoxIcon,
  FileChartColumnIcon,
  FileChartLineIcon,
  FileClockIcon,
  FileCodeIcon,
  FileCogIcon,
  FileIcon,
  FileImageIcon,
  FileJsonIcon,
  FileKeyIcon,
  FileLockIcon,
  FileMusicIcon,
  FilePenIcon,
  FileSpreadsheetIcon,
  FileTerminalIcon,
  FileTextIcon,
  FileTypeIcon as LucideFileTypeIcon,
  FileUserIcon,
  FileVideoCameraIcon,
  PresentationIcon,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/* ---
`file-kind` is the one place a file surface asks "what is this file and how big is it": a byte
count as a person reads it, the kind of a file from its MIME type (the extension when the type is
missing or generic), and the icon, tint and label for that kind. Attachment rows, the FileViewer's
file card, the UploadPanel, the UploadDialog, the AvatarPicker and FolderTree all read these, so
"1.5 KB" and a spreadsheet's icon look the same everywhere.

One table (`KINDS`) owns every kind's extensions, icon, tint and label; the MIME rules sit beside
it, most specific first. Deliberately NOT done here: sniffing file contents, localising the units,
or any preview logic — what a viewer can show is the viewer's business (`FileViewer`'s own kinds).
--- */

/** What a file is, as far as a file surface needs to know. */
export type FileKind =
  | "image"
  | "pdf"
  | "document"
  | "text"
  | "spreadsheet"
  | "data"
  | "presentation"
  | "video"
  | "audio"
  | "archive"
  | "code"
  | "json"
  | "config"
  | "script"
  | "cad"
  | "photometric"
  | "design"
  | "ebook"
  | "email"
  | "calendar"
  | "contact"
  | "key"
  | "encrypted"
  | "font"
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

interface KindSpec {
  /** Space-separated lower-case extensions. */
  extensions: string;
  icon: LucideIcon;
  /**
   * The ink when a surface colour-codes kinds: a status `-text` ink for the kinds people scan for
   * (PDF red, sheet and data green, slides amber, document blue), a categorical chart hue for
   * media and specialist formats, muted for the rest. Every one clears the 3:1 non-text floor on
   * the page, a card and `muted`, in both themes (`contrast-check.mjs`).
   */
  tint: string;
  label: string;
}

/** Every kind, in lookup order: an extension listed twice resolves to the first kind. */
const KINDS: Record<FileKind, KindSpec> = {
  image: {
    extensions: "png jpg jpeg gif webp avif svg bmp ico tif tiff heic heif",
    icon: FileImageIcon,
    tint: "text-chart-2",
    label: "Image",
  },
  pdf: {
    extensions: "pdf",
    icon: FileTextIcon,
    tint: "text-destructive-text",
    label: "PDF",
  },
  document: {
    extensions: "doc docx odt pages rtf dotx",
    icon: LucideFileTypeIcon,
    tint: "text-info-text",
    label: "Document",
  },
  text: {
    extensions: "txt text md markdown mdx log",
    icon: FileTextIcon,
    tint: "text-muted-foreground",
    label: "Text",
  },
  spreadsheet: {
    extensions: "xls xlsx xlsm xlsb ods numbers xltx",
    icon: FileSpreadsheetIcon,
    tint: "text-success-text",
    label: "Spreadsheet",
  },
  data: {
    extensions: "csv tsv",
    icon: FileChartColumnIcon,
    tint: "text-success-text",
    label: "Data",
  },
  presentation: {
    // `key` is Keynote here; a PEM `.key` is only a key when its MIME type says so.
    extensions: "ppt pptx pps ppsx potx key odp",
    icon: PresentationIcon,
    tint: "text-warning-text",
    label: "Presentation",
  },
  video: {
    extensions: "mp4 m4v mov webm mkv avi wmv mpeg mpg ogv",
    icon: FileVideoCameraIcon,
    tint: "text-chart-5",
    label: "Video",
  },
  audio: {
    extensions: "mp3 m4a wav ogg oga flac aac opus weba",
    icon: FileMusicIcon,
    tint: "text-chart-7",
    label: "Audio",
  },
  archive: {
    extensions: "zip rar 7z tar gz tgz bz2 xz",
    icon: FileArchiveIcon,
    tint: "text-muted-foreground",
    label: "Archive",
  },
  code: {
    extensions:
      "js mjs cjs ts tsx jsx html htm css xml sql py rb go rs java c h cpp swift kt php",
    icon: FileCodeIcon,
    tint: "text-muted-foreground",
    label: "Code",
  },
  json: {
    extensions: "json jsonc json5",
    icon: FileJsonIcon,
    tint: "text-muted-foreground",
    label: "JSON",
  },
  config: {
    extensions: "yaml yml toml ini env conf",
    icon: FileCogIcon,
    tint: "text-muted-foreground",
    label: "Config",
  },
  script: {
    extensions: "sh bash zsh bat cmd ps1",
    icon: FileTerminalIcon,
    tint: "text-muted-foreground",
    label: "Script",
  },
  cad: {
    extensions: "dwg dxf step stp stl obj fbx 3ds iges igs skp",
    icon: FileBoxIcon,
    tint: "text-chart-3",
    label: "CAD",
  },
  photometric: {
    extensions: "ies ldt",
    icon: FileChartLineIcon,
    tint: "text-chart-4",
    label: "Photometric",
  },
  design: {
    extensions: "psd ai eps indd fig sketch xd afdesign",
    icon: FilePenIcon,
    tint: "text-chart-1",
    label: "Design",
  },
  ebook: {
    extensions: "epub mobi azw3",
    icon: FileTextIcon,
    tint: "text-chart-6",
    label: "eBook",
  },
  email: {
    extensions: "eml msg",
    icon: FileUserIcon,
    tint: "text-chart-8",
    label: "Email",
  },
  calendar: {
    extensions: "ics vcs",
    icon: FileClockIcon,
    tint: "text-chart-6",
    label: "Calendar",
  },
  contact: {
    extensions: "vcf",
    icon: FileUserIcon,
    tint: "text-chart-8",
    label: "Contact",
  },
  key: {
    extensions: "pem crt cer p12 pfx",
    icon: FileKeyIcon,
    tint: "text-warning-text",
    label: "Key",
  },
  encrypted: {
    extensions: "gpg pgp",
    icon: FileLockIcon,
    tint: "text-warning-text",
    label: "Encrypted",
  },
  font: {
    extensions: "ttf otf woff woff2",
    icon: LucideFileTypeIcon,
    tint: "text-muted-foreground",
    label: "Font",
  },
  other: {
    extensions: "",
    icon: FileIcon,
    tint: "text-muted-foreground",
    label: "File",
  },
};

const EXTENSION_KIND = new Map<string, FileKind>();
for (const [kind, spec] of Object.entries(KINDS) as [FileKind, KindSpec][])
  for (const extension of spec.extensions.split(" "))
    if (extension && !EXTENSION_KIND.has(extension))
      EXTENSION_KIND.set(extension, kind);

/**
 * MIME rules, most specific first: the vendor types that live under a broad family (`image/vnd.dwg`
 * is CAD, `application/epub+zip` is an eBook, not an archive) come before the family itself.
 */
const TYPE_RULES: ReadonlyArray<readonly [RegExp, FileKind]> = [
  [/^application\/pdf$/, "pdf"],
  [
    /^image\/(vnd\.dwg|vnd\.dxf|x-dwg|x-dxf)$|^model\/|^application\/(acad|sla|step|iges)/,
    "cad",
  ],
  [
    /^image\/vnd\.adobe\.photoshop$|^application\/(postscript|illustrator|x-indesign|vnd\.adobe)|^image\/x-(photoshop|psd)$/,
    "design",
  ],
  [/^application\/(epub\+zip|x-mobipocket-ebook|vnd\.amazon\.ebook)$/, "ebook"],
  [/^image\//, "image"],
  [/^video\//, "video"],
  [/^audio\//, "audio"],
  [/^font\/|^application\/(font-|x-font-)/, "font"],
  [/^message\/rfc822$|^application\/vnd\.ms-outlook$/, "email"],
  [/^text\/(calendar|x-vcalendar)$/, "calendar"],
  [/^text\/(vcard|x-vcard|directory)$/, "contact"],
  [/^application\/(pgp-encrypted|pgp|x-gpg)/, "encrypted"],
  [
    /^application\/(x-pem-file|pkcs8|pkcs10|pkix-cert|x-x509-|x-pkcs12|pkcs12|x-pkcs7|vnd\.ms-pki\.)/,
    "key",
  ],
  [/zip|x-tar|gzip|compressed|x-rar|x-7z|x-bzip|x-xz/, "archive"],
  [/^text\/(csv|tab-separated-values)$/, "data"],
  [/spreadsheet|ms-excel|vnd\.apple\.numbers/, "spreadsheet"],
  [/presentation|powerpoint|vnd\.apple\.keynote|keynote/, "presentation"],
  [
    /wordprocessing|msword|opendocument\.text|rtf|vnd\.apple\.pages/,
    "document",
  ],
  [/json/, "json"],
  [/yaml|toml/, "config"],
  [/x-sh$|x-shellscript|x-bat|x-msdos-program|x-powershell/, "script"],
  [
    /javascript|typescript|ecmascript|xml|html|css|x-python|sql|x-ruby|x-go|x-rust|x-java|x-c\b|x-c\+\+|x-php|x-swift|x-kotlin/,
    "code",
  ],
  [/^text\//, "text"],
];

/**
 * MIME types that say nothing about the file, so the extension decides: missing, the byte-stream
 * catch-all, `text/plain`, and `video/mp2t`, which every browser hands a TypeScript `.ts`.
 */
const GENERIC_TYPES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
  "text/plain",
  "video/mp2t",
]);

/** Dotfiles that configure a tool, beyond the ones a config extension already names (`.env`). */
const CONFIG_DOTFILES = new Set([
  "gitignore",
  "gitattributes",
  "editorconfig",
  "npmrc",
  "nvmrc",
  "yarnrc",
  "prettierrc",
  "eslintrc",
  "babelrc",
  "dockerignore",
  "browserslistrc",
]);

/**
 * The kind a file name's extension names, or `null`. A dotfile (`.env`, `.env.local`,
 * `.gitignore`) is read by its name, so a tool's config file is `config` rather than `other`.
 */
function kindOfName(name: string | null | undefined): FileKind | null {
  if (!name) return null;
  const base = name.slice(name.lastIndexOf("/") + 1).toLowerCase();
  const dot = base.lastIndexOf(".");
  if (dot > 0 && dot < base.length - 1) {
    const byExtension = EXTENSION_KIND.get(base.slice(dot + 1));
    if (byExtension) return byExtension;
  }
  if (base.startsWith(".") && base.length > 1) {
    const stem = base.slice(1).split(".")[0]!;
    if (EXTENSION_KIND.get(stem) === "config" || CONFIG_DOTFILES.has(stem))
      return "config";
  }
  return null;
}

/**
 * The kind of a file: its MIME type first, its name's extension when the type is missing or
 * generic (`application/octet-stream`, `text/plain`, `video/mp2t`), else `"other"`. So a
 * `notes.json` a browser labels `text/plain` is still JSON, and only falls back to `"text"` (or
 * `"video"`) when the extension says nothing.
 *
 * @example
 * fileKindOf("image/png"); // "image"
 * fileKindOf("application/octet-stream", "q3.xlsx"); // "spreadsheet"
 * fileKindOf("text/plain", "config.yaml"); // "config"
 */
export function fileKindOf(
  contentType: string | null | undefined,
  name?: string | null,
): FileKind {
  // Drop parameters ("text/plain; charset=utf-8").
  const type = (contentType ?? "").split(";")[0]!.trim().toLowerCase();
  if (GENERIC_TYPES.has(type)) {
    const byName = kindOfName(name);
    if (byName) return byName;
    if (type === "text/plain") return "text";
    if (type === "video/mp2t") return "video";
    return "other";
  }
  for (const [pattern, kind] of TYPE_RULES) if (pattern.test(type)) return kind;
  return kindOfName(name) ?? "other";
}

/**
 * What each kind is called on a card or a label ("Spreadsheet", "PDF"). Its keys are every
 * `FileKind`, in the table's order.
 *
 * @example
 * FILE_KIND_LABEL[fileKindOf(file.contentType, file.name)]; // "Spreadsheet"
 */
export const FILE_KIND_LABEL = Object.fromEntries(
  Object.entries(KINDS).map(([kind, spec]) => [kind, spec.label]),
) as Record<FileKind, string>;

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
  /**
   * Colour the icon by kind (PDF red, sheet green, slides amber, document blue, media in a chart
   * hue), so a grid or list of files is scannable by type. Off, it is muted.
   * @default false
   */
  tinted?: boolean;
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
  tinted = false,
  className,
  ...props
}: FileTypeIconProps) {
  const resolved = kind ?? fileKindOf(contentType, name);
  const attributes: LucideProps & Record<`data-${string}`, string> = {
    "aria-hidden": true,
    "data-slot": "file-type-icon",
    "data-kind": resolved,
    ...props,
    className: cn(
      "shrink-0",
      tinted ? KINDS[resolved].tint : "text-muted-foreground",
      className,
    ),
  };
  return React.createElement(KINDS[resolved].icon, attributes);
}

/** Props accepted by {@link FileKindTile}. */
export interface FileKindTileProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** The file's MIME type. @default undefined */
  contentType?: string | null;
  /** The file name, read for its extension when `contentType` does not say. @default undefined */
  name?: string | null;
  /** An already-known kind, which skips detection. @default undefined */
  kind?: FileKind;
  /**
   * The label under the icon. `null` hides it.
   * @default FILE_KIND_LABEL[kind]
   */
  label?: React.ReactNode;
}

/**
 * `FileKindTile` — the picture for a file with no preview: a large icon in its kind's colour and
 * the kind's name on the `muted` ground, filling its box. For a card's image area
 * (`MediaCard`'s `fallback`) or a file page's stage, so a grid of Office files reads by type
 * instead of as grey boxes. Decorative (`aria-hidden`): the card names the file.
 *
 * @example
 * <MediaCard size="lg" title={file.name} image={file.thumb}
 *   fallback={<FileKindTile contentType={file.contentType} name={file.name} />} />
 */
export function FileKindTile({
  contentType,
  name,
  kind,
  label,
  className,
  ...props
}: FileKindTileProps) {
  const resolved = kind ?? fileKindOf(contentType, name);
  const text = label === undefined ? FILE_KIND_LABEL[resolved] : label;
  return React.createElement(
    "div",
    {
      "aria-hidden": true,
      "data-slot": "file-kind-tile",
      "data-kind": resolved,
      ...props,
      className: cn(
        "flex size-full min-w-0 flex-col items-center justify-center gap-2 bg-muted p-3",
        className,
      ),
    },
    React.createElement(FileTypeIcon, {
      kind: resolved,
      tinted: true,
      className: "size-10",
    }),
    text == null
      ? null
      : React.createElement(
          "span",
          {
            "data-slot": "file-kind-tile-label",
            className: cn(
              "max-w-full truncate text-xs font-medium",
              // The status inks are AA-gated as text; the media hues only as graphics.
              KINDS[resolved].tint.endsWith("-text")
                ? KINDS[resolved].tint
                : "text-muted-foreground",
            ),
          },
          text,
        ),
  );
}

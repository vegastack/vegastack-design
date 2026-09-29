// @vegastack library-01@0.23.74 sha256-BMm874eppu08g87cAoEHsE4f6uSHD9fz4lY1vqiyPkM=

/** One item in the library: a folder, a page or a file, with its place in the tree. */
export interface LibraryItem {
  id: string;
  name: string;
  kind: "folder" | "page" | "file";
  /** The folder it sits in, or `null` at the top of its section. */
  parent: string | null;
  section: "shared" | "private";
  /** A page's emoji. */
  icon?: string;
  /** A file's MIME type and size in bytes. */
  contentType?: string;
  size?: number;
  updatedAt: string;
  updatedBy: string;
}

/** A file still uploading into the open folder. */
export interface LibraryUpload {
  id: string;
  name: string;
  contentType: string;
  /** Percent sent, or `null` while the server processes it. */
  progress: number | null;
  error?: string;
}

export const SECTIONS = [
  { id: "shared", label: "Shared" },
  { id: "private", label: "Private" },
] as const;

export const LIBRARY: LibraryItem[] = [
  {
    id: "specs",
    name: "Product specs",
    kind: "folder",
    parent: null,
    section: "shared",
    updatedAt: "2026-09-28T10:12:00Z",
    updatedBy: "Asha Rao",
  },
  {
    id: "brand",
    name: "Brand",
    kind: "folder",
    parent: null,
    section: "shared",
    updatedAt: "2026-09-20T08:40:00Z",
    updatedBy: "Leo Park",
  },
  {
    id: "install",
    name: "Install guides",
    kind: "folder",
    parent: null,
    section: "shared",
    updatedAt: "2026-09-02T14:05:00Z",
    updatedBy: "Asha Rao",
  },
  {
    id: "handbook",
    name: "Team handbook",
    kind: "page",
    icon: "📘",
    parent: null,
    section: "shared",
    updatedAt: "2026-09-27T16:30:00Z",
    updatedBy: "Mina Das",
  },
  {
    id: "nova",
    name: "Nova pendant",
    kind: "folder",
    parent: "specs",
    section: "shared",
    updatedAt: "2026-09-28T10:12:00Z",
    updatedBy: "Asha Rao",
  },
  {
    id: "halo",
    name: "Halo downlight",
    kind: "folder",
    parent: "specs",
    section: "shared",
    updatedAt: "2026-09-18T11:00:00Z",
    updatedBy: "Leo Park",
  },
  {
    id: "nova-sheet",
    name: "nova-spec-sheet.pdf",
    kind: "file",
    contentType: "application/pdf",
    size: 1_843_200,
    parent: "nova",
    section: "shared",
    updatedAt: "2026-09-28T10:12:00Z",
    updatedBy: "Asha Rao",
  },
  {
    id: "nova-ies",
    name: "nova-30deg.ies",
    kind: "file",
    contentType: "application/octet-stream",
    size: 4_096,
    parent: "nova",
    section: "shared",
    updatedAt: "2026-09-26T09:20:00Z",
    updatedBy: "Asha Rao",
  },
  {
    id: "nova-render",
    name: "nova-render.png",
    kind: "file",
    contentType: "image/png",
    size: 2_516_582,
    parent: "nova",
    section: "shared",
    updatedAt: "2026-09-25T17:45:00Z",
    updatedBy: "Leo Park",
  },
  {
    id: "nova-notes",
    name: "Launch notes",
    kind: "page",
    icon: "📝",
    parent: "nova",
    section: "shared",
    updatedAt: "2026-09-24T12:00:00Z",
    updatedBy: "Mina Das",
  },
  {
    id: "price",
    name: "Price list 2026.xlsx",
    kind: "file",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 88_064,
    parent: "specs",
    section: "shared",
    updatedAt: "2026-09-21T15:10:00Z",
    updatedBy: "Mina Das",
  },
  {
    id: "logo",
    name: "logo-mark.svg",
    kind: "file",
    contentType: "image/svg+xml",
    size: 6_144,
    parent: "brand",
    section: "shared",
    updatedAt: "2026-09-20T08:40:00Z",
    updatedBy: "Leo Park",
  },
  {
    id: "tone",
    name: "Voice and tone",
    kind: "page",
    parent: "brand",
    section: "shared",
    updatedAt: "2026-09-12T10:00:00Z",
    updatedBy: "Mina Das",
  },
  {
    id: "drafts",
    name: "Drafts",
    kind: "folder",
    parent: null,
    section: "private",
    updatedAt: "2026-09-29T07:55:00Z",
    updatedBy: "Asha Rao",
  },
  {
    id: "ideas",
    name: "Ideas",
    kind: "page",
    icon: "💡",
    parent: null,
    section: "private",
    updatedAt: "2026-09-29T07:55:00Z",
    updatedBy: "Asha Rao",
  },
];

export const UPLOADS: LibraryUpload[] = [
  {
    id: "u1",
    name: "nova-install-video.mp4",
    contentType: "video/mp4",
    progress: 64,
  },
  {
    id: "u2",
    name: "nova-warranty.pdf",
    contentType: "application/pdf",
    progress: null,
  },
  {
    id: "u3",
    name: "nova-dimensions.dwg",
    contentType: "application/octet-stream",
    progress: 0,
    error: "Upload failed. Check your connection and retry.",
  },
];

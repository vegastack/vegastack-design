<!-- vsk:v1 type=brief rev=1 scope=full-plan -->

# 04 — feat(ds): folder tree, file helpers, attachment rows, media previews, folder drop (DS-A)

**State:** ready · **Repo:** `/Users/mk/projects/vegastack-design` (branch `feat/library-files-tree` → PR → patch release) · **Runs after:** nothing (parallel with 01–03)
**Scope:** full-plan — one new component, one new lib, three component extensions, one block; release through Version Packages.

DS rule: the DS repo requires a plan in `docs/plans/` before non-trivial work — copy this file to `docs/plans/2026-09-29-library-files-tree.md` in the DS PR (approved by MK in conversation, 29-09-2026).

## Outcome

The design system ships, as one patch release: `FolderTree` (a Notion-style disclosure navigation tree with lazy children, drag to move, row menus), an exported file-kind lib (`formatBytes`, `fileKindOf`, `FileTypeIcon`) used by every file surface, a `list` layout for `AttachmentGroup`, video and audio stages in `FileViewer`, folder support in `useFileDrop`/`Dropzone`, and a `library-01` block that shows them together. Docs pages, previews, tests and contracts cover every variant.

## Out of scope

Page editor, comments, versions (05/06). A text/CSV/Office preview stage (the viewer does no fetching by design). ARIA `role="tree"` (the DS records a stance against it: editing controls inside tree items trap screen readers — `filter-bar-managed.tsx:39`).

## Rules and edge cases

FolderTree

- Pattern: nested `<ul>` inside a `<nav aria-label>`, each row a link (`aria-current="page"` when active) plus a disclosure button (`aria-expanded`, `aria-controls`) for folders; the same structure `SidebarMenuSub` uses. Keyboard: Tab reaches the tree once (roving tabindex via `use-list-nav` over visible rows); ↑/↓ move, → expands/enters, ← collapses/goes to parent, Enter opens, Home/End, `*` expands siblings; typeahead by first letter.
- Rows: indent 12 px per level (token `--tree-indent`), 28 px height (`--tree-row-h`), leading icon (folder open/closed, page emoji, `FileTypeIcon`), truncated label with full name in a tooltip on overflow, trailing ⋯ button (visible on hover/focus/active row; its own tab stop inside the row via `data-row-action`), optional trailing count/badge slot.
- Lazy children: `loadChildren(id)` returns a promise; a loading row (skeleton line) shows while pending; an error row shows "Couldn't load · Retry". `maxChildren` (default 200) renders a final "Show all" row calling `onShowAll(id)`.
- Sections: `FolderTreeSection` renders a heading row ("Shared", "Private") with a trailing `+` action; collapsible; its expanded state is controlled.
- Expanded state: controlled (`expanded: string[]`, `onExpandedChange`) so the app can persist it.
- Drag to move: built on `use-drag-reorder` extended with an **inside** zone (middle 50% of a folder row = drop inside; the top and bottom quarters are ignored because the tree has no manual order). Dropping onto a collapsed folder expands it after 600 ms of hover. Invalid targets (self, descendant, non-folder) show `data-drop-invalid` and refuse. Keyboard alternative: the row menu's "Move…" (app-provided). `onMove({ ids, targetId })` may return a promise; the tree shows the row in its new place optimistically only through the app's controlled data.
- Picker mode: `mode="picker"` shows folders only, single selection (`selected`, `onSelectedChange`), no drag, no menus — for Move dialogs.
- Density follows the sidebar; no focus rings (focus = background tint), leading icons muted, active row `bg-accent`.

File-kind lib (`registry/lib/file-kind.ts`)

- `formatBytes(bytes: number, opts?: { decimals?: number }): string` — "0 B", "999 B", "1.2 KB", "3.4 MB", "1.1 GB" (1024 base, one decimal under 10, none above). Replaces `formatSize` in `upload-dialog.tsx` and `avatar-picker.tsx` and the private `formatBytes` in `file-viewer.tsx`.
- `fileKindOf(contentType: string, name?: string): FileKind` where `FileKind = "image" | "pdf" | "video" | "audio" | "text" | "archive" | "spreadsheet" | "document" | "presentation" | "code" | "other"` (MIME first, extension fallback).
- `FileTypeIcon({ contentType, name, className })` — the lucide icon per kind (muted by default).

AttachmentGroup `layout="list"`

- Dense rows: icon or 32 px thumbnail · title · description slot (size · who · when) · trailing `AttachmentActions`; whole row opens the preview scope; progress bar under the title while uploading; error state row with retry action. Works inside the existing `AttachmentPreview` scope.

FileViewer

- New kinds `video` and `audio` using the existing `VideoPlayer`/`AudioPlayer` with `src`; label "Video"/"Audio"; keyboard ←/→ still pages items; the players pause when paging away.

useFileDrop / Dropzone folders

- New option `directories?: boolean` (default false). When true: dropped folders keep each file's relative path (react-dropzone's `file-selector` already sets `relativePath`/`path`) exposed as `accepted: Array<{ file: File; relativePath: string }>` through a new callback `onEntriesAccepted`; `open({ directory: true })` opens a picker with `webkitdirectory` on a second hidden input (sanctioned by a counted `RAW_INTERACTIVE_EXEMPTIONS` entry in `tooling/design-lint.mjs`). `maxFiles` applies to the flattened count and rejects the whole drop with reason `too-many-files`.

library-01 block

- A static composition: resizable tree pane (`ResizablePanelGroup`), breadcrumbs, `DataList` list/grid toggle with MediaCards, upload rows with progress, an empty folder state, the Move dialog in picker mode, `FileViewer`. Mock data only.

## UI states

FolderTree: idle, active row, hover, focus (tint), expanded, loading children, error children, empty folder ("Empty" muted row), drag-over valid/invalid, picker selected, section collapsed. Attachment list: idle, uploading, processing, error, done. Viewer: image, pdf, video, audio, other. Dropzone: idle, dragging, invalid, too many files.

## Approach and touch points

- Create: `packages/ui/registry/ui/folder-tree.tsx` + `folder-tree.test.tsx`, `packages/ui/registry/lib/file-kind.ts` + test, `packages/ui/registry/blocks/library-01/{page.tsx,components/library.tsx,library-01.test.tsx}`, docs pages `apps/docs/content/docs/components/folder-tree.mdx`, `apps/docs/content/docs/blocks/library-01.mdx`, previews `apps/docs/components/preview/folder-tree.tsx` (+ barrel), `.changeset/library-files-tree.md` (🧩 marker).
- Modify: `registry/ui/attachment.tsx` (list layout), `registry/ui/file-viewer.tsx` (kinds, uses file-kind), `registry/ui/upload-dialog.tsx` + `avatar-picker.tsx` (use `formatBytes`), `registry/ui/use-file-drop.ts` + `dropzone.tsx` (directories), `registry/ui/use-drag-reorder.ts` (inside zone), their docs pages and previews (every variant shown), `packages/ui/registry.json`, `packages/ui/component-contracts.json` (+ `pnpm design:derived`), `packages/ui/upstream/ours.json` (folder-tree, file-kind, library-01 — "approved by MK 2026-09-29"), `tooling/design-lint.mjs` (one counted exemption).
- **Version impact:** patch (DS rule: patch changesets only).

## Tests and acceptance

- `folder-tree.test.tsx` (browser, axe): keyboard map (↑↓→←, Enter, typeahead), lazy load + error + retry, `maxChildren` "Show all", drag inside a folder calls `onMove`, descendant drop refused, picker mode selects folders only, `expectNoA11yViolations`.
- `file-kind.test.ts`: formatting table above; kind detection by MIME and extension.
- `attachment.test.tsx`: list layout renders rows, opens the preview scope, shows progress.
- `use-file-drop` test: a directory drop yields relative paths; `maxFiles` rejects the drop.
- `file-viewer.test.tsx`: video/audio stages render players and page with arrows.
- Commands: `pnpm registry:build && pnpm design:derived && pnpm check:component folder-tree && pnpm verify`; changelog dry-run/check/lint; PR quality green.
- Release: PR → `gh pr merge --squash --admin` once "PR quality" passes → approve only the newest Version Packages run → merge → `cd /tmp && npm view @vegastack/design version` shows the new patch.

## Risks and stop conditions

- If extending `use-drag-reorder` with an inside zone breaks its existing consumers' tests, ship the tree without drag (Move… covers it) and record a follow-up line in the DS plan — say so in the ledger.
- Parallel DS sessions race on `main`: rebase before merge; regenerate derived files instead of hand-resolving.

<!-- vsk:v1 type=plan rev=1 -->

## Plan (v1)

**Goal:** one DS patch release with FolderTree, file-kind, list attachments, media stages, folder drop and the library-01 block.
**Approach:** compose existing primitives (sidebar sub-menu structure, `use-list-nav`, `use-drag-reorder`, react-dropzone's file-selector) rather than adding an ARIA tree engine. Rejected: ARIA `role="tree"` (DS stance, screen-reader trap with row actions); a third-party tree (new dependency, styling drift).
**Constraints:** no new npm dependency in this plan; patch changeset; every prop JSDoc'd with `@default`; `data-slot` on every part; docs show every variant.

### Tasks

- [ ] **Task 1: file-kind lib and adopters**
  - Files — Create: `packages/ui/registry/lib/file-kind.ts`, `file-kind.test.ts` · Modify: `file-viewer.tsx`, `upload-dialog.tsx`, `avatar-picker.tsx`, `registry.json`
  - Interfaces — Produces: `formatBytes`, `fileKindOf`, `FileKind`, `FileTypeIcon` (signatures above)
  - Steps: failing test
    ```ts
    // packages/ui/registry/lib/file-kind.test.ts
    import { describe, it, expect } from "vitest";
    import { formatBytes, fileKindOf } from "./file-kind";

    describe("file-kind", () => {
      it("formats byte counts", () => {
        expect(formatBytes(1536)).toBe("1.5 KB");
      });
      it("detects kind by MIME, falling back to extension", () => {
        expect(fileKindOf("application/octet-stream", "a.xlsx")).toBe(
          "spreadsheet",
        );
      });
    });
    ```
    → run, expect FAIL (module does not exist) → implement → replace private helpers → `pnpm check:affected` → commit `🔧 file-kind helpers shared by every file surface`
- [ ] **Task 2: AttachmentGroup list layout + FileViewer media**
  - Files — Modify: `attachment.tsx`, `attachment.test.tsx`, `file-viewer.tsx`, `file-viewer.test.tsx`, both docs pages and previews
  - Interfaces — Produces: `AttachmentGroup layout: "scroll" | "grid" | "tiles" | "list"`; `FileViewerItem` unchanged (video/audio use `src`)
  - Steps: failing test
    ```tsx
    // attachment.test.tsx
    it("list layout row click opens the viewer", async () => {
      render(<AttachmentGroup layout="list" items={[imageItem]} />);
      await userEvent.click(screen.getByText(imageItem.title));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // file-viewer.test.tsx
    it("renders a video player for a video/mp4 item", () => {
      render(
        <FileViewer
          items={[{ ...baseItem, contentType: "video/mp4", src: "/clip.mp4" }]}
        />,
      );
      expect(screen.getByLabelText("Video")).toBeInTheDocument();
    });
    ```
    → run, expect FAIL (`layout="list"` and video stage don't exist yet) → implement → PASS → commit `🔧 attachment list rows; video and audio in the file viewer`
- [ ] **Task 3: folder drops**
  - Files — Modify: `use-file-drop.ts`, `dropzone.tsx`, tests, `tooling/design-lint.mjs`, docs
  - Interfaces — Produces: `useFileDrop({ directories?: boolean, onEntriesAccepted?: (entries: { file: File; relativePath: string }[]) => void })`, `open(opts?: { directory?: boolean })`, rejection reason `"too-many-files"`
  - Steps: failing test
    ```ts
    it("a two-level folder drop yields relative paths for every file", async () => {
      const onEntriesAccepted = vi.fn();
      const { result } = renderHook(() =>
        useFileDrop({ directories: true, onEntriesAccepted }),
      );
      await result.current.handleDrop(twoLevelFolderDataTransfer());
      expect(onEntriesAccepted).toHaveBeenCalledWith([
        expect.objectContaining({ relativePath: "a/b.txt" }),
        expect.objectContaining({ relativePath: "a/c/d.png" }),
      ]);
    });
    ```
    → run, expect FAIL (`directories` option does not exist) → implement → PASS → commit `🔧 folders in file drops`
- [ ] **Task 4: FolderTree**
  - Files — Create: `folder-tree.tsx`, `folder-tree.test.tsx`, docs page, preview · Modify: `use-drag-reorder.ts` (inside zone), `registry.json`, `component-contracts.json`, `ours.json`
  - Interfaces — Produces:
    ```ts
    type FolderTreeNode = { id: string; label: string; kind: "folder" | "page" | "file"; icon?: ReactNode; href?: string; hasChildren?: boolean; contentType?: string };
    <FolderTree aria-label mode?: "nav" | "picker" (default "nav")
      sections?: { id: string; label: string; action?: ReactNode }[]
      rootItems: Record<string /*sectionId*/, FolderTreeNode[]>
      loadChildren(id: string): Promise<FolderTreeNode[]>
      childrenOf?: Record<string, FolderTreeNode[] | undefined>   // controlled cache from the app
      expanded: string[]; onExpandedChange(ids: string[]): void
      activeId?: string; selected?: string; onSelectedChange?(id: string): void
      renderRowActions?(node: FolderTreeNode): ReactNode
      onMove?(move: { ids: string[]; targetId: string | null; targetSection: string }): void | Promise<void>
      maxChildren?: number (default 200); onShowAll?(id: string): void />
    ```
  - Steps: failing test — ArrowRight on a collapsed folder calls `loadChildren` and shows a loading row, then its children → implement structure, keyboard, lazy states → drag inside zone → picker → axe → `pnpm check:component folder-tree` → commit `🧩 FolderTree for file libraries`
- [ ] **Task 5: library-01 block, changeset, release**
  - Files — Create: block files, block docs page, `.changeset/library-files-tree.md`, `docs/plans/2026-09-29-library-files-tree.md`
  - Interfaces — Consumes: `FolderTree` (Task 4), the file-kind lib (Task 1), `AttachmentGroup layout="list"` and `FileViewer` media stages (Task 2) · Produces: the `library-01` block registry entry and the published patch version, consumed by web plan 07's `docs/modules.md`/usage
  - Steps: compose block → `pnpm registry:build && pnpm design:derived && pnpm verify` → changelog dry-run/check/lint → PR → merge → Version Packages → `npm view @vegastack/design version` → record version in this file's Revisions line

## Build notes (as shipped)

- Folder picker: `openDirectory()` on `useFileDrop` and on `Dropzone`'s new `actionsRef`, not `open({ directory: true })` — widening `open`'s signature broke every `onClick={drop.open}` caller (it would receive the click event). It switches the engine's own input to `webkitdirectory` for one pick, so no second input and no new `RAW_INTERACTIVE_EXEMPTIONS` entry.
- `onFilesAccepted` is optional on `useFileDrop` and `Dropzone` (pass it, `onEntriesAccepted`, or both).
- Drag into: a new `useDragInto` in `use-drag-reorder.ts` (one engine file) rather than a zone inside `useDragReorder`, so the reorder hook's consumers are untouched.
- A truncated row name shows in full through its `title`, not a Tooltip (a Tooltip trigger inside a row link would become a nested control on touch).
- The file-kind lib is `registry/lib/file-kind.ts`; `FileTypeIcon` builds its element with `React.createElement`, so the lib stays a `.ts` module with no hooks.

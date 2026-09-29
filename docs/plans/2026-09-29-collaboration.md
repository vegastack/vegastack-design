<!-- vsk:v1 type=brief rev=1 scope=full-plan -->

# 06 — feat(ds): comment threads, margin comments, version history and diffs (DS-C)

**State:** ready · **Repo:** `/Users/mk/projects/vegastack-design` (branch `feat/collaboration` → PR → patch release) · **Runs after:** 05 (TextEdit mentions/uploads used by the composer; `TextAnchor`)
**Scope:** full-plan — new components plus a sanctioned new dependency (`diff`) and the page-editor block.

DS rule: copy this file to `docs/plans/2026-09-29-collaboration.md` in the PR (approved by MK in conversation, 29-09-2026, including the `diff` dependency: "yes diff pkg is okay, add it to DS").

## Outcome

The design system ships `CommentThread` (quote, root comment, replies, reply composer, resolve/reopen, attachments), comment composers with mentions and file attachments, `CommentMargin` (thread cards aligned beside their highlighted text, stacked without overlap) with a `CommentPopover` fallback for narrow screens, `VersionList` (a version history list with named/auto/restore/conflict kinds, current marker, "Named only" filter, load more), `DiffView` (word-level added/removed rendering of two Markdown texts, lazily loaded, line-only above 200 KB combined) and the `page-editor-01` block that composes an outline rail, TextEdit with annotations, the margin and a version sheet.

## Out of scope

Unread tracking, reactions changes (existing `Reactions` reused as-is), presence component (apps compose `AvatarGroup` + `PersonAvatar`), a side-by-side diff mode.

## Rules and edge cases

CommentThread (in `comments.tsx`, reusing private `CommentBox`, `SendButton`, `focusEditor`)

- Props: `thread: { id; quote?: string; resolved?: { by: Person; at: string } | null; orphaned?: boolean; root: CommentData; replies: CommentData[] }`, `onReply(body) → Promise`, `onResolve?()`, `onReopen?()`, `onQuoteClick?()`, `active?`, `collapsed?` (shows root + "N replies" + last reply), plus the `CommentItem` callbacks (`onEdit`, `onDelete`, `onReactionToggle`, `onCopyLink`), `composer?: Partial<CommentComposerProps>` (mentions/upload pass-through).
- Quote block: muted left border, 3 lines max with fade; orphaned shows "Original text was removed" in muted italics instead.
- Header action: Resolve (check icon button, tooltip "Resolve") / resolved state shows "Resolved by Asha · 2h" and Reopen.
- Reply composer: compact, collapsed to a single-line "Reply…" field until focused; Cmd/Ctrl+Enter sends.
- Deleted root with replies: `CommentItem` already renders the tombstone; thread keeps its replies.
- `CommentItem` gains `attachments?: ReactNode` (rendered under the body, e.g. `AttachmentGroup layout="list"`).
- `CommentComposer` and `CommentThread` composers accept `mentions`, `mentionHref`, `onFileUpload`, `onImageUpload` and pass them to the TextEdit inside `CommentBox`.

CommentMargin

- `CommentMargin({ items: { id: string; top: number | null; node: ReactNode }[], gap = 12, activeId, className })` — absolutely positions cards in a relative column; desired `top` from `TextEdit`'s `onAnnotationsLayout`; measures heights with ResizeObserver; resolves overlaps by pushing later cards down, and when an active card would be pushed away from its highlight, shifts earlier cards up so the active card sits level with its text (Google Docs behaviour); items with `top: null` are not rendered (apps list them in a panel).
- `CommentPopover({ anchorRect, open, onOpenChange, children })` — a Popover anchored to a virtual rect (the highlight) for widths below the margin breakpoint; on touch widths apps use `Sheet side="bottom"` instead (documented).

VersionList

- `VersionList({ versions: VersionItem[], selectedId, onSelect, currentId, namedOnly, onNamedOnlyChange, hasMore, onLoadMore, loadingMore, now })`, `VersionItem = { id; author: Person; at: string; name?: string | null; kind: "auto" | "named" | "restore" | "conflict"; summary?: string }`.
- Rows: time (`RelativeTime mode="day" withTime`), author avatar + name, name in medium weight when present, a kind badge for `restore` ("Restored") and `conflict` ("Unsaved copy"), "Current" badge on `currentId`; roving keyboard selection; "Named only" switch in the header; "Load more" footer (keyset lists have no totals).

DiffView

- `DiffView({ before: string, after: string, mode?: "inline" (default), maxChars?: 1_000_000, wordDiffLimit?: 200_000 })` — line diff first (`diffLines`), then, only when `before.length + after.length` ≤ `wordDiffLimit` (200 KB combined), word diff inside changed line pairs (`diffWordsWithSpace`); above it the view stays line-only and shows the muted note "Showing line changes for large pages". Rendered as Markdown-agnostic text blocks with `data-diff="added" | "removed"` (added: success tint + underline-free; removed: destructive tint + strikethrough); unchanged runs longer than 6 lines collapse to "Show N unchanged lines". The diff is computed synchronously in one `useMemo` (no idle chunking). `DiffView` is exported through a `React.lazy` wrapper so `diff` is only in its chunk; apps lazy-import it when the history sheet opens, with a "Comparing…" skeleton as the Suspense fallback.
- `diff` is a sanctioned exception: `packages/ui/package.json` `"diff": "^8.0.4"`, imported by exactly one file (`diff-view.tsx`), recorded in `AGENTS.md` § Sanctioned dependency exceptions ("Approved by MK 2026-09-29"), `ours.json` rationale, registry and contract `dependencies`.

page-editor-01 block

- Composition: header (breadcrumb, "Saved" state, presence avatars, comment count button, history button, ⋯), outline rail (collapsed on narrow), TextEdit `variant="document"` with mock annotations, `CommentMargin` on xl, `CommentPopover` below, a version `Sheet` with `VersionList` + `DiffView` + "Restore this version". Mock data only.

## UI states

Thread: open, active, resolved, orphaned, collapsed, posting, error. Margin: stacked, active-aligned. VersionList: loading skeleton, empty ("No versions yet"), selected, named-only, loading more. DiffView: comparing, no changes ("No changes"), changes, collapsed unchanged runs.

## Approach and touch points

- Modify: `packages/ui/registry/ui/comments.tsx` (+ test, docs, preview), `packages/ui/package.json` (`diff`), `AGENTS.md` (sanctioned dependency line), `registry.json`, `component-contracts.json`, `ours.json`.
- Create: `registry/ui/comment-margin.tsx` (+ test), `registry/ui/version-list.tsx` (+ test), `registry/ui/diff-view.tsx` (+ test), docs pages and previews for each, `registry/blocks/page-editor-01/*`, block docs page, `.changeset/collaboration.md`, `docs/plans/2026-09-29-collaboration.md`.
- **Version impact:** patch.

## Tests and acceptance

- `comments.test.tsx`: thread renders quote/root/replies; Resolve/Reopen call handlers; orphaned copy; collapsed shows "2 replies"; reply composer submits on Cmd+Enter; attachments slot renders; axe.
- `comment-margin.test.tsx`: three items at tops 0/10/20 with 60 px cards stack at 0/72/144; activating the third aligns it to 20 and shifts earlier cards up; null tops skipped.
- `version-list.test.tsx`: keyboard selection, Named only filter callback, badges, load more; axe.
- `diff-view.test.tsx`: `before "a b c" after "a x c"` renders removed "b" and added "x"; identical → "No changes"; inputs over 200 KB combined render whole changed lines only (no word-level `data-diff` spans inside a line) with the note "Showing line changes for large pages"; axe.
- Commands and release: as in 04; confirm `diff` appears only in the `diff-view` chunk (`pnpm verify:distribution` bundle check).

## Risks and stop conditions

- If `diff` pulls a second copy into the registry consumer (version mismatch), pin to the lockfile's `8.0.4` range and report.

<!-- vsk:v1 type=plan rev=1 -->

## Plan (v1)

**Goal:** a patch release with every collaboration surface the Library and Tasks need.
**Approach:** grow `comments.tsx` (reuse its private composer parts), add three focused components and one block; `diff` isolated in one lazily loaded file. Rejected: margin layout inside TextEdit (couples editor to comment UI); a hand-rolled diff (correctness and speed risk vs. the proven jsdiff).
**Constraints:** `diff` imported by exactly one file; `CommentThread` lives in `comments.tsx`; patch changeset; docs show every state.

### Tasks

- [ ] **Task 1: CommentThread, attachments slot, composer pass-through**
  - Files — Modify: `comments.tsx`, `comments.test.tsx`, `comments.mdx`, preview
  - Interfaces — Produces: `CommentThread`, `CommentThreadProps`, `CommentThreadData`; `CommentItem attachments?: ReactNode`; composer props `mentions`, `mentionHref`, `onFileUpload`, `onImageUpload`
  - Steps: failing test
    ```tsx
    it("a resolved thread shows who resolved it and Reopen calls onReopen", async () => {
      const onReopen = vi.fn();
      render(
        <CommentThread
          thread={{
            id: "t1",
            root: rootComment,
            replies: [],
            resolved: { by: asha, at: "2026-09-29T10:00:00Z" },
          }}
          onReply={vi.fn()}
          onReopen={onReopen}
        />,
      );
      expect(screen.getByText(/Resolved by Asha/)).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Reopen" }));
      expect(onReopen).toHaveBeenCalled();
    });
    ```
    → run, expect FAIL (`CommentThread` does not exist) → implement → PASS → commit `🧩 CommentThread with resolve, quotes and attachments`
- [ ] **Task 2: CommentMargin and CommentPopover**
  - Files — Create: `comment-margin.tsx`, `comment-margin.test.tsx`, docs, preview
  - Interfaces — Produces: `CommentMargin`, `CommentMarginItem`, `CommentPopover`
  - Steps: failing stacking test above → implement → PASS → commit `🧩 CommentMargin for comments beside text`
- [ ] **Task 3: VersionList**
  - Files — Create: `version-list.tsx`, test, docs, preview
  - Interfaces — Produces: `VersionList`, `VersionItem`
  - Steps: failing test
    ```tsx
    it('"Named only" toggles onNamedOnlyChange and a conflict item shows "Unsaved copy"', async () => {
      const onNamedOnlyChange = vi.fn();
      render(
        <VersionList
          versions={[
            {
              id: "v1",
              author: asha,
              at: "2026-09-29T10:00:00Z",
              kind: "conflict",
            },
          ]}
          namedOnly={false}
          onNamedOnlyChange={onNamedOnlyChange}
        />,
      );
      expect(screen.getByText("Unsaved copy")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("switch", { name: "Named only" }));
      expect(onNamedOnlyChange).toHaveBeenCalledWith(true);
    });
    ```
    → run, expect FAIL (`VersionList` does not exist) → implement → PASS → commit `🧩 VersionList for page history`
- [ ] **Task 4: DiffView with the sanctioned `diff` dependency**
  - Files — Create: `diff-view.tsx`, test, docs, preview · Modify: `packages/ui/package.json`, `pnpm-lock.yaml`, `AGENTS.md`, `ours.json`, `registry.json`, `component-contracts.json`
  - Interfaces — Produces: `DiffView`, `DiffViewProps`
  - Steps: failing test
    ```tsx
    it("renders removed and added words between two texts", () => {
      render(<DiffView before="a b c" after="a x c" />);
      expect(screen.getByText("b")).toHaveAttribute("data-diff", "removed");
      expect(screen.getByText("x")).toHaveAttribute("data-diff", "added");
    });
    ```
    plus the 200 KB line-only case → run, expect FAIL (`DiffView` does not exist) → implement with `diffLines` + `diffWordsWithSpace` below the limit, line-only with the note above it, collapse, `React.lazy` wrapper → PASS → commit `🧩 DiffView for version changes`
- [ ] **Task 5: page-editor-01 block and release**
  - Files — Create: block files, block docs page, changeset, DS plan copy
  - Interfaces — Consumes: `CommentThread` (Task 1), `CommentMargin`/`CommentPopover` (Task 2), `VersionList` (Task 3), `DiffView` (Task 4), `TextEdit` annotations (05) · Produces: the `page-editor-01` block registry entry and the published patch version, consumed by web plan 08's page editor
  - Steps: compose → `pnpm registry:build && pnpm design:derived && pnpm verify && pnpm verify:distribution` → changelog checks → PR → merge → Version Packages → record version

**Revisions:** v1.1 (29-09-2026) — Codex plan review: finding #24.

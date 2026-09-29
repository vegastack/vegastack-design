<!-- vsk:v1 type=brief rev=1 scope=full-plan -->

# 05 — feat(ds): TextEdit mentions, uploads, callouts, toggles, outline and comment anchors (DS-B)

**State:** ready · **Repo:** `/Users/mk/projects/vegastack-design` (branch `feat/text-edit-library` → PR → patch release) · **Runs after:** nothing (parallel with 01–04)
**Scope:** full-plan — the largest DS change in the epic: new Tiptap nodes with Markdown round-trips, a decoration plugin and new public APIs on `TextEdit` and `MarkdownView`.

DS rule: copy this file to `docs/plans/2026-09-29-text-edit-library.md` in the PR (approved by MK in conversation, 29-09-2026).

## Outcome

`TextEdit` (Markdown mode) supports, with exact Markdown round-trips: `@` mentions of people, pages, files and tasks through an async search callback; image upload by paste, drop, the Image panel and the slash menu; file upload inserted as a file link; callouts (`> [!NOTE]`-style) and toggles (`<details>`); a heading outline with scroll-to-heading; and inline comment anchors drawn as decorations with a "Comment" button on selected text, available in read-only mode too. `MarkdownView` renders mention chips, file links, callouts, toggles and heading ids, still server-safe. Uploads that finish after blur still commit, and ⌘K inside the editor never reaches the app's command palette.

## Out of scope

Comment thread UI, margin layout, version list/diff (06). Collaboration/CRDT. Text colours, underline, alignment, columns (Markdown can't carry them — operator decision).

## Rules and edge cases

Mentions

- Trigger `@` after start-of-line or whitespace (`allowedPrefixes: [" "]`, like `template-editor.tsx`); menu grouped **People · Pages · Files · Tasks** (only kinds the `mentions.kinds` prop enables), ≤ 5 per group, debounced 150 ms, `AbortSignal` per keystroke, loading row, "No matches"; ↑/↓/Enter/Tab/Escape; the plugin key guards `handleKeyDown` like the slash menu.
- Node: inline atom `mention` `{ kind: "user" | "page" | "file" | "task", id: string, label: string }`; Backspace/Delete removes it whole; serialises to `[@<label>](mention://<kind>/<id>)` and parses back through a `markdownTokenizer` registered before marked's link tokenizer (labels escape `]`).
- Chip: icon per kind (`UserRound`, `FileText`/emoji, `FileTypeIcon`, `CircleCheck`), label; in the editor ⌘/Ctrl-click opens `mentionHref(kind,id)` when provided; an id starting with `restricted:` renders a muted non-link chip (the app keeps the real id after the colon so an edit by someone who can't see the target never destroys the mention; the app's server canonicalises it back on save).
- `MarkdownView` renders the same chip for `mention://` links (server-safe branch before `safeUrl`), with `mentionHref?: (kind, id) => string | null`; users are never links.

Uploads

- `onImageUpload?(file, { signal }): Promise<{ src: string; alt?: string; width?: number; height?: number }>` — paste (clipboard files), drop (editorProps.handleDrop), an "Upload" button in `ImagePanel` (uses `useFileDrop().open()`, no raw input), slash `image` shows Upload + URL. While uploading: an image node with a blob URL and `data-uploading` overlay + progress spinner; resolve swaps `src`; reject removes the node and calls `onUploadError?(file, error)`. Non-image files dropped/pasted go to `onFileUpload` when provided, else are ignored.
- `onFileUpload?(file, { signal }): Promise<{ href: string; name: string }>` — inserts a link `[<name>](<href>)`; slash `file` command. Links whose href starts with the prop `fileLinkPrefix` (default `/api/files/`) render as file chips (icon by extension, name) in both the editor and `MarkdownView`.
- Programmatic changes (upload completion, restore, annotation re-anchoring never — decorations don't change the doc) call a new internal `commitNow()` so `onValueChange` **and** `onCommit` fire even when the editor is not focused (today `commit()` returns early when `baselineRef` is null — editor:2604).

Callouts and toggles

- Callout: GitHub alert syntax `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` → block node `callout { tone: "note" | "tip" | "warning" }` rendered with the DS Alert look; slash `callout`; serialises back to the same syntax.
- Toggle: `<details><summary>Title</summary>\n\nbody\n\n</details>` → nodes `toggle` + `toggleSummary` + content; slash `toggle`; collapsed by default in `MarkdownView` (native `<details>`), open while editing.

Outline and handle

- `onOutlineChange?(headings: { id: string; level: 1 | 2 | 3 | 4; text: string }[])` fired after load and on change (debounced 150 ms). Ids: `slug(text)` + `-n` for duplicates, stable for identical text.
- `handleRef?: Ref<TextEditHandle>` with `TextEditHandle = { scrollToHeading(id: string): void; flush(): Promise<void>; focus(): void; getAnchorForSelection(): TextAnchor | null }`. `flush()` commits pending edits immediately (used before creating a comment and before navigation).
- `MarkdownView headingIds?: boolean` (default false) emits the same ids.

Comment anchors

- `type TextAnchor = { start: number; end: number; quote: string; prefix: string; suffix: string }` — offsets into the flattened anchor text `anchorText(doc) = doc.textBetween(0, doc.content.size, "\n", leafText)` where `leafText(node)` is `@<label>` for a `mention` atom and `"￼"` for every other leaf (images, file chips, any other atom); prefix/suffix 80 chars.
- Offsets and ProseMirror positions are different coordinates (block boundaries add positions but one `"\n"`; an atom is one position but `@label` is several characters). One bidirectional map converts between them: `offsetsToRange(doc, start, end): { from: number; to: number } | null` and `rangeToOffsets(doc, from, to): { start: number; end: number }`, both built from a single walk (`textIndex(doc)`) that emits runs `{ pos, offset, length, kind: "text" | "leaf" | "separator" }` in exactly `textBetween`'s order; an offset inside a mention's `@label` snaps to the atom's edges. Anchors resolve to offsets (below), convert once to PM positions, decorations then map in PM positions through every transaction, and `onAnnotationsLayout` converts the mapped range back with `rangeToOffsets` (quote/prefix/suffix re-read from `anchorText`) for persistence.
- Props: `annotations?: { id: string; anchor: TextAnchor }[]`, `activeAnnotationId?: string | null`, `onAnnotationClick?(id)`, `onAnnotationHover?(id | null)` (250 ms delay), `onCreateAnnotation?(anchor: TextAnchor)` (adds a "Comment" button to the selection bubble; hidden in code blocks and on empty selections), `onAnnotationsLayout?(items: { id: string; top: number | null; anchor: TextAnchor | null }[])` — `top` relative to the TextEdit root for margin layout (null = orphaned), `anchor` = the current mapped anchor so the app can persist moved anchors.
- Resolve order on load/when annotations change (on `anchorText(doc)`): (1) stored offsets if the text there equals the quote (whitespace-insensitive); (2) unique match of prefix+quote+suffix; (3) unique match of quote; else orphaned; the resolved offsets become PM positions through `offsetsToRange`. While editing, decorations map in PM positions through transactions (no re-resolve). Classes: `data-annotation` dashed underline at rest, filled when active, 3 s pulse via `pulseAnnotation(id)` on the handle.
- When `annotations` is set, the editor mounts eagerly (no lazy stand-in) and `readOnly` uses `setEditable(false)` with decorations still drawn (today read-only never loads the editor).
- Exported pure helpers for servers/tests: `resolveAnchor(text: string, anchor: TextAnchor): { start: number; end: number } | null`, `anchorFromRange(text: string, start: number, end: number): TextAnchor`.

Keyboard

- Mod-k inside the editor opens the link panel and stops propagation so a document-level ⌘K palette does not also open.

## UI states

Mention menu: loading, results, no matches, error ("Couldn't search"). Image: uploading overlay, failed (removed + toast by app). Annotation: rest, hover, active, pulse, orphaned (no decoration). Callout tones. Toggle open/closed.

## Approach and touch points

- Modify: `packages/ui/registry/ui/text-edit.tsx` (props, types, `TextEditHandle`, eager mount, `TextAnchor` export), `text-edit-editor.tsx` (extensions: `Mention`, `Callout`, `Toggle`/`ToggleSummary`, `CommentAnnotations` plugin, `Outline` listener; `SLASH` + `Panel` unions (`file`, `callout`, `toggle`); `ImagePanel` Upload; `handlePaste`/`handleDrop`; `commitNow`; `FLOATING_SLOTS` for the mention menu and upload panel; Mod-k propagation), `markdown-view.tsx` (mention chip, file link chip, callout, details/summary, heading ids), `text-edit.test.tsx`, `markdown-view.test.tsx`, docs pages `text-edit.mdx`, `markdown-view.mdx` (every new prop with an example), previews, `registry.json` (fix stale `variant="ghost"` whenToUse), `component-contracts.json`.
- Create: `packages/ui/registry/lib/text-anchor.ts` (+ test) for `resolveAnchor`, `anchorFromRange`, `TextAnchor` (pure strings, server-safe); `packages/ui/registry/lib/text-anchor-doc.ts` (+ test) for `anchorText`, `textIndex`, `offsetsToRange`, `rangeToOffsets` (ProseMirror `Node` input, editor-side only).
- No new dependency: `@tiptap/suggestion`, `@tiptap/markdown`, `marked` already present.
- **Version impact:** patch.

## Tests and acceptance

- Round-trip fixtures added to `test.each(markdownFixtures)`: mention of each kind, label with `]`, callout of each tone, nested list inside a toggle, image `/api/files/<id>`, file link.
- Mention menu: typing `@as` calls `search("as")` once after debounce, Enter inserts the chip, Backspace removes it whole, Escape closes.
- Upload: a pasted PNG shows the uploading overlay then the final `src`; the promise resolving after blur still fires `onCommit` with the final Markdown; rejection removes the node.
- Annotations: `resolveAnchor` table (exact, moved text, duplicated quote → context wins, deleted → null); `text-anchor-doc.test.ts` on one document holding a heading, two paragraphs, a mention, an image, a toggle (summary + body) and a callout: for every range over its text whose ends fall outside a mention label, `rangeToOffsets(offsetsToRange(r))` returns `r`, and `anchorText(doc).slice(start, end)` equals the text between the mapped positions; a range starting inside `@label` snaps to the mention's edges; offsets after each block boundary and after the image land on the right PM position; in the editor, typing before a highlight keeps it on the same words; `onAnnotationsLayout` reports `top` and mapped anchors; read-only mode still draws highlights; "Comment" button hidden in code blocks.
- Outline: headings emitted with stable ids; `scrollToHeading` scrolls the heading into view.
- `MarkdownView`: mention chips (restricted non-link), file chip, callout, details closed, heading ids; `javascript:` still stripped.
- Axe on the editor with a mention menu open.
- Commands and release: as in 04.

## Risks and stop conditions

- If the mention tokenizer can't take precedence over marked's link tokenizer in `@tiptap/markdown` 3.31.3, stop and report — the fallback (a Link-mark renderer) changes the stored format and needs the operator.
- Keep the editor chunk growth under ~25 KB gzip; report the delta in the PR.

<!-- vsk:v1 type=plan rev=1 -->

## Plan (v1)

**Goal:** a patch release where TextEdit/MarkdownView carry every editor capability the Library and Tasks need.
**Approach:** extend the existing Tiptap editor with custom nodes using `@tiptap/markdown`'s tokenizer hooks (precedent: `template-editor.tsx` chips), a single decoration plugin for anchors ported from the reference PageSync anchors minus Yjs, and a small imperative handle. Rejected: marks for comments (pollute Markdown, lost on round-trip); HTML storage (operator chose Markdown); a separate page editor component (two editors to maintain).
**Constraints:** exact Markdown round-trip for every new construct; MarkdownView stays server-safe (no hooks); extensions still built once, callbacks read through refs; no new dependency.

### Tasks

- [ ] **Task 1: text-anchor lib**
  - Files — Create: `registry/lib/text-anchor.ts`, `text-anchor.test.ts` · Modify: `registry.json`
  - Interfaces — Produces: `TextAnchor`, `resolveAnchor`, `anchorFromRange`
  - Steps: failing test
    ```ts
    const a = anchorFromRange("alpha beta gamma beta", 17, 21);
    expect(resolveAnchor("alpha beta gamma beta", a)).toEqual({
      start: 17,
      end: 21,
    });
    expect(resolveAnchor("x alpha beta gamma beta", a)).toEqual({
      start: 19,
      end: 23,
    });
    expect(resolveAnchor("alpha gamma", a)).toBeNull();
    ```
    → implement offsets → context → unique quote → null → PASS → commit `🔧 text anchors for comments on text`
- [ ] **Task 2: mentions in TextEdit and MarkdownView**
  - Files — Modify: `text-edit.tsx`, `text-edit-editor.tsx`, `markdown-view.tsx`, tests, docs, previews
  - Interfaces — Produces: `type MentionKind = "user" | "page" | "file" | "task"`; `type MentionOption = { kind: MentionKind; id: string; label: string; description?: string; icon?: ReactNode }`; props `mentions?: { kinds: MentionKind[]; search(query: string, opts: { signal: AbortSignal }): Promise<MentionOption[]> }`, `mentionHref?: (kind: MentionKind, id: string) => string | null` (both components)
  - Steps: failing round-trip fixture `"Ask [@Asha Rao](mention://user/u1) about [@Q3 plan](mention://page/p1)"` → implement node + tokenizer + menu + chip + MarkdownView branch → PASS → commit `🔧 mentions in TextEdit and MarkdownView`
- [ ] **Task 3: image and file upload**
  - Files — Modify: `text-edit.tsx`, `text-edit-editor.tsx`, `markdown-view.tsx`, tests, docs
  - Interfaces — Produces: props `onImageUpload`, `onFileUpload`, `onUploadError`, `fileLinkPrefix`; internal `commitNow()`
  - Steps: failing test
    ```ts
    it("resolves a pasted image upload and commits after blur", async () => {
      const onImageUpload = vi.fn().mockResolvedValue({ src: "/api/files/f1" });
      const onCommit = vi.fn();
      const { editor } = renderTextEdit({ onImageUpload, onCommit });
      await pasteImageFile(editor, pngFile);
      await waitFor(() =>
        expect(editor.getMarkdown()).toContain("![](/api/files/f1)"),
      );
      editor.blur();
      await onImageUpload.mock.results[0].value;
      expect(onCommit).toHaveBeenCalledWith(
        expect.stringContaining("/api/files/f1"),
      );
    });
    ```
    → run, expect FAIL (`onImageUpload` not wired) → implement paste/drop/panel/slash + commitNow → PASS → commit `🔧 upload images and files into TextEdit`
- [ ] **Task 4: callouts and toggles**
  - Files — Modify: `text-edit-editor.tsx`, `markdown-view.tsx`, `text-edit.tsx` (slash unions), tests, docs
  - Interfaces — Consumes: the extension and slash-command scaffold from Tasks 2–3 · Produces: `callout` node (`tone: "note" | "tip" | "warning"`), `toggle`/`toggleSummary` nodes, slash commands `callout`/`toggle`, MarkdownView rendering for both — consumed by Task 7's docs
  - Steps: failing fixtures `"> [!TIP]\n> Use a 25 A breaker"` and `"<details><summary>Wiring</summary>\n\n- red\n- black\n\n</details>"` round-trip → implement nodes + tokenizers + slash + MarkdownView rendering → PASS → commit `🔧 callouts and toggles in TextEdit`
- [ ] **Task 5: outline and handle**
  - Files — Modify: `text-edit.tsx`, `text-edit-editor.tsx`, `markdown-view.tsx`, tests, docs
  - Interfaces — Produces: `onOutlineChange`, `TextEditHandle`, `handleRef`, `MarkdownView headingIds`
  - Steps: failing test
    ```ts
    it("emits stable heading ids and scrolls to a duplicate heading", async () => {
      const onOutlineChange = vi.fn();
      const handleRef = createRef<TextEditHandle>();
      renderTextEdit({
        value: "## Setup\n\ntext\n\n## Setup",
        onOutlineChange,
        handleRef,
      });
      await waitFor(() =>
        expect(onOutlineChange).toHaveBeenLastCalledWith([
          expect.objectContaining({ id: "setup", text: "Setup" }),
          expect.objectContaining({ id: "setup-1", text: "Setup" }),
        ]),
      );
      const scrollIntoView = vi.fn();
      document.getElementById("setup-1")!.scrollIntoView = scrollIntoView;
      handleRef.current!.scrollToHeading("setup-1");
      expect(scrollIntoView).toHaveBeenCalled();
    });
    ```
    → run, expect FAIL (`onOutlineChange`/`handleRef` not wired) → implement → PASS → commit `🔧 TextEdit outline and handle`
- [ ] **Task 6: comment annotations**
  - Files — Create: `registry/lib/text-anchor-doc.ts`, `text-anchor-doc.test.ts` · Modify: `text-edit.tsx`, `text-edit-editor.tsx` (plugin + bubble button + eager/readOnly mount; `mention` node spec `leafText: (n) => "@" + n.attrs.label`), `registry.json`, tests, docs
  - Interfaces — Consumes: `TextAnchor`, `resolveAnchor`, `anchorFromRange` · Produces: `anchorText(doc: Node): string`, `textIndex(doc: Node): TextRun[]`, `offsetsToRange(doc: Node, start: number, end: number): { from: number; to: number } | null`, `rangeToOffsets(doc: Node, from: number, to: number): { start: number; end: number }`; props `annotations`, `activeAnnotationId`, `onAnnotationClick`, `onAnnotationHover`, `onCreateAnnotation`, `onAnnotationsLayout`; handle `pulseAnnotation(id)`, `getAnchorForSelection()` (selection → `rangeToOffsets` → `anchorFromRange(anchorText(doc), …)`)
  - Steps: failing test
    ```ts
    it("keeps the annotation decoration on its quote as the document changes before it", async () => {
      const anchor = anchorFromRange("Use a 25 A breaker", 6, 10);
      const onAnnotationsLayout = vi.fn();
      const { editor } = renderTextEdit({
        value: "Use a 25 A breaker",
        annotations: [{ id: "c1", anchor }],
        onAnnotationsLayout,
      });
      editor.insertTextAt(0, "Note: ");
      await waitFor(() => {
        const dec = editor.dom.querySelector('[data-annotation="c1"]');
        expect(dec?.textContent).toBe("25 A");
      });
      expect(onAnnotationsLayout).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "c1",
            anchor: expect.objectContaining({ start: 12, end: 16 }),
          }),
        ]),
      );
    });
    ```
    plus the `text-anchor-doc.test.ts` round-trip table (heading, paragraphs, mention, image, toggle, callout) from Tests and acceptance → run, expect FAIL (no decoration plugin or position map yet) → implement `textIndex`/`offsetsToRange`/`rangeToOffsets`, then the plugin (state {items, active, decorations}; resolve on set via `offsetsToRange`; map PM positions on tr; report via `rangeToOffsets`) + bubble "Comment" + readOnly editor → PASS → commit `🔧 comment highlights on TextEdit text`
- [ ] **Task 7: Mod-k, docs, release**
  - Files — Modify: `text-edit-editor.tsx` (stopPropagation on handled Mod-k), docs pages with every prop, `.changeset/text-edit-library.md`, `docs/plans/2026-09-29-text-edit-library.md`
  - Interfaces — Consumes: the editor's keydown handling from Task 2's extension scaffold · Produces: no new public prop (Mod-k stops propagation), the patch release artifacts (changeset, plan copy, published version)
  - Steps: failing test
    ```ts
    it("stops Mod-k from reaching a document-level listener when TextEdit handles it", () => {
      const documentKeydown = vi.fn();
      document.addEventListener("keydown", documentKeydown);
      const { editor } = renderTextEdit({});
      fireEvent.keyDown(editor.dom, { key: "k", metaKey: true });
      expect(documentKeydown).not.toHaveBeenCalled();
    });
    ```
    → run, expect FAIL (the document listener still sees it) → fix → PASS → `pnpm registry:build && pnpm design:derived && pnpm verify` → release as in 04 → record the version

**Revisions:** v1.1 (29-09-2026) — Codex plan review: finding #17.

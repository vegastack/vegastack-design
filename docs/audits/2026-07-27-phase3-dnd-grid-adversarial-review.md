# Adversarial review — phase 3 (D1–D4 engines: drag stack, file drop, DataGrid)

**Date:** 2026-07-27 · **Round:** 20 · **Scope:** commits `cd1ba95..HEAD` — the D1–D4 dependency
sanction, `use-drag-reorder`, `sortable-list`, `board`, `use-file-drop`, `dropzone`, `data-grid`,
and every consistency surface the wave touched. Four independent opus reviewers (drag stack ·
file-drop stack · data-grid · cross-cutting consistency); every finding verified by execution
before acceptance, and every accepted finding fixed in this round — nothing deferred.

## Ship-blocking findings (all fixed)

### Drag stack

1. **A pointer drop in a gap between rows (or on the dragged row itself) silently appended the
   item to the end of its container.** The item target refuses the source, Pragmatic falls through
   to the container target, and the container branch meant "append". Fixed at the root: a
   container-level drop within the source's OWN container is now a no-op; cross-container
   container drops still append. Regression-tested with real synthetic Pragmatic drags (which
   require dragstart on the registered draggable at the handle's coordinates — documented in the
   test helper).
2. **A cross-column keyboard move stranded the session on `<body>`** — the card remounts under its
   new column, React fires no blur for unmounted nodes, so move mode survived but focus and all
   further steps died (and the card stayed dimmed forever). Fixed in the hook: while a keyboard
   move session is live, a post-render effect restores focus to the moved item's handle whenever
   focus fell off; pointer drags reset the session counter so the effect can never fire mid-drag.
   Tested: two consecutive cross-column steps, then Escape.
3. **Three tests were vacuous because `IconButton` overwrites a caller's `data-slot`** — the
   selectors they asserted `null` could never match anything. The dead attributes were removed and
   the tests re-anchored on accessible names (which is also the better assertion).
4. **The board lost its only tab stop when the roving card disappeared** (host poll/filter). The
   roving target is now reconciled against the current card set every render.

### File drop

5. **`ref={ref}` clobbered react-dropzone's root ref** — even when undefined — killing keyboard
   activation AND the engine's drag-depth counting (the child-`dragleave` flapping the header
   comment credits the engine with solving). Fixed with a merged ref; the load-bearing nature of
   `dropProps.ref` is now documented in both files.
6. **The documented a11y model was false**: the engine puts `tabIndex=0` + `role="presentation"`
   on the root and `tabIndex=-1` on the input, so the "focusable, keyboard-operable input" story
   didn't exist. The model is now the engine's, made honest: the surface is the named control
   (`role="button"`, Enter/Space opens the picker), the input is a `display:none` SIBLING bridge
   (axe `nested-interactive` forbids nesting it). Every claim surface was reconciled: MDX,
   contract records, design.md, the design-lint exemption rationale, the changeset, registry meta.
7. **Paste bypassed `accept` entirely** — a PDF pasted into an image-only dropzone was handed to
   the host with no rejection. The paste path now applies the same constraint set as drop: accept
   (MIME pattern or extension), `maxSize`/`minSize`, and the batch cap with surplus-only
   `too-many-files` (previously `multiple={false}` silently discarded surplus pasted files).

### DataGrid

8. **The roving tab stop could vanish** (hide the active column via the picker, or shrink the data
   under the active row) leaving the grid body keyboard-unreachable. The roving coordinate is now
   clamped against the rendered geometry every render; regression test asserts exactly one stop
   survives both cases.
9. **`advanceEdit` was dead code and the source claimed Tab-advance existed.** Removed, claims
   corrected — Tab behaviour is EditableCell's blur-commit, exactly what the MDX documents.
10. **Header keystrokes leaked into the cell layer** (Enter on a sort header sorted AND opened the
    active cell's editor, stealing focus). The grid keydown handler now acts only on events
    originating in a body gridcell; tested.

## Fixed in the same pass (medium/low)

- `preventWindowDrop={false}` was a no-op (the engine's own `preventDropOnDocument` default was
  never wired) — the option now feeds the engine and the redundant hand-rolled listener is gone.
- `open()` threw while disabled (typed `() => void`, engine nulls it) — now a safe no-op.
- Rejection announcements never said WHY — they now carry the reason ("huge.png was refused — too
  large"); `minSize` is exposed so `file-too-small` is reachable; `maxFiles: 0` means unlimited on
  every path.
- A superseded drag move's rejection was silently swallowed — rejections now always announce.
- Move-mode horizontal arrows ignored RTL while browsing arrows respected it — both now follow
  document direction; tested under `dir="rtl"`.
- Locked board lanes still accepted pointer drops on their CARDS — new `canDropInContainer` hook
  option closes the item-target hole; the board feeds it column droppability.
- The board card menu could not order within a column (on touch it is the only path) — it now
  ships Move up/down/top/bottom plus the cross-column targets.
- `requestMove` mislabeled menu moves as `input: "keyboard"` — the vocabulary gains `"menu"`.
- DataGrid: `aria-rowindex`/`aria-rowcount` now count group rows; `aria-colcount`/`aria-colindex`
  convey the FULL declared column set; virtualization switched from absolutely-positioned flex
  rows (which cannot align with the header and overlapped when taller than the estimate) to
  spacer-row windowing with `measureElement` + `getItemKey`; the sorted row model is memoized (a
  fresh `sorting` array per render defeated the engine's cache); responsive revelation hides
  right-to-left with no holes; the editor-close focus restore no longer steals focus from a
  control the user just clicked (the Columns-menu race); keyboard load-more fires once per page
  even without `loading`; `onColumnOrderChange` (a stub that could never fire) was removed —
  `columnOrder` is documented controlled-only, and the "grid column reorder" claims in AGENTS.md /
  the hook header / registry meta were corrected.
- Consistency: data-list's four "deferred / future scope" claims now point at Board/DataGrid;
  AGENTS.md's contract-suite numbers corrected to 108 routes / 864 checks; the sanction taxonomy
  wording fixed (react-table owns a state machine, not interaction semantics); the plan's Status
  line records MK's approval; guides hook roster completed; a `@vegastack/design` changeset added
  so the npm-shipped skill roster actually releases.

## Explicitly accepted (with rationale)

- **The engine's document-level drop cancellation is payload-blind** — while a Dropzone is mounted
  with `preventWindowDrop` (default), text drags to unrelated inputs on the page are also
  cancelled. Inherited react-dropzone behaviour; the opt-out now genuinely works, and a
  drop-target-dense page can set `preventWindowDrop={false}`.
- **Board's Move menu appends to the target column** (then Move up/down refines) rather than
  offering a position picker — lossless in two steps, and the menu stays scannable.
- **DataGrid ships no column-reorder affordance** — `columnOrder` applies a host-owned order. A
  drag-reorder header layer is a future commission, not a silent stub.
- **`refCache` prunes on detach** — identity stays stable across a mounted lifetime, which is the
  invariant the active-drag teardown bug requires.

## Post-fix verification

design-lint clean · `pnpm lint` 7/7 · typecheck clean · full browser unit suite **1458/1458**
(120 files; +15 regression tests this round) · behaviour contracts: full sweep 864/864 over 108
routes (pre-fix state), then the five touched routes re-run post-fix 40/40 · `registry:build`
idempotent · `design:sync:check` + `design:derived` current · skill mirror synced. WebKit smoke
remains blocked on this SSH host (no Aqua bootstrap — the documented 0a-note); Firefox smoke and
the receipt-minting `gates:push` must run from MK's GUI session before `/ship`.

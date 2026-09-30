# 2026-09-30 — Library redesign gaps: tree drops from the list, dense grid, image badge, static waveform

**Status:** approved under MK's operator mandate of 30-09-2026 (standing approval for the Regent
Library DS patches). Point-in-time record; the source and gates are authoritative.
**Motivation:** Regent web app plan `.vegastack/plans/modules-library/13-library-redesign.md`,
§ "DS gaps" DS-1…DS-4. The Library moves its folder tree into the app sidebar, turns its canvas
into a Drive-like grid, and needs four small additions here first.
**Branch:** `feat/library-redesign-gaps` from `origin/main` (`66f3d2c1cb`). Runs beside a
comments patch; rebase before merge and regenerate derived files, never hand-merge them.
**No new npm dependencies. No new decision rows** — all four components are ours.

## DS-1 `folder-tree`

- `dragScope?: string` — passed to the tree's `useDragInto` as its `scope`. Tree folders and
  section headings then take drags from any source in that scope (a `DataList`'s rows and cards),
  and the tree's own row drags reach `BreadcrumbDropTarget`s and `DataList` folder rows in it.
- The tree's drag sources and folder targets use the host's raw node ids as their keys (today
  they are prefixed `n:` internally), so a drag from the tree carries ids another target
  understands, and a row from the list carries ids the tree understands. Section headings keep a
  private, instance-unique key.
- `canDropInto?(move: FolderTreeMove) => boolean` — the host's rule, asked after the tree's own
  (self, descendant, the place it already is — checked for every id the tree holds). It is the
  only rule for ids the tree does not hold (a file row from the list), since the tree does not
  know their ancestry.
- `FolderTreeSection.href` — the heading becomes a link (through `linkRender`), active
  (`aria-current="page"`, the active tint) when `activeId === section.id`. Its disclosure moves to
  a trailing chevron button with `aria-expanded`, out of the tab order like a folder's; → and ←
  still open and close the section from the keyboard.
- Labels: `itemCount(count)` to name the items of a drop the tree cannot name, and
  `toggleSection(label)` for the section chevron.

## DS-2 `data-list`

- `gridDensity?: "default" | "dense"`. Dense at `gridSize="lg"`: 2 columns, 3 from `@2xl`, 4 from
  `@5xl`, 5 from `@7xl` (container widths 672 / 1024 / 1280 px). Dense at the default size: 1, 2
  from `@lg`, 3 from `@3xl`, 4 from `@6xl`. The loading skeleton follows the same ladder.

## DS-3 `media-card`

- `imageBadge?: ReactNode` — a chip at the bottom end of the image ("▶ 1:24"), scrim ink on a
  `scrim/60` wash (the `/40` tile scrim measures under 3:1 for small text over a light frame),
  `pointer-events-none`, so the card link under it still takes the click. Rendered only when the
  card has an image area.

## DS-4 `audio-player`

- `AudioWaveform({ peaks, bars?, className })` — static, `aria-hidden` bars in
  `muted-foreground`, the player waveform's drawing (rounded bars, 1px gaps, the loudest peak full
  height, a 6% floor), no playback. `bars` (default 48) resamples long peak arrays by bucket
  maximum so a card-width waveform keeps visible gaps. No peaks draws the flat placeholder.

## Tests, docs, release

- One test per gap: a `DataList` row in scope "x" dropped on a `FolderTree` folder in scope "x"
  calls `canDropInto` and `onMove` with the row id, and a tree drag reaches a
  `BreadcrumbDropTarget`; a section `href` renders a link with `aria-current`; the dense grid
  classes; the `imageBadge` render; the `AudioWaveform` `aria-hidden` bars. Axe on each new state.
- Docs: an example per gap on each page; contract records updated; `pnpm registry:build` and
  `pnpm design:derived`; a patch changeset.
- Release under the standing approval: PR → PR quality → squash merge → Version Packages → publish.

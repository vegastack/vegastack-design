# 2026-09-30 — Table of contents, comment-highlight access, list selection and drag

**Status:** approved under MK's standing approval for the Regent Library mandate (operator,
30-09-2026). Point-in-time record; the source and gates are authoritative.
**Motivation:** Regent web app plan `12-mandate-audit-polish.md` Phases 5 (Drive-like Library:
multi-select, bulk actions, drag into folders and breadcrumbs), 7 (a sticky table of contents with
the current heading, a sheet on small screens) and 8 (comments beside text, usable on touch and by
keyboard). Findings: `research-reference-apps.md` §§ 3, 4 and 5 in that repo.
**Branch:** `feat/toc-selection` from `origin/main` (`6534062716`). Runs beside
`feat/media-previews`; rebase before merge and regenerate derived files, never hand-merge them.
**No new npm dependencies.**

## 1. `TableOfContents` (new, ours)

- Items `{ id, level, text }[]` (TextEdit's outline items fit as-is). Sticky, with a scroll-spy:
  the active heading is the last one whose top is at or above a line at
  `min(180px, 28% of the viewport)`; at the bottom of the scroll range the last heading is forced
  active. `aria-current="location"` plus a visible marker on the active item.
- `variant="rail"` — collapsed ticks that expand into labels on hover or focus, using plain
  transitions the global reduced-motion reset neutralises; `variant="list"` — always labelled.
- `trigger` — renders the list inside a left `Sheet` for small screens; choosing an item closes it.
- `onNavigate(id)` on click and Enter; one tab stop with arrow keys (`useListNav`).
- `useActiveHeading` exported from the same file for custom layouts.
- `page-editor-01` uses it (rail on wide screens, an "Outline" sheet trigger below).

## 2. `TextEdit` comment highlights

- Keyboard-reachable highlights: in read mode each highlight is focusable and Enter opens its
  thread (`onAnnotationClick`); in edit mode editing is unchanged and a keyboard path opens the
  thread from the caret, plus the focusable count pill.
- Optional count pill after each highlight (`annotationCounts`), for touch widths, as a
  non-editable widget that is never serialised.

## 3. `DataList` selection and drag

The Regent Library list uses `DataList` (`src/modules/library/components/folder-view.tsx`).

- Checkbox selection gains shift-click range selection (from the last toggled row, in display
  order, in list and grid view), ⌘/Ctrl+A (select all while focus is in the list, never from a
  text field), Esc (clear), Space on a focused row link (toggle). ⌘/Ctrl-click keeps opening a
  row link in a new tab.
- Grid cards get the same checkbox, shown on hover/focus and always once anything is selected.
- `selectionActions` renders an `ActionBar` ("N selected", the host's actions, "Clear
  selection") centred over the list; its actions scroll on a narrow screen rather than overflow.
- Drag rows (or cards) onto drop targets with the existing `useDragInto`: `onDropInto`,
  `canDropInto`, `canDropOnRow`, `dragScope`. Dragging a selected row carries the whole
  selection. `useDragInto` gains `scope` (sources and targets of every instance with the same
  scope interoperate) and `getDragIds` (the ids a drag carries), plus an "N items" drag preview.
  The keyboard path stays the host's "Move…" menu.

## 4. Breadcrumb drop targets and sibling menus (new, ours: `breadcrumb-cascade`)

`breadcrumb` is upstream's file plus a patch whose every hunk needs a decision row marked
**ours**; adding props to it would need a new row, which is MK's decision. So both additions ship
as one new item that composes upstream's parts:

- `BreadcrumbDropTarget` — makes a breadcrumb link a drop target for rows dragged from a
  `DataList` in the same `dragScope` (`onDropInto`, `canDropInto`).
- `BreadcrumbSiblings` — a dropdown per segment listing the segment's siblings (vegastack-pages'
  `BreadcrumbCascade`), keyboard-operable through the DS `DropdownMenu`.

## 5. Per PR

Source, tests (axe per distinct state), a docs page or updated page for each item showing every
state, contract records, `pnpm registry:build && pnpm design:derived`, one changeset. Release:
PR → PR quality → squash-merge (`--admin`) → approve only the newest Version Packages run →
merge → confirm the registry deploy and the npm version.

## 6. As built (differences from the sections above)

- `TableOfContents`: the spy's default container is the headings' nearest scrolling ancestor
  (the window when there is none), and the last heading is forced active only when the container
  can scroll. The rail opens on keyboard focus (`:focus-visible`) or a resting pointer, not on a
  mouse click. The sticky offset is `--table-of-contents-top`, declared at zero on the component and
  set through its `className`. Rail and list rows are 28px tall.
- `TextEdit`: the count pill is never a tab stop (the read-view highlight is, and Alt+Enter is the
  editing path); `annotationCounts="auto"` uses the `lg` viewport breakpoint and `pointer: coarse`.
  `annotationLabel` names a focusable highlight.
- `DataList`: a default-size grid card reserves a gutter for its checkbox; the selection bar's name
  is `selectionBarLabel`.

# Table-grid primitives — Release A (grid cells) and Release B (floating editor and field-settings parts)

Status: APPROVED by MK 2026-10-30 — `variant="cell"` on the display and the editor; `AppShellBleed` for the bleed; version bumps as proposed (A patch, B minor; the changeset names `@vegastack/ui` and `@vegastack/design` together, as every registry change here does). Release A implemented; publishing waits for a separate "yes proceed" per step. Requested by the Regent web app
(`web-app-regent-v2`, branch `fix/tables-grid-polish`, commit 3f2318bc), which today carries these as
app-side hacks over `@vegastack/design` 0.8.53.

Scope: move the table-specific UI hacks into the DS in two back-to-back releases. Each is additive:
nothing changes for a consumer that does not opt in. After each, Regent pulls it as its own PR, then
a follow-up adoption PR deletes the app code it replaces.

Non-goals: no change to default rendering of any existing prop; no new dependency; no change to
`EditableCell`'s own contract; no Regent-specific vocabulary in the DS (the app's "table", "row" copy
stays in the app).

## Release A — additive options on existing components

### A1. `FieldCellDisplay` — a `grid` presentation

Replaces the app's `CellFace` (`cell-face.tsx`, 123 lines).

One prop, not five, because the five behaviours only make sense together (a grid cell is one clipped
line):

```ts
interface FieldCellDisplayProps {
  /**
   * `cell` — the value as a grid cell shows it: one clipped line that never grows its cell.
   * A number is plain (no digit grouping; only currency groups), a percent likewise; a link shows
   * without its scheme and without a trailing slash on a bare host; a date or date-time is clipped
   * on one line instead of wrapping; a person is always avatar plus name.
   * @default "default"
   */
  density?: "default" | "cell";
}
```

Open point: name. `density` is wrong if it later means row height; `variant="cell"` is the other
candidate. Proposed: `variant`. Everything above applies only for `variant="cell"`; `state !== "ready"`
falls through to the existing skeleton/shimmer exactly as `CellFace` does today.

### A2. `FieldCellEditor` — `bare`, plain numbers, a growing text box

Replaces the app's `TextBox`, `NumberBox` and the `BARE` data-slot override string in
`cell-editor-panel.tsx`.

```ts
interface FieldCellEditorProps {
  /**
   * No border, fill or shadow of its own: the editor sits inside a surface that already is the box
   * (a floating cell editor). Failure still reads — an invalid draft turns the text destructive.
   * @default false
   */
  bare?: boolean;
  /**
   * `plain` — a number is typed as written: the locale's decimal mark, no steppers, no digit
   * grouping; ArrowUp/ArrowDown step by 1; "-", "." and "1." are valid in-progress drafts; an
   * unreadable draft cancels on blur. Applies to number and percent.
   * @default "field" — the current NumberField with its steppers
   */
  numberMode?: "field" | "plain";
  /**
   * `grow` — text is one wrapping box that grows to `max-h-60` then scrolls; newlines pasted or
   * typed become spaces; commits on blur; Enter / Shift+Enter / Tab / Shift+Tab commit with a move
   * down / up / right / left; Escape cancels; no key is taken during IME composition.
   * @default "line" — the current single-line Input
   */
  textMode?: "line" | "grow";
}
```

`bare` also hides the number field's addon (what `[&_[data-slot=input-group-addon]:has(...)]:hidden`
does now) so the two stay one concept. Open point: whether the three should collapse into one
`variant="cell"` on the editor, mirroring A1 (one prop to opt a whole grid into, instead of three to
keep in step). Proposed: yes — `variant?: "default" | "cell"` on both, which sets all three. Fewer
props, no invalid combinations; the three stay as internal constants.

### A3. `DataGrid` — `headerAlign`

Replaces the header `order-*` CSS block in the app's `GRID_FRAME`.

```ts
interface DataGridColumn<T> {
  /**
   * Where the header's content sits, apart from the values. A numeric column's values and footer
   * stay end-aligned while its header starts at the start, so every header leads the same way:
   * icon, name, sort arrow, menu chevron, in that order from the start.
   * @default same as `align`
   */
  headerAlign?: "start" | "center" | "end";
}
```

And a grid-wide shortcut, since the app sets it on every numeric column:

```ts
interface DataGridProps<T> {
  /** @default "column" — each column's `headerAlign`/`align`. `start`: every header leads. */
  headerAlign?: "column" | "start";
}
```

Fix needed in `headerCellClass` and the header menu (`data-grid.tsx` ~1807–1995): with
`align="end"` the icon/label/sort/chevron are laid out from the right; with `headerAlign="start"`
they must come out in DOM order from the left, which today needs `order-*` overrides because the
chevron and sort glyph are placed by `align`.

### A4. `DataGrid` — fill, bleed, spacer, dividers, editing tint

Replaces `use-fill-height.ts` (49 lines), the `-mx-(--page-gutter) -mb-(--page-gutter)` wrapper
classes, and most of `GRID_FRAME`.

```ts
interface DataGridProps<T> {
  /**
   * Height from the grid's top edge to the bottom of its nearest vertically scrolling ancestor, so
   * the grid's scroll bar rests at the bottom of the window. Replaces `maxHeight` (they are
   * mutually exclusive; `maxHeight` wins if both are set). Follows the window, the scroller, and
   * anything above the grid that comes, goes or resizes (ResizeObserver on the scroller and on the
   * grid's parent, plus a window resize listener). At least 240px. Needs `virtualize`.
   * @default false
   */
  fill?: boolean;
  /**
   * An empty band after the last row so the last rows can scroll clear of anything floating at the
   * bottom (an add-row bar, a toast). `true` is 180px; a number sets it.
   * @default false
   */
  endSpacer?: boolean | number;
  /**
   * Vertical lines between every column, including a 1px line after the last frozen column that
   * draws over its sticky background (a sticky cell's own border hides under it once the grid
   * scrolls).
   * @default false
   */
  columnDividers?: boolean;
  /**
   * The cell being edited is filled with `bg-accent` (set `data-editing` today; the app styles it).
   * @default false
   */
  editingTint?: boolean;
}
```

`fill` needs the scroller to be defined. A page that lets a grid reach the edges (so its scroll
bars rest at the page's edge, not inside a gutter) needs a page-level option, not negative margins
on a wrapper (`app-shell.tsx` forbids wrapper gutters):

```ts
interface AppShellPageProps {
  /**
   * Let the page's last child reach the page's side edges and bottom: its gutters are removed on
   * those three sides for that child only. For a full-bleed grid or canvas under a PageHeader that
   * keeps the gutter. Sets `data-bleed` on the child's wrapper; no child needs a class.
   * @default false
   */
  bleed?: boolean;
}
```

Open points: (1) `bleed` as a prop on `AppShellPage`, or a small `AppShellBleed` wrapper
component that owns the three negative margins — the wrapper is more explicit for a page that
bleeds one section rather than "the last child". Proposed: `AppShellBleed`, because "last child"
is implicit and the shell already has `AppShellSection`. (2) `fill` inside a bleed region measures
to the bottom of the scroller including the bleed, which is the behaviour the app has today.

### Release A tests

Colocated unit tests in the existing files, per the DS rules: `field-cell.test.tsx` (cell variant
faces, number plain-mode typing, text grow keys, IME guard), `data-grid.test.tsx` (`headerAlign`
order, `fill` measuring with a mocked ResizeObserver, `columnDividers` frozen line). Contract suite
scoped to the affected routes. `design.md` and the component docs pages get the new props.

## Release B — new components and additions

### B5. Floating cell editor — `DataGrid` editable mode

From the app's `CellEditorPanel` plus `Lock`. Proposed API: a DataGrid column editor contract
extension, not a standalone component, so a consumer cannot place it without the grid's anchoring:

```ts
interface DataGridProps<T> {
  /**
   * How an editing cell appears. `inline` — the editor replaces the cell's content (today).
   * `floating` — the cell keeps drawing its resting face and the editor opens over it, anchored at
   * the cell's rect, overhanging it by 2px per side, with a min-height equal to the cell and a
   * width by editor type (text-like ≥ 280px, date and file ≥ 340px, pickers ≥ 184px, ≤ 480px). A
   * full-window lock takes presses and wheel (pinch always passes: ctrl+wheel, two-finger touch,
   * panning while visualViewport.scale > 1); a press within 350ms of opening is ignored; the editor
   * follows its cell on window resize.
   * @default "inline"
   */
  editing?: "inline" | "floating";
}
```

Standalone export as well (`FloatingCellEditor`, `anchor: HTMLElement`, children, `onDismiss`),
because the app's file-cell editor is a custom React dialog that needs the same lock outside any
`EditableCell` slot. Open point: widths by _type_ — the grid knows the `EditableCellEditor` type, but
the app's types ("single_choice", "person"…) are `FieldType`. Proposed: width class by
`FieldType` when `FieldCellEditor` is the editor; a `minWidth?: number` override for custom editors.

### B6. `DropdownMenu` additions

- `DropdownMenuSwitchItem` — the whole row is a checkbox item, a decorative `Switch` at the end, an
  optional `hint` line under the label. `checked` / `onCheckedChange`.
- `DropdownMenu` `anchor?: { x: number; y: number }` — opens at a point (the app's `FieldMenuHost`
  uses an invisible fixed trigger to do this). Controlled `open` stays as-is.
- `DropdownMenuInput` (or `inputGuard`) — an input inside a menu keeps typing: keydown stops
  propagating except Escape and Tab; a single-line input passes ArrowUp/ArrowDown through so a
  name input can still move through the menu.

### B7. `OptionListEditor`

Colour (ColorPicker + `HUE_COLORS`), label, remove, add row. `onChange` per keystroke, `onCommit` on
blur, Enter, colour pick or remove. Replaces the app's duplicate in `field-settings.tsx:441`.
`FieldChoiceOption` already exists in `field-cell.tsx`; this reuses it. Placed in its own registry
item so a consumer without choice fields does not pull the colour picker.

### B8. Field-type icon and label map

`FIELD_TYPE_ICONS` / `FIELD_TYPE_LABELS` and `FieldTypeIcon` for the DS-owned `FieldType` union, in
the existing `field-cell` item or `field-type-picker` (already knows the types; check it before
adding a map that duplicates it). Replaces the app's `field-type-icon.tsx` and the shared labels
(the app keeps its own extra types, e.g. "calculated", on top).

## Versioning (needs your answer)

- `@vegastack/ui` is the version every registry item carries (global), and `@vegastack/design` 0.8.53
  is what Regent consumes via npm. These changes are in `@vegastack/ui` registry items, which move
  consumers by `shadcn add --overwrite`, not by `npm update`. So the real question is the version
  of the registry/ui package: A is additive props only (my recommendation: **patch**); B adds new
  exported components (`DropdownMenuSwitchItem`, `OptionListEditor`, `FieldTypeIcon`,
  `FloatingCellEditor`) — **minor**. Or: both minor, since new props are new API.
- Does A also bump `@vegastack/design` (npm) at all? Nothing in A touches `packages/design`. If not,
  Regent's pull PR for A is a registry-only pull and the `@vegastack/design` bump in the handoff is
  not needed.

## Ship sequence (nothing outward happens without a separate "yes proceed" for each step)

1. Branch `feat/table-grid-primitives` (worktree `vegastack-design-wt-table-grid`, from main 3e205244d1).
2. A: build, unit tests, `pnpm registry:build`, changeset, `pnpm gates:ship`, `vrt-review`.
3. STOP. Ask for: push + change PR, then Version PR merge, then Deploy dispatch — each its own yes.
4. Regent: pull PR → adoption PR; then B, same sequence.

## Risks

- `fill` and `bleed` interact with `AppShell`'s scroll container: measured against the app's
  `AppShellContent`, which is `overflow-y-auto`; covered by the app's browser check, not by a DS unit
  test (needs real layout).
- `DataGrid` is 5.3k lines and `headerAlign` touches the sticky header, virtualisation and the
  column menu: scoped contract suite plus `gates:ship` full sweep.
- `FieldCellEditor`'s `variant="cell"` changes Enter/Tab behaviour for text (commit-and-move). The
  default stays as is, so existing consumers are unaffected; anything opting in gets the new keys.

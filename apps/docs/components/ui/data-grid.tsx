// @vegastack data-grid@0.26.4 sha256-HfAGLC0F81ELcSLAlynCcVgIFvlf+0bne9lzFZAD06s=

"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Columns3,
  Inbox,
  Maximize2,
  Plus,
} from "lucide-react";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  alignClass,
  ColumnResizeHandle,
  columnCellClass,
  columnResizeKeyWidth,
  cycleSort,
  EmptyRow,
  GridSummaryCell,
  headerCellClass,
  LIST_ROW_HEIGHT_CLASS,
  LIST_ROW_HEIGHT_PX,
  mergedValueClass,
  offscreenSortSummary,
  PEEK_ACTIVE_ROW_CLASS,
  revealColumns,
  ROW_HOVER_CLASS,
  SELECTED_ROW_CLASS,
  SelectionActionBar,
  SelectionBarSpacer,
  SELECTION_COLUMN_WIDTH,
  SelectAllHead,
  SelectionCell,
  SectionToggle,
  SkeletonRows,
  SortHeaderButton,
  useContainerWidth,
  useControlledState,
  useRowSelection,
  type DataTableColumnLayout,
  type GridSummaryOption,
  type GroupState,
  type RowOpenDetails,
} from "@/components/ui/data-table-parts";
import type { ActionBarProps } from "@/components/ui/action-bar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  CursorPager,
  type CursorPagerProps,
} from "@/components/ui/cursor-pager";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EditableCell,
  EditableCellRest,
  type EditableCellEditor,
  type EditableCellEditorProps,
} from "@/components/ui/editable-cell";
import type { AutoSaveStatus } from "@/components/ui/auto-save-input";
import {
  LoadMore,
  type LoadMoreProps,
  type LoadMoreState,
} from "@/components/ui/load-more";
import {
  FloatingCellEditor,
  type FloatingCellEditorSize,
} from "@/components/ui/floating-cell-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncerScope, useAnnouncer } from "@/components/ui/use-announcer";
import {
  useDragReorder,
  type UseDragReorderReturn,
} from "@/components/ui/use-drag-reorder";
import {
  gridRangeBounds,
  useGridSelection,
  type GridRangeBounds,
} from "@/components/ui/use-grid-selection";
import {
  expandPaste,
  parseClipboard,
  serializeHtmlTable,
  serializeTsv,
  SHEETS_COMPACT_TABLE_TYPE,
  type GridClipboardCell,
  type GridClipboardMatrix,
} from "@/lib/grid-clipboard";
import { TruncationFocusProvider } from "@/components/ui/truncated-text";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ---
`DataGrid` is the commissioned full-parity sibling `DataList`'s docs always promised —
everything the presentational core declares out of scope that is still PRESENTATIONAL:
multi-key sort (client or host-sorted), column visibility + ordering, responsive column
revelation, row grouping (client or host sections), keyboard-continuous load-more, row and
column virtualisation, frozen and resizable columns, a summary row, cursor paging, and the APG
grid keyboard layer with inline cell editing. It still does NOT own data fetching, filter state,
view persistence, or the mutation — G7 holds; `onCellCommit` is a request and `cellStatus` is the
host's word on it; summary values and sorted orders come from the host when it says so.

Engine split (the D1/D2 sanction): TanStack Table computes the SORTED ROW MODEL in
`sortMode="client"` (multi-key, typed comparators) and nothing else — column visibility,
order, widths and frozen offsets are this file's own arithmetic, applied before the engine sees
a column; TanStack Virtual measures the windowed rows and, behind `virtualizeColumns`, the
windowed columns. Neither touches DOM or focus — the APG keyboard layer is this file's own.

Two layouts. The default AUTO layout is DataList's: fill/fit columns and responsive revelation
(merge into the primary cell, or drop and count). The FIXED layout turns on when any column
declares `width`, `frozen` or `resizable`, or the grid takes `onColumnResize` or
`virtualizeColumns`: `table-layout: fixed` sized by a `<colgroup>`, one line per cell
(truncating), horizontal scrolling instead of revelation, frozen columns sticky to the inline
start. Spreadsheet-scale grids (Tables: 150 columns, 50,000 rows) live here.

The structure the G2 benchmark (Regent Tables, 23-10-2026) measured as passing at 150 × 50,000:
- ONE scroll container for both axes (`data-slot="grid-viewport"`), so the sticky header, the
  sticky footer and the frozen columns all resolve against one box. The grid renders its own
  `<table>`: `Table`'s own overflow container would capture `position: sticky`.
- Groups — client `group` columns and host `sections` alike — are FLATTENED into the one row
  list: a group header is a row of its own, each expanded group's rows follow it, and a host
  section that pages its own keyset closes with its own load-more row. The row virtualiser
  windows that list, so grouping and virtualisation combine.
- Memoised rows and cells. A row receives the column window as one memoised object and a tab-stop
  key that is non-null only for the active row, so an arrow key re-renders two rows; a cell
  re-renders only when it enters the window or its own value moves. Class strings are computed
  once per column, not per cell.
- The row virtualiser lives in its own child (`GridBody`), so a vertical range change re-renders
  the body alone; the viewport reaches it as STATE (a callback ref), because a child's layout
  effect runs before a parent's ref attaches.
- The frozen edge's shadow keys off a `data-scrolled-x` attribute the scroll listener sets only
  when it changes — never React state — once a frame, from the offset the column virtualiser
  already read: no scroll handler of the grid's own reads layout.
- Fixed row heights (`rowHeight`) mean exact sizes and no `measureElement`.
- G1.11 (26-10-2026) re-measure: no body cell is positioned unless it holds an absolute child (a
  positioned cell is a paint layer, and ~600 of them made paint and layerize most of a tick), and
  the windows overscan two rows and one column.
- A `custom`-editor cell rests as `EditableCellRest` (one element, no effects) and becomes the full
  `EditableCell` once it edits or the host reports a save status; a header's menu mounts once the
  header is pointed at, focused or opened; the content-tab-order observer looks only at what
  each change added.

Deliberately NOT done here:
- No filter UI (FilterBuilder + the host), no saved views/URL state (host, G7), no CSV export.
- No computing over rows for the summary row: the host supplies every value (`summaryRow`).
- No keyboard column reorder: drag a header, or reorder from the host's field list.
- Range selection, clipboard and fill are the next layer (R3), not this one.
--- */

/* ---
The engine boundary. TanStack Table v9 requires an EXPLICIT feature set (v8
bundled every feature into every table), which makes the sanctioned exception's
promise checkable rather than asserted: the only feature registered here is row
sorting. Column visibility, column order, column sizing and pinning, row selection,
grouping, and the whole APG keyboard layer are absent from this list because they
are computed in this file — v9 ships `columnVisibilityFeature`,
`columnOrderingFeature`, `columnSizingFeature`, `columnPinningFeature` and
`rowSelectionFeature`, and none of them is adopted (widths and frozen offsets are
sums, which the G2 spike measured as fast as the features).

`sortFns` registers the four built-ins v8 kept permanently in its registry.
`column_getAutoSortFn` samples the first ten values and resolves `datetime`,
`alphanumeric` or `text`, falling back to `basic`; registering exactly those four
keeps v8's comparator selection identical while leaving the case-sensitive
variants out of the bundle.

Declared at module scope, as v9 requires, so the feature set is a static
constant rather than a per-render object.
--- */
const gridFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
});
type GridFeatures = typeof gridFeatures;

/**
 * v9 constrains `TData` to `Record<string, any> | Array<any>`, which a consumer's
 * `interface` does not satisfy. `DataGrid<T>` stays unconstrained and the engine
 * is fed this opaque record type instead, so the library's type constraint never
 * reaches the public API.
 */
type EngineRow = Record<string, unknown>;

/**
 * Everything the rest of this file consumes from an engine row. Narrowing it here
 * is what keeps "swapping the engine touches one file" true: no `Row<…>` from the
 * library escapes the `useTable` call below.
 */
interface GridRow<T> {
  /** The stable id produced by `getRowId`. */
  id: string;
  /** The consumer's own row object, handed back untouched. */
  original: T;
}

/** One sort key. Multi-sort holds up to `maxSortKeys` of these, in priority order. */
export interface DataGridSort {
  /** Column key. */
  key: string;
  /** Direction. */
  direction: "asc" | "desc";
}

/** Per-cell context handed to a column `render`. */
export interface DataGridCellContext {
  /** Stable row id from `getRowId`. */
  rowId: string;
  /** Whether the row is selected. */
  selected: boolean;
}

/**
 * A column's editor: an `EditableCellEditor`, whose `custom` editor also receives the row it
 * edits (to read the typed value the cell's string can't carry).
 */
export type DataGridEditor<T> =
  | Exclude<EditableCellEditor, { type: "custom" }>
  | {
      type: "custom";
      render: (
        props: EditableCellEditorProps & {
          /** The row being edited. */
          row: T;
        },
      ) => React.ReactNode;
      /**
       * With the grid's `editing="floating"`: how this editor floats over its cell.
       * @default undefined — `{ size: "cell" }`, the editor saves when focus leaves it
       */
      floating?: {
        /** How wide it is at least (`floatingCellEditorSize` maps a field type to one). */
        size?: FloatingCellEditorSize;
        /**
         * A press outside cancels the edit — for an editor that saves when something is chosen
         * (a picker, a file list). Leave it off for one that saves a typed draft when focus
         * leaves it.
         */
        dismissOnPress?: boolean;
      };
    };

/** A column definition. */
export interface DataGridColumn<T> extends DataTableColumnLayout {
  /** Header label. A string header also names the column for assistive technology. */
  header: React.ReactNode;
  /**
   * An icon before the header label — the field's type glyph (a lucide icon). Decorative: the
   * label names the column.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * Cell content. Rendered as a component ELEMENT (hooks are safe here —
   * unlike `DataList.render`, which is invoked as a plain function).
   * On an `editable` column it is the cell's display while not editing a non-empty value (an
   * empty one shows the editor's placeholder; a pending commit shows its value as text until the
   * new row arrives); without it the cell shows the editor's own display.
   * Cells are memoised on the row object and the column definition, so keep
   * `columns` stable (`useMemo`) and give a changed row a new object.

   * @default undefined
   */
  render?: (row: T, context: DataGridCellContext) => React.ReactNode;
  /**
   * The column's typed value for the row — what client sorting compares and
   * client grouping buckets. Defaults to reading `row[key]`.

   * @default undefined
   */
  accessor?: (row: T) => unknown;
  /**
   * Where the header's content sits, apart from the values: a numeric column's figures and
   * footer stay end-aligned while its header starts at the start, so every header leads the same
   * way — icon, name, sort arrow, menu chevron, in that order from the start.
   * @default undefined — the column's `align`
   */
  headerAlign?: "start" | "center" | "end";
  /**
   * Header click sorts by this column; shift-click adds it as a secondary key.
   * @default false
   */
  sortable?: boolean;
  /**
   * Open this editor on Enter/F2 (or by typing, for `text` and `number`) while
   * the cell has grid focus. Uses `EditableCell` in `focusMode="managed"` —
   * the grid owns reachability, the cell owns the editor and its async status. A `custom`
   * editor's `render` also receives the `row`.

   * @default undefined
   */
  editable?: DataGridEditor<T>;
  /**
   * Group rows into collapsible sections by this column's value (client
   * grouping). One grouping column at most; ignored when the grid has
   * `sections`.
   * @default false
   */
  group?: boolean;
  /**
   * Width in pixels. Declaring it switches the grid to the fixed layout.
   * @default 240 for the primary (first) column, 160 for the others
   */
  width?: number;
  /**
   * AUTO layout: the pixels this column needs before the responsive revelation
   * shows it (columns that no longer fit hide right-to-left; `mobile`
   * overrides). FIXED layout: the narrowest a resize can make the column.
   * @default 120 (auto) · 64 (fixed)
   */
  minWidth?: number;
  /**
   * Show a resize handle on the header's trailing edge. Only meaningful with
   * the grid's `onColumnResize`.
   * @default true when the grid has `onColumnResize`
   */
  resizable?: boolean;
  /**
   * Stick the column to the inline start while the grid scrolls sideways. Only
   * a LEADING run of frozen columns freezes — a frozen column after an
   * unfrozen one scrolls. Switches the grid to the fixed layout.
   * @default false
   */
  frozen?: boolean;
  /**
   * Items for the header's menu (`DropdownMenuItem`s) — opened from the
   * header's chevron, <kbd>Enter</kbd> or <kbd>Shift</kbd>+<kbd>F10</kbd> on the
   * focused header. A header with a menu sorts from the menu, not on Enter.
   * @default undefined
   */
  headerMenu?: React.ReactNode;
  /**
   * The summary functions this column's footer cell offers (`summaryRow`).
   * @default undefined
   */
  summaryOptions?: readonly GridSummaryOption[];
  /**
   * Cells mode: read a pasted cell into this column's value (`CellChange.value`). Without it a
   * pasted cell's text is the value. A column with neither `parse` nor `editable` is read-only
   * to paste, clear and fill.
   * @default undefined
   */
  parse?: (cell: GridClipboardCell, row: T) => unknown;
  /**
   * Cells mode: the text a copy writes for this column's value.
   * @default the value as a string
   */
  format?: (row: T) => string;
}

/** One cell write a cells-mode grid asks the host for (a paste, a clear, a cut). */
export interface CellChange {
  rowId: string;
  key: string;
  /** The new value: what the column's `parse` returned, the pasted text, or `null` to clear. */
  value: unknown;
  /** The value the grid showed before (the column's own value for the row). */
  previous: unknown;
  /** The latest change id the writer expects on the cell (sent by undo and redo). */
  expectChange?: string;
}

/** The host's per-cell outcome for one `CellChange`, in the same order. */
export type CellCommitResult =
  | { status: "ok"; value: unknown; version: number; changeId: string }
  | { status: "conflict"; current: unknown }
  | { status: "invalid"; reason: string }
  | { status: "stale_schema" };

/** A block of cells by id: the rows (top to bottom) and the column keys (left to right). */
export interface DataGridCellBlock {
  rowIds: string[];
  keys: string[];
}

/** A fill request: copy `source` into `target`, or continue its series (Alt-drag). */
export interface DataGridFill {
  source: DataGridCellBlock;
  target: DataGridCellBlock;
  /** Continue a number or date series instead of copying (Alt held). The host computes it. */
  series: boolean;
}

/** The part of a paste that ran past the last loaded row. */
export interface DataGridPasteOverflow {
  /** The rows that did not fit, in the pasted columns. */
  matrix: GridClipboardMatrix;
  /** The column each pasted column lands in. */
  keys: string[];
  /** The last row the paste reached. */
  afterRowId: string;
}

/** A change someone else (or an agent) just made to one cell. */
export interface DataGridRemoteChange {
  /** Who made it — an avatar chip, shown in the cell's corner while the cue fades. */
  by: React.ReactNode;
  /** When it arrived (`Date.now()`); the cue lasts 1.5s from here. */
  at: number;
  /**
   * What a screen reader hears when it lands on the FOCUSED cell — "Asha changed Status to
   * Quoted". Other cells are not announced.
   * @default undefined
   */
  announcement?: string;
}

/** The key `remoteChanges` uses for one cell. */
export function gridCellKey(rowId: string, key: string): string {
  return `${rowId}\u0001${key}`;
}

/**
 * A host-provided group: the server groups rows, the grid renders them as one
 * flattened, virtualisable list — a header row, the group's rows, and, while
 * the group has more, its own load-more row.
 */
export interface DataGridSection {
  /** Stable id — the `groupState` key. */
  id: string;
  /** What the group header shows. */
  label: React.ReactNode;
  /**
   * The group's TOTAL row count (the server's), shown after the label.
   * @default the number of loaded rows
   */
  count?: number;
  /** Ids (`getRowId`) of this group's loaded rows. Rows keep `data`'s order within it. */
  rowIds: readonly string[];
  /**
   * This group's own keyset paging: the next page loads as its last row nears
   * the viewport, exactly like the grid's `loadMore`.
   * @default undefined
   */
  loadMore?: LoadMoreState;
}

/** The summary row: the host's chosen function and computed value per column. */
export interface DataGridSummaryRow {
  /**
   * Leading content — the row count ("412 rows") — in the primary column's footer cell.
   * @default undefined
   */
  label?: React.ReactNode;
  /** The chosen function per column key (`null` or absent: none). */
  value: Readonly<Record<string, string | null | undefined>>;
  /** Called when a column's function changes. */
  onValueChange: (key: string, value: string | null) => void;
  /**
   * The computed result per column key, for the chosen function.
   * @default undefined
   */
  results?: Readonly<Record<string, React.ReactNode>>;
  /**
   * Column keys whose result is still computing (a skeleton shows).
   * @default undefined
   */
  loading?: readonly string[];
}

/** What a control inside the grid spreads to join its roving focus (`headerTrailing`). */
export interface DataGridFocusProps {
  /** `0` while the control holds the grid's one tab stop, else `-1`. */
  tabIndex: number;
  /** Registers the control as the focus target. */
  ref: (node: HTMLElement | null) => void;
  /** Reports the control as the active position. */
  onFocus: () => void;
  /** The control's position in the grid. */
  "data-grid-row": string;
  /** The control's position in the grid. */
  "data-grid-key": string;
}

/** Row height preset; each is an exact height, so the virtualiser never measures. */
export type DataGridRowHeight = "short" | "medium" | "tall";

/**
 * Keyboard-continuous load-more contract for the last row boundary.
 * @deprecated Use `LoadMoreState` from `load-more` — the same shape, shared by
 * DataList, board lanes and `useAsyncSearch`.
 */
export type DataGridLoadMore = LoadMoreState;

/** The `loadMore` prop: the paging state plus the footer's own labels. */
export type DataGridLoadMoreProps = Omit<LoadMoreProps, "className" | "ref">;

/** Props accepted by `DataGrid`. */
export interface DataGridProps<T> {
  /** Column definitions, left to right (base order; see `columnOrder`). Keep it memoised. */
  columns: DataGridColumn<T>[];
  /** Row data — every loaded row (with `sections`, every loaded row of every group). */
  data: T[];
  /** Stable, unique row id — focus, selection and edit identity. */
  getRowId: (row: T) => string;
  /**
   * `client` sorts `data` with the row-model engine. `manual` renders `data`
   * in the order given — the host sorts on the server — and the headers only
   * signal intent through `onSortChange`.
   * @default "client"
   */
  sortMode?: "client" | "manual";
  /**
   * Controlled multi-sort (priority order). Omit for uncontrolled. Passed WITHOUT
   * `onSortChange`, the sort is owned elsewhere (a toolbar's Sort control):
   * headers are not sort buttons, and each sorted column shows a read-only ↑/↓
   * (with its ordinal in a multi-sort) and `aria-sort`.

   * @default undefined
   */
  sort?: DataGridSort[];
  /**
   * Fired with the next sort array on header activation.

   * @default undefined
   */
  onSortChange?: (sort: DataGridSort[]) => void;
  /**
   * Maximum simultaneous sort keys.
   * @default 2
   */
  maxSortKeys?: number;
  /**
   * Controlled column visibility (`key → visible`). Omit for uncontrolled.
   * The built-in picker edits it either way.

   * @default undefined
   */
  columnVisibility?: Record<string, boolean>;
  /**
   * Fired when the picker (or host) changes visibility.

   * @default undefined
   */
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  /**
   * Render the built-in "Columns" picker in the toolbar's trailing slot. Turn it
   * off for a grid whose columns are fixed, or when the host drives visibility
   * from its own settings surface — a three-column read-only grid should not
   * carry a column manager.
   * @default true, or false when `embedded`
   */
  columnPicker?: boolean;
  /**
   * Column order (array of keys), applied left to right. Controlled: the grid
   * applies it, and a header drag only REQUESTS a new one through
   * `onColumnReorder`. Omit to use the declared column order.

   * @default undefined
   */
  columnOrder?: string[];
  /**
   * Turns on header drag-to-reorder (frozen columns stay put) and receives the
   * next full order of column keys. Apply it through `columnOrder`.
   * @default undefined
   */
  onColumnReorder?: (order: string[]) => void;
  /**
   * Turns on column resizing (fixed layout): the header's handle, its
   * keyboard steps (<kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd> on a focused
   * header), and double-click to fit. Called with the final width; the grid
   * shows the new width at once and the host persists it into `column.width`.
   * @default undefined
   */
  onColumnResize?: (key: string, width: number) => void;
  /**
   * Window the columns too (fixed layout): only the columns in view (plus two
   * either side) render, with spacer columns standing in for the rest. Needed
   * past a few dozen columns.
   * @default false
   */
  virtualizeColumns?: boolean;
  /**
   * A trailing header cell after the last column — an "add field" button. A render function:
   * spread the focus props onto the one control it renders, so the control joins the header
   * row's roving focus instead of becoming a second tab stop.
   * @default undefined
   */
  headerTrailing?: (focus: DataGridFocusProps) => React.ReactNode;
  /**
   * Controlled collapsed state per group id. Omit for uncontrolled.

   * @default undefined
   */
  groupState?: GroupState;
  /**
   * Fired when a group toggles.

   * @default undefined
   */
  onGroupStateChange?: (state: GroupState) => void;
  /**
   * Host-provided groups (server-side grouping, each group paging its own
   * keyset), flattened into the one row list. Overrides a `group` column.
   * @default undefined
   */
  sections?: DataGridSection[];
  /**
   * Fixed row height: `short` 32px, `medium` 40px, `tall` 80px (text wraps to
   * three lines). Cells keep to one line otherwise. Omit for content-sized rows.
   * @default undefined
   */
  rowHeight?: DataGridRowHeight;
  /**
   * The summary row: a sticky footer of per-column functions (`summaryOptions`)
   * with the host's computed values. The grid computes nothing over its rows. As cards
   * (`phoneLayout="cards"` on a phone-width grid) it is one read-only line above them: the
   * `label`, then "Column · Function result" for each summarised column, wrapping as it must.
   * @default undefined
   */
  summaryRow?: DataGridSummaryRow;
  /**
   * Items for a body cell's context menu (`ContextMenuItem`s), opened by a right
   * click, a long press, or <kbd>Shift</kbd>+<kbd>F10</kbd> / the menu key on
   * the focused cell. Return `null` for a cell without one.
   * @default undefined
   */
  cellMenu?: (rowId: string, key: string) => React.ReactNode;
  /**
   * Commit an inline cell edit. Return a promise to engage the async layer;
   * rejection reverts and announces (EditableCell's contract).

   * @default undefined
   */
  onCellCommit?: (row: T, key: string, value: string) => void | Promise<void>;
  /**
   * The host's word on a cell write in flight (`AutoSaveStatus`). Omit to let
   * each cell derive status from the `onCellCommit` promise. Keep it memoised.

   * @default undefined
   */
  cellStatus?: (rowId: string, key: string) => AutoSaveStatus;
  /**
   * Render the leading selection column.
   * @default false
   */
  selectable?: boolean;
  /** Controlled selection.
   * @default undefined
   */
  selectedIds?: Set<string>;
  /** Selection change.
   * @default undefined
   */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /**
   * Keyset paging, loaded on scroll: the shared `LoadMore` tail at the end of the grid's scroll
   * viewport requests the next cursor page as it nears the edge, the grid appends skeleton rows
   * while `loading`, and ArrowDown past the last row requests it from the keyboard. A failed page
   * shows its `error` with Try again; `endLabel` is shown once `hasMore` is false (nothing by
   * default).
   * @default undefined
   */
  loadMore?: DataGridLoadMoreProps;
  /**
   * Paged mode, for people who page instead of scroll (a screen-reader
   * setting): row windowing turns off, the host shows one page of rows, and a
   * `CursorPager` (Previous / Next, no page numbers) renders under the grid.
   * Column windowing stays on.
   * @default undefined
   */
  pagedMode?: CursorPagerProps;
  /**
   * Window the rows with TanStack Virtual (needs a fixed-height viewport via
   * `maxHeight`). Grouped rows window too. Off in `pagedMode`.
   * @default false
   */
  virtualize?: boolean;
  /**
   * Scroll-viewport max height as a CSS length — required for `virtualize`,
   * useful alone for a sticky header. Flows to the viewport through
   * `--data-grid-max-height`.

   * @default undefined
   */
  maxHeight?: string;
  /**
   * Fill the room below the grid: the viewport is as tall as the distance from its top edge to the
   * bottom of its nearest vertically scrolling ancestor (less anything the grid draws under it),
   * so its scroll bar rests at the bottom of the window even when the rows are few. It follows
   * the window, the scroller, and anything above the grid that comes, goes or resizes (a banner,
   * a wrapped toolbar). At least 240px. A `maxHeight` of its own wins over it. Pair it with
   * `AppShellBleed` for a grid that reaches the page's edges.
   * @default false
   */
  fill?: boolean;
  /**
   * How an editing cell appears. `inline` — the editor replaces the cell's content. `floating` —
   * the cell keeps drawing its resting display and a `custom` editor opens over it
   * (`FloatingCellEditor`): anchored at the cell, reaching 2px past it, at least as tall as the
   * cell and as wide as the column's `editable.floating.size`, with the page locked behind it (a
   * press outside closes it; pinch-zoom still works). The built-in `text`, `number`, `date` and
   * `select` editors stay inline.
   * @default "inline"
   */
  editing?: "inline" | "floating";
  /**
   * An empty band after the last row (and the load-more row), so the last rows can scroll clear of
   * anything floating at the bottom of the viewport. `true` is 180px; a number sets the pixels.
   * Needs a bounded viewport (`maxHeight` or `fill`).
   * @default false
   */
  endSpacer?: boolean | number;
  /**
   * A 1px line at the end of every column, including the frozen ones — a frozen cell's own border
   * would hide under its sticky background once the grid scrolls, so those draw the line over it
   * — and under the last frozen column's header, the only header with one.
   * @default false
   */
  columnDividers?: boolean;
  /**
   * Fill the cell being edited with the `accent` tint, so an editor floating over it (or an
   * inline one) reads as the cell's own.
   * @default false
   */
  editingTint?: boolean;
  /**
   * `start` — every column's header starts at the start, whatever its `align` (a column's own
   * `headerAlign` still wins). The values and the summary row stay where `align` puts them.
   * @default "column" — each column's `headerAlign`, else its `align`
   */
  headerAlign?: "column" | "start";
  /**
   * The TRUE row count, header (and summary) rows included, when only some rows are loaded
   * (`aria-rowcount`). Omit to count the rendered rows (or `-1` while more load).
   * @default undefined
   */
  ariaRowCount?: number;
  /**
   * The true column count when the host hides some columns from the grid altogether
   * (`aria-colcount`).
   * @default the visible column count (plus the selection column)
   */
  ariaColCount?: number;
  /**
   * Rows that come before the first row of `data` — in `pagedMode`, the rows of earlier pages —
   * so `aria-rowindex` stays true ("row 112 of 50,001").
   * @default 0
   */
  ariaRowIndexOffset?: number;
  /**
   * Show skeleton rows instead of data.
   * @default false
   */
  loading?: boolean;
  /** Content when `data` is empty and not loading.
   * @default undefined
   */
  emptyState?: React.ReactNode;
  /** Host slot above the table.
   * @default undefined
   */
  toolbar?: React.ReactNode;
  /**
   * Host slot below the table — any node, or an `embedded` block's footer as an object
   * (`DataGridBlockFooter`): "+ New row" at the start (hidden while `readOnly`) and "25 of 117"
   * at the end.
   * @default undefined
   */
  footer?: React.ReactNode | DataGridBlockFooter;
  /**
   * Accessible name for the grid.
   * @default "Data grid"
   */
  "aria-label"?: string;
  /** Extra classes for the root.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the root (`data-slot="data-grid"`).

   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
  /**
   * `rows` selects whole rows (the checkbox column). `cells` adds spreadsheet ranges:
   * Shift+arrows, Shift+click and drag extend, <kbd>Shift</kbd>+<kbd>Space</kbd> a row,
   * <kbd>Ctrl</kbd>+<kbd>Space</kbd> a column, <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>A</kbd> all;
   * copy, cut and paste (TSV and HTML), Delete clears, <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>D</kbd>
   * fills down, and undo/redo keys are reported to the host.
   * @default "rows"
   */
  selectionMode?: "rows" | "cells";
  /**
   * Cells mode: write a batch (a paste, a clear, a cut) and answer per cell, in order. `invalid`
   * cells are counted as skipped in the announcement.
   * @default undefined
   */
  onCellsCommit?: (changes: CellChange[]) => Promise<CellCommitResult[]>;
  /**
   * Cells mode: the fill handle (drag down or up) and <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>D</kbd>.
   * The host computes the values.
   * @default undefined
   */
  onFill?: (fill: DataGridFill) => void;
  /**
   * Cells mode: a paste ran past the last loaded row. The host decides ("Add 38 rows?").
   * @default undefined
   */
  onPasteOverflow?: (overflow: DataGridPasteOverflow) => void;
  /**
   * Cells mode: <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>Z</kbd>. The host owns the history.
   * @default undefined
   */
  onUndo?: () => void;
  /**
   * Cells mode: <kbd>⇧⌘Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd>.
   * @default undefined
   */
  onRedo?: () => void;
  /**
   * Cells changed by someone else, keyed by `gridCellKey(rowId, key)`: a brief ring pulse
   * (`motion-flash`, gone under reduced motion) and the author in the cell's corner for 1.5s;
   * only the focused cell is announced. Keep the map stable between changes.
   * @default undefined
   */
  remoteChanges?: ReadonlyMap<string, DataGridRemoteChange>;
  /**
   * Open a row's record — a peek beside the grid. A cell click still only selects it and a
   * double-click (or Enter, F2, typing) on a value edits it; the row opens from an **Open**
   * button (24×24) at the start of its primary cell, shown on row hover and keyboard focus (always
   * on touch), from <kbd>Space</kbd> on any of its cells, or <kbd>Enter</kbd> on its primary cell
   * (the row header; <kbd>F2</kbd> still edits that one). Receives the row's id and its index
   * among the loaded rows in display order.
   * @default undefined
   */
  onRowOpen?: (rowId: string, details: RowOpenDetails) => void;
  /**
   * The row whose record is open beside the grid (a peek): it carries `data-peek-active`, takes
   * the accent wash and scrolls into view when it changes.
   * @default undefined
   */
  activeRowId?: string | null;
  /**
   * A row's name — the Open button's ("Open Alpha") and the selection checkbox's ("Select Alpha")
   * accessible name.
   * @default "row N"
   */
  getRowLabel?: (row: T) => string;
  /**
   * What an empty primary value reads as — in the primary cell and a card's title — muted, so a
   * row with no name is never a blank row. The same word `Board` cards use. "Empty" is whatever
   * renders nothing: a column `render` must return `null` (not an empty `<span>`) for an empty
   * value, and the same rule leaves an empty field out of a phone card.
   * @default "Untitled"
   */
  untitledLabel?: string;
  /**
   * The grid's imperative actions: `focusCell(rowId, key)` moves the active cell (a new row's
   * primary cell, as soon as the row is in `data`), and `getRowOrder()` returns the loaded row ids
   * in display order, as a peek's ↑/↓ walk them.
   * @default undefined
   */
  actionsRef?: React.Ref<DataGridActions>;
  /**
   * The actions for the selected rows (`selectable`): an `ActionBar` docks at the bottom of the
   * screen, centred over the grid, while anything is selected — the count, these actions
   * (compose `ActionBarButton`), and Clear. `clear` empties the selection. The same bar as
   * `DataList`'s.
   * @default undefined
   */
  selectionActions?: (
    selectedIds: ReadonlySet<string>,
    clear: () => void,
  ) => React.ReactNode;
  /**
   * The selection bar's status text.
   * @default (count) => `${count} selected`
   */
  selectionLabel?: (count: number) => string;
  /**
   * Secondary selection actions — buttons on a wide screen, a ⋯ menu on a phone.
   * @default undefined
   */
  selectionSecondaryActions?: ActionBarProps["secondaryActions"];
  /**
   * The selection bar's ⋯ trigger name.
   * @default "More actions"
   */
  selectionMoreLabel?: string;
  /**
   * The selection bar's Clear button, as a screen reader hears it.
   * @default "Clear selection"
   */
  clearSelectionLabel?: string;
  /**
   * The selection bar's accessible name.
   * @default "Selection actions"
   */
  selectionBarLabel?: string;
  /**
   * How many skeleton rows `loading` shows — pass the rows the page will hold (its count, capped
   * at a screenful) so the loaded grid lands without a shift.
   * @default 5
   */
  loadingRows?: number;
  /**
   * What the grid does on a phone-width container (under 40rem): `scroll` keeps the grid and
   * scrolls it sideways; `cards` shows each row as a card — its primary value as the title (it
   * opens the row, with `onRowOpen`) and the next `cardFields` columns as labelled values. The
   * grid decides by its own width, so a narrow pane gets cards too and a tablet keeps the grid.
   * @default "scroll"
   */
  phoneLayout?: "scroll" | "cards";
  /**
   * `phoneLayout="cards"`: how many columns after the primary each card shows.
   * @default 3
   */
  cardFields?: number;
  /**
   * A table block inside a page or document (a live table view): the grid is framed as one block
   * — `toolbar` (a `BlockHeader`) on top, the rows, then `footer` — and its height comes from its
   * rows, at most `maxRows` of them, so it never scrolls inside itself; it scrolls sideways when
   * its columns overflow, with no cap on how many show (the fixed layout). The column picker is
   * off unless `columnPicker` asks for it, and `virtualize`/`maxHeight` do not apply. Rows open
   * the same way as anywhere else (`onRowOpen`).
   * @default false
   */
  embedded?: boolean;
  /**
   * The most rows the grid shows, the first ones in display order — an `embedded` block's cap.
   * Tell the reader how many there are with `footer`'s `shown` and `total`.
   * @default 25 when `embedded`, otherwise no cap
   */
  maxRows?: number;
  /**
   * Nothing in the grid edits: no cell editors, paste, clear, cut or fill, no undo keys, no
   * `headerTrailing` ("add field") column and no "+ New row" in a block footer. Rows still open,
   * sort and select. For people who can see a table but not change it.
   * @default false
   */
  readOnly?: boolean;
}

/** An `embedded` grid's footer, passed as `footer`. */
export interface DataGridBlockFooter {
  /**
   * Add a row — shows "+ New row" at the footer's start (not while `readOnly`).
   * @default undefined
   */
  onNewRow?: () => void;
  /**
   * The new-row button's label.
   * @default "New row"
   */
  newRowLabel?: string;
  /**
   * How many rows the block shows.
   * @default undefined
   */
  shown?: number;
  /**
   * How many rows there are in all. When it is more than `shown`, the footer's end says so.
   * @default undefined
   */
  total?: number;
  /**
   * The count text, from `shown` and `total`.
   * @default (shown, total) => `${shown} of ${total}`
   */
  countLabel?: (shown: number, total: number) => string;
}

/** What `actionsRef` exposes. */
export interface DataGridActions {
  /**
   * Make the cell at `rowId` × `key` the active cell and focus it — scrolled into view, and
   * waited for briefly when its row has just been added and is still mounting.
   */
  focusCell: (rowId: string, key: string) => void;
  /** The loaded row ids in display order (sorted, grouped, collapsed groups left out). */
  getRowOrder: () => string[];
}

/** The container width under which `phoneLayout="cards"` shows cards (40rem, the phone tier). */
const PHONE_TIER_PX = 640;

const EMPTY_KEYS: readonly string[] = [];

// Stable empty defaults. The uncontrolled initial value must be referentially
// stable across renders: the sorted row model memoizes on `[sorting, rows]` by
// identity, so a fresh `[]` per render would re-sort every render and invalidate
// every memo downstream of it.
const EMPTY_SORT: DataGridSort[] = [];
const EMPTY_VISIBILITY: Record<string, boolean> = {};
const EMPTY_GROUPS: GroupState = {};
const EMPTY_ROWS: EngineRow[] = [];

/** Exact row heights, in pixels, and the classes that hold them (`h-8` = 32px). */
const ROW_PX: Record<DataGridRowHeight, number> = {
  short: LIST_ROW_HEIGHT_PX.compact,
  medium: LIST_ROW_HEIGHT_PX.comfortable,
  tall: 80,
};
// `short` and `medium` are the list density scale's two steps (`LIST_ROW_HEIGHT_*`), so a grid
// and a list beside it share one rhythm.
const ROW_CLASS: Record<DataGridRowHeight, string> = {
  short: LIST_ROW_HEIGHT_CLASS.compact,
  medium: LIST_ROW_HEIGHT_CLASS.comfortable,
  tall: "h-20",
};
// The cell's padding plus one line of text add up to the row height, so a fixed row matches the
// virtualiser's sums. One-line cells truncate on the cell itself — no wrapper element, because
// every element a scroll tick inserts pays the page's whole style sheet; `tall` wraps up to
// three lines inside a clamped block.
const CELL_PAD_CLASS: Record<DataGridRowHeight, string> = {
  short: "py-1",
  medium: "py-2",
  tall: "py-2",
};
const TALL_CONTENT_CLASS =
  "max-h-16 min-w-0 line-clamp-3 whitespace-normal wrap-anywhere";
/** `TableHead`'s `h-10`. */
const HEADER_PX = 40;
const DEFAULT_WIDTH = 160;
const PRIMARY_WIDTH = 240;
const FIXED_MIN_WIDTH = 64;
const FIXED_MAX_WIDTH = 960;
const TRAILING_WIDTH = 48;

// Focus coordinates for rows and columns that are not data. Private-use code points, so no real
// row id or column key can collide with them.
const HEADER = "\uE000header";
const FOOTER = "\uE000footer";
const SELECT = "\uE000select";
const GROUP = "\uE000group";
const TRAILING = "\uE000trailing";
const GROUP_PREFIX = "\uE000group:";
const MORE_PREFIX = "\uE000more:";
/** Rows without columns — a group header, a group's load-more — hold one focus target. */
const isLineRow = (rowId: string): boolean =>
  rowId.startsWith(GROUP_PREFIX) || rowId.startsWith(MORE_PREFIX);
const nodeKey = (rowId: string, key: string) => `${rowId}\uE001${key}`;

/** A focus coordinate: a row (or `HEADER`/`FOOTER`/a group row) and a column key. */
interface GridPosition {
  rowId: string;
  key: string;
}

/** One entry of the flattened row list. */
type GridItem<T> =
  | { kind: "row"; id: string; row: GridRow<T> }
  | {
      kind: "group";
      id: string;
      groupId: string;
      label: React.ReactNode;
      count: number;
      expanded: boolean;
    }
  | { kind: "more"; id: string; groupId: string; loadMore: LoadMoreState };

/** A column with everything a cell needs precomputed (one object per column, memoised). */
interface PlacedColumn<T> {
  column: DataGridColumn<T>;
  key: string;
  /** The column's name for assistive technology. */
  label: string;
  /** Fixed layout: the width in pixels. */
  width: number;
  /** Frozen: the sticky inline-start offset in pixels. */
  offset?: number;
  /** The last frozen column (it carries the scroll shadow). */
  edge: boolean;
  /** The primary (first visible) column — its cells are row headers. */
  primary: boolean;
  ariaColIndex: number;
  /** Position among the data columns (cells-mode ranges are in this order). */
  dataIndex: number;
  /** Every body cell's class string, computed once. */
  cellClass: string;
  /** `columnDividers`: the last frozen column's header draws the frozen divider. */
  dividers: boolean;
  /** `editing="floating"`: a `custom` editor floats over the cell. */
  floating: boolean;
}

/** The column window every row renders against — one memoised object. */
interface ColumnWindow<T> {
  fixed: boolean;
  selectable: boolean;
  /** The selection column's sticky offset when the grid has frozen columns. */
  selectOffset?: number;
  frozen: readonly PlacedColumn<T>[];
  /** The windowed slice of the scrolling columns. */
  center: readonly PlacedColumn<T>[];
  padStart: number;
  padEnd: number;
  trailing: boolean;
  /** Rendered `<td>`s per row, spacers included. */
  span: number;
  /** AUTO layout: the columns merged into the primary cell. */
  merged: readonly DataGridColumn<T>[];
  rowHeight?: DataGridRowHeight;
  /** Rows open (`onRowOpen`): the primary cell leads with the Open button. */
  openable: boolean;
  /** What an empty primary value reads as (`untitledLabel`). */
  untitledLabel: string;
}

/** The stable handle rows and cells reach the grid through. */
interface GridApi {
  register: (rowId: string, key: string, node: HTMLElement | null) => void;
  focused: (rowId: string, key: string) => void;
  setEditing: (rowId: string, key: string, open: boolean) => void;
  navigate: (
    rowId: string,
    key: string,
    direction: "next" | "previous",
    via: "tab" | "enter",
  ) => void;
  commit: (rowId: string, key: string, value: string) => void | Promise<void>;
  toggleRow: (rowId: string) => void;
  toggleGroup: (groupId: string, expanded: boolean) => void;
  /** Cells mode: a press on a cell (Shift extends the range). */
  pointerDown: (rowId: string, key: string, extend: boolean) => void;
  /** Cells mode: a drag with the button held entered a cell. */
  pointerOver: (rowId: string, key: string) => void;
  /** Cells mode: a press on the fill handle. */
  fillStart: (event: React.PointerEvent) => void;
  /**
   * A cell's commit removed the widget that held focus (a resting cell waking for a host status):
   * focus returns to the widget at the same place at the end of that commit.
   */
  keepWidgetFocus: (rowId: string, key: string, index: number) => void;
  /** Open a row's record (`onRowOpen`). */
  openRow: (rowId: string, event: React.SyntheticEvent | null) => void;
}

const GridApiContext = React.createContext<GridApi | null>(null);

function useGridApi(): GridApi {
  const api = React.useContext(GridApiContext);
  if (!api) throw new Error("DataGrid parts must render inside DataGrid");
  return api;
}

/** The column's own value for the row (sorting, grouping, the editor's draft). */
function readValue<T>(column: DataGridColumn<T>, row: T): unknown {
  return column.accessor
    ? column.accessor(row)
    : (row as Record<string, unknown>)[column.key];
}

/** A column's resolved alignment (numeric columns are normalised to `end` on the way in). */
function columnAlign<T>(column: DataGridColumn<T>): "start" | "center" | "end" {
  return column.align ?? "start";
}

/** The column's name as a string, for labels and announcements. */
function columnLabel<T>(column: DataGridColumn<T>): string {
  return typeof column.header === "string" ? column.header : column.key;
}

/**
 * A cell rendered as a real component ELEMENT, so column `render`
 * implementations may safely use hooks.
 */
function Cell<T>({
  column,
  row,
  context,
}: {
  column: DataGridColumn<T>;
  row: T;
  context: DataGridCellContext;
}) {
  if (column.render) return <>{column.render(row, context)}</>;
  const value = (row as Record<string, unknown>)[column.key];
  return <>{value == null ? null : String(value)}</>;
}

/*
 * Body rows and cells are plain elements with `Table`'s look, not `TableRow`/`TableCell`: those
 * carry `:has()` and `:last-child` selectors (`has-aria-expanded:`, `[&:has([role=checkbox])]:pe-0`,
 * `[&_tr:last-child]:border-0`), and at 150 columns every row a scroll tick inserts re-matched them
 * — style recalculation was most of the tick.
 */
const ROW_BASE_CLASS = cn("border-b", ROW_HOVER_CLASS);
// No `position` here: a positioned cell is a paint layer of its own, and at 150 columns the ~600
// layered cells made paint and layerize most of a scroll tick. A cell is `relative` only while it
// can hold an absolute child (a remote change's cue, the fill handle); a frozen one is `sticky`.
// The ACTIVE cell (UX-05) is the spreadsheet's selection outline, not a focus ring: a 2px inset
// `info` line (the selection blue the drop seams use) on the cell the grid's one tab stop rests
// on, while the grid holds focus — however it got there, pointer or keyboard (`:focus-visible`
// alone missed every click). Inset, so the viewport's clip never cuts it, and painted as a box
// shadow, so it needs no positioned cell. A range's other cells take the same blue as a tint, a
// hue the neutral hover and selected-row washes never have. (`data-current-cell`, not
// `data-active-cell`: the tokens' `data-active` custom variant would swallow the latter.)
const CELL_BASE_CLASS =
  "p-2 align-middle whitespace-nowrap data-in-range:bg-[color-mix(in_oklab,var(--color-info)_12%,var(--color-background))] data-fill-target:bg-[color-mix(in_oklab,var(--color-info)_6%,var(--color-background))] group-focus-within/grid:data-current-cell:inset-ring-2 group-focus-within/grid:data-current-cell:inset-ring-info";
const HEAD_BASE_CLASS =
  "h-10 px-2 text-start align-middle font-medium whitespace-nowrap text-foreground";

/**
 * Sticky frozen cells are opaque, so scrolled cells never show through; the row's state washes mix
 * in at the row-state ladder's own strengths (hover 30%, selected 50%, open `accent`). The row's
 * `data-selected` is present-or-absent (`""`), so the selected step keys on `data-[selected]`:
 * the tokens' `data-selected` custom variant matches only `="true"`, which is why the pinned
 * column stayed white in a ticked row (Regent POL-13). The open step is doubled in specificity so
 * it outranks selected, as it does on the row itself (an attribute variant beats the row's plain
 * selected wash): a row both open and ticked is open, pinned cells included.
 */
const FROZEN_CELL_CLASS =
  "sticky z-10 bg-background group-hover/row:layer-hover group-data-[selected]/row:layer-selected [[data-peek-active][data-peek-active]>&]:layer-selected";
/** The frozen edge's shadow, shown while the viewport is scrolled sideways (`data-scrolled-x`). */
// A box shadow, not a pseudo-element: body cells clip their overflow (one line, truncated), and a
// cell's own shadow is painted outside its box, where the clip does not reach.
const FROZEN_EDGE_CLASS =
  "in-data-scrolled-x:shadow-[6px_0_8px_-6px_color-mix(in_oklab,var(--color-foreground)_25%,transparent)] rtl:in-data-scrolled-x:shadow-[-6px_0_8px_-6px_color-mix(in_oklab,var(--color-foreground)_25%,transparent)]";

/** `columnDividers`: a column's end line. */
const DIVIDER_CLASS = "border-e border-border";
/**
 * `columnDividers` on a frozen cell (and the last frozen header): a 1px line laid over the sticky
 * background, since the cell's own border would hide under it once the grid scrolls.
 */
const FROZEN_DIVIDER_CLASS =
  "after:absolute after:inset-y-0 after:end-0 after:w-px after:bg-border after:content-['']";
/** `editingTint`: the cell being edited. */
const EDITING_TINT_CLASS = "data-editing:bg-state-selected";
/** `endSpacer={true}`: the band after the last row. */
const END_SPACER_PX = 180;
/** `fill`: the least room a grid is given, however little the window leaves it. */
const FILL_MIN_HEIGHT = 240;
/** `fill`, before the grid is measured (a server render): a viewport that is never zero. */
const FILL_FALLBACK_HEIGHT = "calc(100dvh - 16rem)";

/** The nearest ancestor that scrolls vertically (the page's main region), or `null`. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el; el = el.parentElement)
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
  return null;
}

/**
 * The height, in pixels, a grid's viewport has to fill so its scroll bar rests at the bottom of
 * its scroll region: from the viewport's top edge to the bottom of the nearest scrolling ancestor
 * (the window when none), less what the grid draws under the viewport. Measured inside the scroll
 * region's content, so scrolling the page never changes it; it follows the window, the scroller and
 * whatever sits above the grid. `null` until measured, or when `enabled` is false.
 */
function useFillHeight(
  viewport: HTMLElement | null,
  root: HTMLElement | null,
  enabled: boolean,
): number | null {
  const [height, setHeight] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    if (!viewport || !root || !enabled) return;
    const scroller = scrollParent(viewport);
    const measure = () => {
      const top = viewport.getBoundingClientRect().top;
      const below =
        root.getBoundingClientRect().bottom -
        viewport.getBoundingClientRect().bottom;
      const room = scroller
        ? scroller.clientHeight -
          (top - scroller.getBoundingClientRect().top + scroller.scrollTop)
        : window.innerHeight - (top + window.scrollY);
      setHeight(Math.max(FILL_MIN_HEIGHT, Math.round(room - below)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (scroller) observer.observe(scroller);
    observer.observe(root);
    // What sits above the grid, through the wrappers that draw no box of their own: its column
    // grows or shrinks when a banner comes or goes.
    let anchor: Element = root;
    while (
      anchor.parentElement &&
      getComputedStyle(anchor.parentElement).display === "contents"
    )
      anchor = anchor.parentElement;
    if (anchor.parentElement) observer.observe(anchor.parentElement);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [viewport, root, enabled]);
  return enabled ? height : null;
}

function stickyStyle(
  offset: number | undefined,
): React.CSSProperties | undefined {
  return offset == null ? undefined : { insetInlineStart: offset };
}

interface GridCellProps<T> {
  placed: PlacedColumn<T>;
  row: T;
  rowId: string;
  tabStop: boolean;
  editing: boolean;
  editSeed: string | undefined;
  selected: boolean;
  status: AutoSaveStatus | undefined;
  merged: readonly DataGridColumn<T>[] | undefined;
  rowHeight: DataGridRowHeight | undefined;
  fixed: boolean;
  /** The active sort — read only by the primary cell's merged stack. */
  sort: readonly DataGridSort[];
  /** Cells mode: the grid's selection model is ranges of cells. */
  cellsMode: boolean;
  /** Cells mode: inside the selected range. */
  inRange: boolean;
  /** Cells mode: the range's bottom-right cell, which carries the fill handle. */
  fillHandle: boolean;
  /** Cells mode: inside a fill drag's target. */
  fillTarget: boolean;
  /** A change someone else just made here. */
  remote: DataGridRemoteChange | undefined;
  /** The primary cell of an openable row: the Open button's accessible name. */
  openLabel: string | undefined;
  /** The primary cell: what an empty value reads as (`untitledLabel`). */
  untitledLabel: string | undefined;
}

/** How long a remote change's author chip stays. */
const REMOTE_CUE_MS = 1500;

/**
 * A remote change's cue — the pulse and the author chip — while it is fresh, re-rendering once
 * when it stops being. Its own component, so a cell without a remote change (nearly all of them,
 * mounted by the dozen on every scroll tick) runs no timer effect.
 */
function RemoteCue({ remote }: { remote: DataGridRemoteChange }) {
  const [, expire] = React.useReducer((n: number) => n + 1, 0);
  const left = REMOTE_CUE_MS - (Date.now() - remote.at);
  React.useEffect(() => {
    if (left <= 0) return;
    const timer = window.setTimeout(expire, left);
    return () => window.clearTimeout(timer);
  }, [remote, left > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  if (left <= 0) return null;
  return (
    <>
      {/* The existing highlight-on-change pulse, inset so the cell's clip keeps it whole;
          the base reduced-motion reset removes it. */}
      <span
        key={remote.at}
        aria-hidden
        className="pointer-events-none absolute inset-0.5 rounded-sm motion-flash"
      />
      <span
        aria-hidden
        data-slot="data-grid-remote"
        className="pointer-events-none absolute end-0.5 top-0.5 flex"
      >
        {remote.by}
      </span>
    </>
  );
}

/**
 * The row's Open affordance (IN-04): a 24×24 button at the start of the primary cell, so opening
 * a record never fights selecting or editing a cell. It holds its place at rest (no layout shift)
 * and shows on row hover, on keyboard focus anywhere in the row, on the open row, and always on a
 * coarse pointer. Not a tab stop of its own: the grid roves one stop, and <kbd>Space</kbd> or
 * <kbd>Enter</kbd> on the row header opens the row from the keyboard.
 */
const RowOpenButton = React.memo(function RowOpenButton({
  label,
  onOpen,
}: {
  label: string;
  onOpen: (event: React.MouseEvent) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      tabIndex={-1}
      aria-label={label}
      data-slot="data-grid-row-open"
      // Pressing it neither selects a range nor starts an edit.
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(event);
      }}
      className="me-1 align-middle text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 group-data-peek-active/row:opacity-100 pointer-coarse:opacity-100"
    >
      <Maximize2 />
    </Button>
  );
});

function GridCellImpl<T>({
  placed,
  row,
  rowId,
  tabStop,
  editing,
  editSeed,
  selected,
  status,
  merged,
  rowHeight,
  fixed,
  sort,
  cellsMode,
  inRange,
  fillHandle,
  fillTarget,
  remote,
  openLabel,
  untitledLabel,
}: GridCellProps<T>) {
  const api = useGridApi();
  const { column, key } = placed;
  const cellNode = React.useRef<HTMLElement | null>(null);
  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      cellNode.current = node;
      api.register(rowId, key, node);
    },
    [api, rowId, key],
  );
  const context = React.useMemo(() => ({ rowId, selected }), [rowId, selected]);
  const editable = column.editable;
  // A custom editor gets the row it edits; the other editors pass through unchanged.
  const editor = React.useMemo<EditableCellEditor | undefined>(() => {
    if (!editable || editable.type !== "custom") return editable;
    const render = editable.render;
    return { type: "custom", render: (props) => render({ ...props, row }) };
  }, [editable, row]);
  // Only an editable cell reads its value as a string; a read-only cell's renderer gets the row.
  const persisted = editor ? String(readValue(column, row) ?? "") : "";
  // The column's `render` stays the display (tags, chips, avatars), not the value's text.
  // While a commit is pending the row still holds the old value, so the pending value shows
  // as text until the host's new row arrives.
  const renderValue = column.render
    ? (shown: string) =>
        shown === persisted ? (
          <Cell column={column} row={row} context={context} />
        ) : (
          <span className="min-w-0 truncate">{shown}</span>
        )
    : undefined;
  // Floating editing: the cell keeps its resting display and the `custom` editor opens over it.
  const floating =
    placed.floating && editable?.type === "custom"
      ? (editable.floating ?? {})
      : null;
  const shownEditor: EditableCellEditor | undefined =
    floating && editor?.type === "custom"
      ? {
          type: "custom",
          render: (props) => (
            <FloatingCellEditor
              size={floating.size}
              onDismiss={floating.dismissOnPress ? props.cancel : undefined}
              face={
                <EditableCellRest
                  value={persisted}
                  label={placed.label}
                  emptyText={untitledLabel ?? ""}
                  renderValue={renderValue}
                  onStartEditing={() => {}}
                />
              }
            >
              {editor.render(props)}
            </FloatingCellEditor>
          ),
        }
      : editor;
  // A `custom` editor's cell rests as `EditableCellRest` (no state machine, no effects): the
  // grid mounts dozens per scroll tick. It becomes the full `EditableCell` when it edits or the
  // host reports a save status, and stays one while mounted, so a save in flight keeps its
  // optimistic value and its announcements.
  // Latched by the full cell's own mount (a ref, so the render that mounts it still knows it is
  // waking: a state update here would re-render the cell before it commits).
  const awake = React.useRef(false);
  const full =
    awake.current || editing || (status != null && status !== "idle");
  const waking = full && !awake.current;
  // A resting cell that is replaced while focus is on a widget inside it (a link chip reached
  // with Alt+Enter, when a host status wakes the cell): its ref cleanup runs in the commit, while
  // the widget is still attached, and the grid puts focus back on the same widget after it.
  const restRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node) return;
      return () => {
        const cell = cellNode.current;
        const focused = document.activeElement;
        if (
          !cell ||
          !(focused instanceof HTMLElement) ||
          focused === cell ||
          !node.contains(focused)
        )
          return;
        const index = cellWidgets(cell).indexOf(focused);
        if (index >= 0) api.keepWidgetFocus(rowId, key, index);
      };
    },
    [api, rowId, key],
  );
  const wake = React.useCallback((node: HTMLSpanElement | null) => {
    if (node) awake.current = true;
  }, []);
  const content = !editor ? (
    untitledLabel != null ? (
      // An empty primary value reads as `untitledLabel`, muted — CSS-generated, so a column's own
      // `render` decides what "empty" is: whatever renders nothing.
      <span
        data-slot="data-grid-primary-value"
        data-untitled={untitledLabel}
        className="empty:before:text-muted-foreground empty:before:content-[attr(data-untitled)]"
      >
        <Cell column={column} row={row} context={context} />
      </span>
    ) : (
      <Cell column={column} row={row} context={context} />
    )
  ) : editor.type === "custom" && !full ? (
    <EditableCellRest
      value={persisted}
      label={placed.label}
      // An empty cell is blank, except the primary one, which reads as `untitledLabel`; the
      // editor's placeholder shows only once it edits (UX-11).
      emptyText={untitledLabel ?? ""}
      renderValue={renderValue}
      onStartEditing={() => api.setEditing(rowId, key, true)}
      ref={restRef}
    />
  ) : (
    <EditableCell
      value={persisted}
      label={placed.label}
      editor={shownEditor ?? editor}
      renderValue={renderValue}
      emptyText={untitledLabel ?? ""}
      focusMode="managed"
      editing={editing}
      editSeed={editSeed}
      onEditingChange={(open) => api.setEditing(rowId, key, open)}
      onNavigate={(direction, via) => api.navigate(rowId, key, direction, via)}
      status={status}
      // The cell that just woke was resting, so its status was idle: a move from it is news.
      previousStatus={waking ? "idle" : undefined}
      ref={wake}
      onCommit={(next) => api.commit(rowId, key, next)}
    />
  );
  return (
    <td
      ref={ref}
      role={placed.primary ? "rowheader" : "gridcell"}
      aria-colindex={placed.ariaColIndex}
      // Cells mode writes a `parse` column too (paste, clear, fill).
      aria-readonly={
        column.editable || (cellsMode && column.parse) ? undefined : true
      }
      data-slot="data-grid-cell"
      data-grid-row={rowId}
      data-grid-key={key}
      data-editing={editing ? "" : undefined}
      // The active cell: outlined while the grid holds focus, however it got there (UX-05).
      data-current-cell={tabStop ? "" : undefined}
      tabIndex={tabStop ? 0 : -1}
      aria-selected={cellsMode ? inRange : undefined}
      // The active cell inside a range is outlined, not tinted: the tint is the REST of the range.
      data-in-range={inRange && !tabStop ? "" : undefined}
      data-fill-target={fillTarget ? "" : undefined}
      onFocus={() => api.focused(rowId, key)}
      onPointerDown={
        cellsMode
          ? (event) => {
              if (event.button === 0)
                api.pointerDown(rowId, key, event.shiftKey);
            }
          : undefined
      }
      onPointerEnter={
        cellsMode
          ? (event) => {
              if (event.buttons === 1) api.pointerOver(rowId, key);
            }
          : undefined
      }
      className={
        (fillHandle || remote) && placed.offset == null
          ? `${placed.cellClass} relative`
          : placed.cellClass
      }
      style={stickyStyle(placed.offset)}
    >
      {openLabel != null ? (
        // The Open button and the value share one flex row, the value taking what is left:
        // side by side as inline boxes, a full-width value (an editable cell's display is
        // `max-w-full`) overflowed the cell by the button's width, and the cell's own
        // ellipsis then replaced the whole value — ref and all — with "…".
        <div
          data-slot="data-grid-cell-lead"
          className={cn(
            "flex min-w-0",
            fixed && rowHeight === "tall" ? "items-start" : "items-center",
          )}
        >
          <RowOpenButton
            label={openLabel}
            onOpen={(event) => api.openRow(rowId, event)}
          />
          <div
            data-slot="data-grid-cell-content"
            // Fixed layout clips plain text with its own ellipsis here (the cell's applies to
            // its own lines only); auto layout keeps the cell's wrapping, and an open editor is
            // never clipped (its focus outline sits outside it).
            className={cn(
              "min-w-0 flex-1",
              fixed && rowHeight === "tall"
                ? TALL_CONTENT_CLASS
                : fixed && !editing && "truncate",
            )}
          >
            {content}
          </div>
        </div>
      ) : fixed && rowHeight === "tall" ? (
        <div data-slot="data-grid-cell-content" className={TALL_CONTENT_CLASS}>
          {content}
        </div>
      ) : (
        content
      )}
      {merged && merged.length > 0 ? (
        <span
          data-slot="data-grid-merged"
          className="mt-0.5 flex min-w-0 flex-col gap-0.5 text-xs text-muted-foreground"
        >
          {merged.map((mergedColumn) => (
            // `truncate` used to sit here, and it could not keep the promise: an auto-layout
            // table sizes a column from its min-content width, which an ellipsis does not lower,
            // so a long merged value still widened the primary cell. The shared rule wraps
            // instead (`mergedValueClass`).
            <span
              key={mergedColumn.key}
              data-sorted={
                sort.find((entry) => entry.key === mergedColumn.key)?.direction
              }
              className={mergedValueClass(mergedColumn)}
            >
              {/* A value lifted out of its column loses the header a screen reader would
                  announce with it, so it carries that header as a prefix — as DataList's stack
                  always has. */}
              {typeof mergedColumn.header === "string" ? (
                <span className="sr-only">{mergedColumn.header}: </span>
              ) : null}
              <Cell column={mergedColumn} row={row} context={context} />
            </span>
          ))}
        </span>
      ) : null}
      {remote ? <RemoteCue remote={remote} /> : null}
      {fillHandle ? (
        // Pointer only: ⌘/Ctrl+D is the keyboard path. 8px square, 24px hit area. Under a frozen
        // cell (`sticky z-10`): a cell scrolled beneath a frozen column must not draw its handle
        // over it.
        <span
          aria-hidden
          data-slot="data-grid-fill-handle"
          className="absolute end-0 bottom-0 z-1 size-2 cursor-ns-resize touch-none rounded-[1px] bg-info before:absolute before:-inset-2 before:content-['']"
          onPointerDown={(event) => {
            event.stopPropagation();
            event.preventDefault();
            api.fillStart(event);
          }}
        />
      ) : null}
    </td>
  );
}

const GridCell = React.memo(GridCellImpl) as typeof GridCellImpl;

interface GridRowProps<T> {
  row: T;
  rowId: string;
  /** The row's name ("row 3", or `getRowLabel`'s) — its checkbox and Open button say it. */
  rowLabel: string;
  /** This row's record is open beside the grid (`activeRowId`). */
  peekActive: boolean;
  ariaRowIndex: number;
  w: ColumnWindow<T>;
  /** The tab-stop column key when this row holds the grid's tab stop. */
  tabKey: string | null;
  /** The column being edited in this row. */
  editingKey: string | null;
  editSeed: string | undefined;
  selected: boolean;
  cellStatus: ((rowId: string, key: string) => AutoSaveStatus) | undefined;
  sort: readonly DataGridSort[];
  cellsMode: boolean;
  /** Cells mode: the selected range's data-column span in this row (`-1` when outside it). */
  rangeLeft: number;
  rangeRight: number;
  /** Cells mode: this row is the range's last, so its right-most range cell has the fill handle. */
  fillHandle: boolean;
  /** Cells mode: this row is inside a fill drag's target. */
  fillTarget: boolean;
  remoteChanges: ReadonlyMap<string, DataGridRemoteChange> | undefined;
  measure?: (node: Element | null) => void;
  dataIndex?: number;
}

/**
 * The stand-in for the windowed-out columns on one side. Its width comes from its `<col>` alone,
 * so a window move rewrites two `<col>`s rather than two cells in every row.
 */
const SpacerCell = React.memo(function SpacerCell() {
  return <td aria-hidden="true" data-slot="data-grid-spacer" className="p-0" />;
});

/**
 * The FIXED layout's last track (DS-1): the table is at least as wide as its viewport, and this
 * unsized column takes whatever the real columns leave, so the header band, the row borders and
 * washes, the summary row and the footer reach the viewport's end while every real column keeps
 * its width. It sits after the "+" column, which stays right beside the last real column.
 */
const FillerCell = React.memo(function FillerCell() {
  return <td aria-hidden="true" data-slot="data-grid-filler" className="p-0" />;
});

/**
 * A row's selection checkbox, memoised on its own props: a column-window move re-renders every
 * row, and the checkbox (whose label lookup runs on every render) has nothing to change then.
 */
const GridSelectCell = React.memo(function GridSelectCell({
  rowId,
  rowLabel,
  tabStop,
  selected,
  offset,
  rowHeight,
}: {
  rowId: string;
  rowLabel: string;
  tabStop: boolean;
  selected: boolean;
  offset: number | undefined;
  rowHeight: DataGridRowHeight | undefined;
}) {
  const api = useGridApi();
  const selectRef = React.useCallback(
    (node: HTMLElement | null) => api.register(rowId, SELECT, node),
    [api, rowId],
  );
  return (
    <SelectionCell
      role="gridcell"
      aria-colindex={1}
      data-grid-row={rowId}
      data-grid-key={SELECT}
      controlTabIndex={tabStop ? 0 : -1}
      controlRef={selectRef}
      onFocus={() => api.focused(rowId, SELECT)}
      className={cn(
        offset != null && FROZEN_CELL_CLASS,
        rowHeight && CELL_PAD_CLASS[rowHeight],
      )}
      style={stickyStyle(offset)}
      checked={selected}
      onToggle={() => api.toggleRow(rowId)}
      label={`Select ${rowLabel}`}
    />
  );
});

function GridRowImpl<T>({
  row,
  rowId,
  rowLabel,
  peekActive,
  ariaRowIndex,
  w,
  tabKey,
  editingKey,
  editSeed,
  selected,
  cellStatus,
  sort,
  cellsMode,
  rangeLeft,
  rangeRight,
  fillHandle,
  fillTarget,
  remoteChanges,
  measure,
  dataIndex,
}: GridRowProps<T>) {
  const cell = (placed: PlacedColumn<T>) => (
    <GridCell
      key={placed.key}
      placed={placed}
      row={row}
      rowId={rowId}
      tabStop={tabKey === placed.key}
      editing={editingKey === placed.key}
      editSeed={editingKey === placed.key ? editSeed : undefined}
      selected={selected}
      status={cellStatus?.(rowId, placed.key)}
      merged={placed.primary && !w.fixed ? w.merged : undefined}
      rowHeight={w.rowHeight}
      fixed={w.fixed}
      sort={placed.primary && !w.fixed ? sort : EMPTY_SORT}
      cellsMode={cellsMode}
      inRange={
        !fillTarget &&
        placed.dataIndex >= rangeLeft &&
        placed.dataIndex <= rangeRight
      }
      fillHandle={fillHandle && placed.dataIndex === rangeRight}
      fillTarget={
        fillTarget &&
        placed.dataIndex >= rangeLeft &&
        placed.dataIndex <= rangeRight
      }
      remote={remoteChanges?.get(gridCellKey(rowId, placed.key))}
      openLabel={placed.primary && w.openable ? `Open ${rowLabel}` : undefined}
      untitledLabel={placed.primary ? w.untitledLabel : undefined}
    />
  );
  return (
    <tr
      ref={measure}
      data-index={dataIndex}
      data-slot="data-grid-row"
      data-row-id={rowId}
      data-selected={selected ? "" : undefined}
      data-peek-active={peekActive ? "" : undefined}
      aria-rowindex={ariaRowIndex}
      aria-selected={w.selectable && !cellsMode ? selected : undefined}
      className={cn(
        "group/row",
        ROW_BASE_CLASS,
        w.rowHeight && ROW_CLASS[w.rowHeight],
        // The open row (`activeRowId`) takes the accent wash.
        PEEK_ACTIVE_ROW_CLASS,
        // A selected row keeps one wash through hover and press (SP-06), light enough that a
        // `secondary` Badge in it stays visible — see `SELECTED_ROW_CLASS`.
        selected && SELECTED_ROW_CLASS,
      )}
    >
      {w.selectable ? (
        <GridSelectCell
          rowId={rowId}
          rowLabel={rowLabel}
          tabStop={tabKey === SELECT}
          selected={selected}
          offset={w.selectOffset}
          rowHeight={w.rowHeight}
        />
      ) : null}
      {w.frozen.map(cell)}
      {w.fixed ? <SpacerCell /> : null}
      {w.center.map(cell)}
      {w.fixed ? <SpacerCell /> : null}
      {w.trailing ? <td aria-hidden="true" className="p-0" /> : null}
      {w.fixed ? <FillerCell /> : null}
    </tr>
  );
}

const GridRowView = React.memo(GridRowImpl) as typeof GridRowImpl;

/** A column's resize bounds: its own minimum, and the grid's ceiling. */
function columnResizeBounds<T>(column: DataGridColumn<T>) {
  return {
    min: column.minWidth ?? FIXED_MIN_WIDTH,
    max: Math.max(column.minWidth ?? FIXED_MIN_WIDTH, FIXED_MAX_WIDTH),
  };
}

/**
 * What a header or summary cell does, as one stable object: it reads the grid's latest state
 * through a ref, so the memoised cells below re-render only when their own props move — a
 * column-window move (every horizontal scroll tick) then renders the entering column alone.
 */
interface GridEdgeActions<T> {
  sort: (key: string, additive: boolean) => void;
  setMenuOpen: (key: string, open: boolean) => void;
  resize: (key: string, width: number, commit: boolean) => void;
  autoFit: (placed: PlacedColumn<T>) => void;
  /** A closed summary picker hands focus back to its cell. */
  summaryClosed: (key: string) => void;
}

type DropEdge = ReturnType<
  UseDragReorderReturn["getItemProps"]
>["data-drop-edge"];

interface GridHeadCellProps<T> {
  placed: PlacedColumn<T>;
  fixed: boolean;
  direction: DataGridSort["direction"] | null;
  /** The sort key's position when the grid sorts by more than one. */
  order: number | undefined;
  tabStop: boolean;
  menuOpen: boolean;
  resizable: boolean;
  actions: GridEdgeActions<T>;
  /** Drag-to-reorder: the stable item and handle refs and the drag state, when reorderable. */
  itemRef: ((node: HTMLElement | null) => void) | undefined;
  handleRef: ((node: HTMLElement | null) => void) | undefined;
  dragging: boolean;
  dropEdge: DropEdge;
  dragPending: boolean;
  /** The primary column of an openable grid: the label sits over the values, past the Open slot. */
  openSlot: boolean;
  /**
   * A controlled `sort` with no `onSortChange`: the sort is set elsewhere (a toolbar), so a header
   * shows it read-only — the glyph and `aria-sort`, never a sort button.
   */
  sortLocked: boolean;
}

function GridHeadCellImpl<T>({
  placed: p,
  fixed,
  direction,
  order,
  tabStop,
  menuOpen,
  resizable,
  actions,
  itemRef,
  handleRef,
  dragging,
  dropEdge,
  dragPending,
  openSlot,
  sortLocked,
}: GridHeadCellProps<T>) {
  const api = useGridApi();
  const { column, key } = p;
  const sortable = column.sortable === true && !sortLocked;
  // The header's own alignment: the values' (`align`) unless the column leads its header apart.
  const align = column.headerAlign ?? columnAlign(column);
  const [menuArmed, setMenuArmed] = React.useState(false);
  const menuLive = menuArmed || menuOpen || tabStop;
  // Synchronously, so the real trigger is in place before the press that follows.
  const armMenu =
    column.headerMenu && !menuLive
      ? () => flushSync(() => setMenuArmed(true))
      : undefined;
  const register = React.useCallback(
    (node: HTMLElement | null) => api.register(HEADER, key, node),
    [api, key],
  );
  const ref = React.useMemo(
    () => (itemRef ? mergeRefs(itemRef, register) : register),
    [itemRef, register],
  );
  const icon =
    column.icon != null ? (
      <span
        aria-hidden
        data-slot="data-grid-head-icon"
        className="inline-flex shrink-0 text-muted-foreground [&_svg]:size-3.5"
      >
        {column.icon}
      </span>
    ) : null;
  const text = (
    <span
      data-slot="data-grid-head-label"
      className={cn(fixed && "min-w-0 truncate")}
      title={
        fixed && typeof column.header === "string" ? column.header : undefined
      }
    >
      {column.header}
    </span>
  );
  // A header with a menu is ONE button (UX-12): the whole label opens the menu, which holds the
  // sort. The active sort still shows as a glyph; a chevron fades in on hover and focus.
  const sortGlyph = direction ? (
    <span
      aria-hidden
      data-slot="data-grid-head-sort"
      className="inline-flex shrink-0 items-center gap-0.5 text-foreground"
    >
      {direction === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : (
        <ArrowDown className="size-3.5" />
      )}
      {order != null ? <span className="text-xs">{order}</span> : null}
    </span>
  ) : null;
  const chevron = (
    <ChevronDown
      aria-hidden
      className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/head-menu:opacity-100 group-aria-expanded/head-menu:opacity-100 pointer-coarse:opacity-100"
    />
  );
  // A header with a menu is ONE button (UX-12): the whole label opens the menu, which holds the
  // sort. The active sort still shows as a glyph; a chevron fades in on hover and while open. In
  // an end-aligned column the glyphs lead, so the label's end is the values' end.
  const menuButton = column.headerMenu ? (
    <Button
      variant="ghost"
      size="sm"
      tabIndex={-1}
      data-slot="data-grid-head-menu"
      className={cn(
        "group/head-menu h-7 max-w-full min-w-0 gap-1 px-1.25 text-sm font-medium select-none",
        fixed && "w-full",
        align === "end"
          ? "justify-end"
          : align === "center"
            ? "justify-center"
            : "justify-start",
      )}
    >
      {align === "end" ? (
        <>
          {chevron}
          {sortGlyph}
          {icon}
          {text}
        </>
      ) : (
        <>
          {icon}
          {text}
          {sortGlyph}
          {chevron}
        </>
      )}
    </Button>
  ) : null;
  const label = menuButton ? (
    menuLive ? (
      <DropdownMenu
        open={menuOpen}
        onOpenChange={(open) => actions.setMenuOpen(key, open)}
      >
        <DropdownMenuTrigger render={menuButton} />
        <DropdownMenuContent align={align === "end" ? "end" : "start"}>
          {column.headerMenu}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      // The menu's machinery waits until the header is pointed at, focused or opened: a
      // horizontal scroll tick mounts a header per entering column. No pointer before the press
      // (a scripted click, a switch device): it opens as the menu key does.
      React.cloneElement(menuButton, {
        "aria-haspopup": "menu",
        "aria-expanded": false,
        onClick: () => actions.setMenuOpen(key, true),
      } as React.ComponentProps<typeof Button>)
    )
  ) : sortable ? (
    <SortHeaderButton
      direction={direction}
      order={order}
      onSort={(event) => actions.sort(key, event.shiftKey)}
      align={align}
      label={typeof column.header === "string" ? column.header : undefined}
      tabIndex={-1}
      className={cn(fixed && "min-w-0 max-w-full")}
    >
      {icon}
      {text}
    </SortHeaderButton>
  ) : (
    // Not a sort button, but the column may still be sorted (from a toolbar, `sortLocked`): the
    // glyph shows read-only, leading in an end column so the label's end is the values' end.
    <>
      {align === "end" ? sortGlyph : null}
      {icon}
      {text}
      {align === "end" ? null : sortGlyph}
    </>
  );
  return (
    <th
      data-drag-item={itemRef ? key : undefined}
      data-dragging={dragging ? "" : undefined}
      data-drop-edge={dropEdge}
      data-drag-pending={dragPending ? "" : undefined}
      ref={ref}
      role="columnheader"
      aria-colindex={p.ariaColIndex}
      aria-sort={
        sortable || direction
          ? direction === "asc"
            ? "ascending"
            : direction === "desc"
              ? "descending"
              : "none"
          : undefined
      }
      data-slot="data-grid-head"
      data-sortable={sortable ? "" : undefined}
      data-sorted={direction ?? undefined}
      data-grid-row={HEADER}
      data-grid-key={key}
      tabIndex={tabStop ? 0 : -1}
      onFocus={() => api.focused(HEADER, key)}
      onPointerEnter={armMenu}
      className={cn(
        HEAD_BASE_CLASS,
        fixed
          ? cn(
              alignClass(align),
              "relative",
              (sortable || column.headerMenu) && "group/sort-head px-0.5",
              p.offset != null && "sticky z-30 bg-background",
              p.edge && FROZEN_EDGE_CLASS,
            )
          : cn(
              headerCellClass({ ...column, align }, { fill: p.primary }),
              (sortable || column.headerMenu) && "group/sort-head px-0.5",
            ),
        p.dividers && p.edge && FROZEN_DIVIDER_CLASS,
        "focus-visible:-outline-offset-2",
      )}
      style={stickyStyle(p.offset)}
    >
      <div
        ref={handleRef}
        className={cn(
          "flex min-w-0 items-center gap-1",
          align === "end" && "justify-end",
          align === "center" && "justify-center",
        )}
      >
        {openSlot ? (
          // The width of the rows' Open button and its gap, so the header lines up with the values.
          <span
            aria-hidden
            data-slot="data-grid-head-open-slot"
            className="w-6 shrink-0"
          />
        ) : null}
        {label}
      </div>
      {resizable ? (
        <ColumnResizeHandle
          label={p.label}
          width={p.width}
          {...columnResizeBounds(column)}
          tabIndex={-1}
          onResize={(width) => actions.resize(key, width, false)}
          onResizeEnd={(width) => actions.resize(key, width, true)}
          onAutoFit={() => actions.autoFit(p)}
        />
      ) : null}
    </th>
  );
}

const GridHeadCell = React.memo(GridHeadCellImpl) as typeof GridHeadCellImpl;

interface GridFooterCellProps<T> {
  placed: PlacedColumn<T>;
  tabStop: boolean;
  summaryRow: DataGridSummaryRow | undefined;
  loading: boolean;
  actions: GridEdgeActions<T>;
}

function GridFooterCellImpl<T>({
  placed: p,
  tabStop,
  summaryRow,
  loading,
  actions,
}: GridFooterCellProps<T>) {
  const api = useGridApi();
  const register = React.useCallback(
    (node: HTMLElement | null) => api.register(FOOTER, p.key, node),
    [api, p.key],
  );
  const common = {
    "aria-colindex": p.ariaColIndex,
    "data-grid-row": FOOTER,
    "data-grid-key": p.key,
    onFocus: () => api.focused(FOOTER, p.key),
    style: stickyStyle(p.offset),
    // Every footer cell paints its own background: rows scrolling under the sticky summary
    // row showed through the row group's.
    className: cn(
      "bg-background",
      alignClass(p.column.align),
      p.offset != null && "sticky z-30",
      "focus-visible:-outline-offset-2",
    ),
  };
  if (summaryRow && p.column.summaryOptions)
    return (
      <GridSummaryCell
        {...common}
        ref={register}
        tabIndex={tabStop ? 0 : -1}
        leading={p.primary ? summaryRow.label : undefined}
        onOpenChange={(open) => {
          if (!open) actions.summaryClosed(p.key);
        }}
        columnLabel={p.label}
        options={p.column.summaryOptions}
        value={summaryRow.value[p.key] ?? null}
        onValueChange={(next) => summaryRow.onValueChange(p.key, next)}
        result={summaryRow.results?.[p.key]}
        loading={loading}
        triggerTabIndex={-1}
      />
    );
  return (
    <TableCell
      {...common}
      ref={register}
      tabIndex={tabStop ? 0 : -1}
      className={cn(common.className, "py-1 text-xs text-muted-foreground")}
    >
      {p.primary ? summaryRow?.label : null}
    </TableCell>
  );
}

const GridFooterCell = React.memo(
  GridFooterCellImpl,
) as typeof GridFooterCellImpl;

interface GroupRowProps {
  itemId: string;
  groupId: string;
  label: React.ReactNode;
  count: number;
  expanded: boolean;
  ariaRowIndex: number;
  span: number;
  tabStop: boolean;
  rowHeight: DataGridRowHeight | undefined;
  measure?: (node: Element | null) => void;
  dataIndex?: number;
}

const GroupRowView = React.memo(function GroupRowView({
  itemId,
  groupId,
  label,
  count,
  expanded,
  ariaRowIndex,
  span,
  tabStop,
  rowHeight,
  measure,
  dataIndex,
}: GroupRowProps) {
  const api = useGridApi();
  const ref = React.useCallback(
    (node: HTMLElement | null) => api.register(itemId, GROUP, node),
    [api, itemId],
  );
  return (
    <tr
      ref={measure}
      data-index={dataIndex}
      data-slot="data-grid-group-row"
      data-group={groupId}
      data-collapsed={expanded ? undefined : ""}
      aria-rowindex={ariaRowIndex}
      className={cn("border-b bg-muted", rowHeight && ROW_CLASS[rowHeight])}
    >
      <td
        colSpan={span}
        className="px-2 py-1 align-middle"
        data-grid-row={itemId}
        data-grid-key={GROUP}
        onFocus={() => api.focused(itemId, GROUP)}
      >
        {/* Sticky inside the full-width cell, so the toggle stays in view while the grid
            scrolls sideways. */}
        <div className="sticky start-2 w-fit max-w-full">
          <SectionToggle
            ref={ref}
            tabIndex={tabStop ? 0 : -1}
            label={label}
            count={count}
            expanded={expanded}
            onExpandedChange={(next) => api.toggleGroup(groupId, next)}
          />
        </div>
      </td>
    </tr>
  );
});

function GroupMoreRow({
  itemId,
  loadMore,
  span,
  ariaRowIndex,
  rowHeight,
  tabStop,
  measure,
  dataIndex,
}: {
  itemId: string;
  loadMore: LoadMoreState;
  tabStop: boolean;
  span: number;
  ariaRowIndex: number;
  rowHeight: DataGridRowHeight | undefined;
  measure?: (node: Element | null) => void;
  dataIndex?: number;
}) {
  const api = useGridApi();
  const failed = loadMore.error != null && loadMore.error !== false;
  const cell = React.useRef<HTMLElement | null>(null);
  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      cell.current = node;
      api.register(itemId, GROUP, node);
    },
    [api, itemId],
  );
  // A failed page's Try again is reached through this cell (Enter or Space), so the grid stays
  // one tab stop: the button inside leaves the tab order — re-applied every render, because the
  // tail re-creates its button after each failed retry.
  React.useLayoutEffect(() => {
    cell.current
      ?.querySelectorAll<HTMLElement>("button")
      .forEach((button) => button.setAttribute("tabindex", "-1"));
  });
  return (
    <tr
      ref={measure}
      data-index={dataIndex}
      data-slot="data-grid-group-more"
      aria-rowindex={ariaRowIndex}
      className={cn("border-b", rowHeight && ROW_CLASS[rowHeight])}
    >
      <td
        ref={failed ? ref : undefined}
        colSpan={span}
        className="p-0 align-middle focus-visible:-outline-offset-2"
        data-grid-row={itemId}
        data-grid-key={GROUP}
        tabIndex={failed ? (tabStop ? 0 : -1) : undefined}
        onFocus={failed ? () => api.focused(itemId, GROUP) : undefined}
      >
        <div className="sticky start-0 w-fit max-w-full">
          <LoadMore {...loadMore} />
        </div>
      </td>
    </tr>
  );
}

/** Placeholder rows that follow the fixed layout's column window exactly. */
function FixedSkeletonRows<T>({
  w,
  rows,
}: {
  w: ColumnWindow<T>;
  rows: number;
}) {
  const bar = (placed: PlacedColumn<T>) => (
    <td
      key={placed.key}
      className={placed.cellClass}
      style={stickyStyle(placed.offset)}
    >
      <Skeleton
        className={cn(
          "h-4 w-3/4",
          placed.column.align === "end"
            ? "ms-auto"
            : placed.column.align === "center" && "mx-auto",
        )}
      />
    </td>
  );
  return (
    <>
      {Array.from({ length: rows }, (_, index) => (
        <tr
          key={`skeleton-${index}`}
          data-slot="data-grid-skeleton-row"
          aria-hidden="true"
          className={cn("border-b", w.rowHeight && ROW_CLASS[w.rowHeight])}
        >
          {w.selectable ? (
            <td
              className={cn(
                CELL_BASE_CLASS,
                "w-0",
                w.selectOffset != null && FROZEN_CELL_CLASS,
              )}
              style={stickyStyle(w.selectOffset)}
            >
              <Skeleton className="size-3.5 rounded-sm" />
            </td>
          ) : null}
          {w.frozen.map(bar)}
          <SpacerCell />
          {w.center.map(bar)}
          <SpacerCell />
          {w.trailing ? <td aria-hidden="true" className="p-0" /> : null}
          <FillerCell />
        </tr>
      ))}
    </>
  );
}

interface GridBodyProps<T> {
  viewport: HTMLDivElement | null;
  items: readonly GridItem<T>[];
  w: ColumnWindow<T>;
  virtualize: boolean;
  headerPx: number;
  /** The sticky summary row's height, kept clear when a row scrolls in from below. */
  footerPx: number;
  tabStop: GridPosition | null;
  editing: (GridPosition & { seed?: string }) | null;
  selected: ReadonlySet<string>;
  cellStatus: GridRowProps<T>["cellStatus"];
  sort: readonly DataGridSort[];
  /** "Select row N": each row's 1-based number among the data rows. */
  rowNumbers: ReadonlyMap<string, number>;
  cellsMode: boolean;
  /** Cells mode: the selected range. */
  range: GridRangeBounds | null;
  /** Cells mode: the rows a fill drag targets (indexes among the data rows), or `null`. */
  fill: { top: number; bottom: number } | null;
  remoteChanges: ReadonlyMap<string, DataGridRemoteChange> | undefined;
  /** Cells mode with `onFill`: the range shows its fill handle. */
  fillEnabled: boolean;
  ariaRowIndexBase: number;
  onVirtualizer: (
    virtualizer: Virtualizer<HTMLDivElement, Element> | null,
  ) => void;
  /** Called after every body commit with whether `items` changed in it. */
  onCommit: (itemsChanged: boolean) => void;
  /** The open row (`activeRowId`). */
  activeRowId: string | null | undefined;
  /** A row's name, when the host gives one (`getRowLabel`). */
  getRowLabel: ((row: T) => string) | undefined;
}

/**
 * The body: every flattened item, or — with `virtualize` — the window of them. Its own
 * component, so a vertical range change re-renders it alone (G2).
 */
function GridBody<T>({
  viewport,
  items,
  w,
  virtualize,
  headerPx,
  footerPx,
  tabStop,
  editing,
  selected,
  cellStatus,
  sort,
  rowNumbers,
  cellsMode,
  range,
  fill,
  remoteChanges,
  fillEnabled,
  ariaRowIndexBase,
  onVirtualizer,
  onCommit,
  activeRowId,
  getRowLabel,
}: GridBodyProps<T>) {
  const rowPx = w.rowHeight ? ROW_PX[w.rowHeight] : undefined;
  const rowVirtualizer = useVirtualizer({
    count: virtualize ? items.length : 0,
    getScrollElement: () => viewport,
    estimateSize: () => rowPx ?? 40,
    getItemKey: (index) => items[index]?.id ?? index,
    // The header sits above the first row inside the same scroll box.
    scrollMargin: headerPx,
    // A row scrolled into view lands clear of the sticky header and summary row.
    scrollPaddingStart: headerPx,
    scrollPaddingEnd: footerPx,
    // Two rows (about 66px) each side: every overscanned row is cells a scroll tick mounts, styles
    // and lays out, and the window is re-rendered in the scroll event itself.
    overscan: 2,
  });
  const committedItems = React.useRef(items);
  React.useLayoutEffect(() => {
    onVirtualizer(virtualize ? rowVirtualizer : null);
    const itemsChanged = committedItems.current !== items;
    committedItems.current = items;
    onCommit(itemsChanged);
  });
  React.useEffect(() => () => onVirtualizer(null), [onVirtualizer]);

  const virtualItems = virtualize ? rowVirtualizer.getVirtualItems() : null;
  const entries = virtualItems
    ? virtualItems.map((virtual) => ({
        item: items[virtual.index]!,
        index: virtual.index,
      }))
    : items.map((item, index) => ({ item, index }));
  // Content-sized rows are measured; fixed rows never are (their size is exact).
  const measure =
    virtualize && rowPx == null ? rowVirtualizer.measureElement : undefined;

  // Exactly one tab stop: the active row when it is rendered, else the first rendered row, so
  // Tab always lands inside the window.
  let tabRow = tabStop?.rowId ?? null;
  if (
    tabRow != null &&
    virtualItems &&
    !entries.some((entry) => entry.item.id === tabRow)
  )
    tabRow =
      entries.find((entry) => entry.item.kind !== "more")?.item.id ?? null;

  const top =
    virtualItems && virtualItems.length > 0
      ? virtualItems[0]!.start - headerPx
      : 0;
  const bottom =
    virtualItems && virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - (virtualItems.at(-1)!.end - headerPx)
      : 0;

  return (
    <tbody data-slot="data-grid-body" className="[&>tr:last-child]:border-0">
      {top > 0 ? (
        <tr aria-hidden="true" data-slot="data-grid-virtual-pad">
          <td colSpan={w.span} className="p-0" style={{ height: top }} />
        </tr>
      ) : null}
      {entries.map(({ item, index }) => {
        const ariaRowIndex = ariaRowIndexBase + index;
        const dataIndex = virtualize ? index : undefined;
        if (item.kind === "group")
          return (
            <GroupRowView
              key={item.id}
              itemId={item.id}
              groupId={item.groupId}
              label={item.label}
              count={item.count}
              expanded={item.expanded}
              ariaRowIndex={ariaRowIndex}
              span={w.span}
              tabStop={tabRow === item.id}
              rowHeight={w.rowHeight}
              measure={measure}
              dataIndex={dataIndex}
            />
          );
        if (item.kind === "more")
          return (
            <GroupMoreRow
              key={item.id}
              itemId={item.id}
              tabStop={tabRow === item.id}
              loadMore={item.loadMore}
              span={w.span}
              ariaRowIndex={ariaRowIndex}
              rowHeight={w.rowHeight}
              // Its height is the tail's (a skeleton, or an error with Try again), so it is the
              // one item a fixed-height list still measures.
              measure={virtualize ? rowVirtualizer.measureElement : undefined}
              dataIndex={dataIndex}
            />
          );
        const isTabRow = tabRow === item.id;
        const rowIndex = (rowNumbers.get(item.id) ?? 0) - 1;
        const inRange =
          range != null && rowIndex >= range.top && rowIndex <= range.bottom;
        const inFill =
          range != null &&
          fill != null &&
          rowIndex >= fill.top &&
          rowIndex <= fill.bottom;
        return (
          <GridRowView
            key={item.id}
            row={item.row.original}
            rowId={item.id}
            rowLabel={
              getRowLabel?.(item.row.original) ??
              `row ${rowNumbers.get(item.id) ?? index + 1}`
            }
            peekActive={activeRowId === item.id}
            ariaRowIndex={ariaRowIndex}
            w={w}
            tabKey={isTabRow && tabStop ? tabStop.key : null}
            editingKey={editing?.rowId === item.id ? editing.key : null}
            editSeed={editing?.rowId === item.id ? editing.seed : undefined}
            selected={selected.has(item.id)}
            cellStatus={cellStatus}
            sort={sort}
            cellsMode={cellsMode}
            rangeLeft={inRange || inFill ? range!.left : -1}
            rangeRight={inRange || inFill ? range!.right : -2}
            fillHandle={
              fillEnabled &&
              inRange &&
              rowIndex === range!.bottom &&
              fill == null &&
              // No handle while a cell is being edited: the editor owns the cell.
              editing == null
            }
            fillTarget={inFill}
            remoteChanges={remoteChanges}
            measure={measure}
            dataIndex={dataIndex}
          />
        );
      })}
      {bottom > 0 ? (
        <tr aria-hidden="true" data-slot="data-grid-virtual-pad">
          <td colSpan={w.span} className="p-0" style={{ height: bottom }} />
        </tr>
      ) : null}
    </tbody>
  );
}

/**
 * `phoneLayout="cards"` on a phone-width container (RS-03): each row a card — its primary value
 * as the title and the next columns as labelled values — in the grid's own row order, groups and
 * paging. A card is one surface: an Open button stretched beneath its content opens the row (the
 * content's own links and the checkbox stay clickable above it). Cells don't edit here; the record
 * the card opens does.
 */
/**
 * The summary row as one read-only line above the cards (`phoneLayout="cards"`): the count, then
 * "Column · Function result" for each summarised column — the footer's own values, read only.
 */
function GridCardsSummary<T>({
  summaryRow,
  columns,
}: {
  summaryRow: DataGridSummaryRow;
  columns: readonly DataGridColumn<T>[];
}) {
  const loading = new Set(summaryRow.loading ?? []);
  const parts = columns.flatMap((column) => {
    const chosen = summaryRow.value[column.key];
    // `null`/absent is "none"; any other id — "" included — is a function, as in the footer.
    const option =
      chosen == null
        ? undefined
        : column.summaryOptions?.find((o) => o.value === chosen);
    return option ? [{ column, option }] : [];
  });
  if (summaryRow.label == null && parts.length === 0) return null;
  return (
    <div
      data-slot="data-grid-cards-summary"
      className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
    >
      {summaryRow.label != null ? (
        <span data-slot="data-grid-cards-summary-label">
          {summaryRow.label}
        </span>
      ) : null}
      {parts.map(({ column, option }) => (
        <span
          key={column.key}
          data-slot="data-grid-cards-summary-item"
          className="inline-flex min-w-0 items-center gap-1"
        >
          <span className="truncate">{columnLabel(column)}</span>
          <span aria-hidden="true">·</span>
          <span>{option.label}</span>
          {loading.has(column.key) ? (
            <Skeleton className="h-3 w-8" />
          ) : (
            <span className="font-medium text-foreground tabular-nums">
              {summaryRow.results?.[column.key] ?? "—"}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function GridCards<T>({
  items,
  columns,
  fields,
  selectable,
  selected,
  onToggleRow,
  onToggleGroup,
  onOpen,
  activeRowId,
  getRowLabel,
  rowNumbers,
  loading,
  loadingRows,
  emptyState,
  ariaLabel,
  untitledLabel,
}: {
  items: readonly GridItem<T>[];
  columns: readonly DataGridColumn<T>[];
  fields: number;
  selectable: boolean;
  selected: ReadonlySet<string>;
  onToggleRow: (rowId: string) => void;
  onToggleGroup: (groupId: string, expanded: boolean) => void;
  onOpen: ((rowId: string, event: React.SyntheticEvent) => void) | undefined;
  activeRowId: string | null | undefined;
  getRowLabel: ((row: T) => string) | undefined;
  rowNumbers: ReadonlyMap<string, number>;
  loading: boolean;
  loadingRows: number;
  emptyState: React.ReactNode;
  ariaLabel: string;
  untitledLabel: string;
}) {
  const primary = columns[0];
  const shown = columns.slice(1, 1 + Math.max(0, fields));
  if (loading)
    return (
      <div
        data-slot="data-grid-cards"
        aria-busy="true"
        className="flex flex-col gap-2"
      >
        {Array.from({ length: Math.min(loadingRows, 6) }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            data-slot="data-grid-card-skeleton"
            className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
          >
            <Skeleton className="h-4 w-2/3" />
            {shown.map((column) => (
              <Skeleton key={column.key} className="h-3 w-1/2" />
            ))}
          </div>
        ))}
      </div>
    );
  if (items.length === 0)
    return (
      <div data-slot="data-grid-cards">
        {emptyState ?? (
          <Empty icon={<Inbox aria-hidden />}>
            <EmptyHeader>
              <EmptyTitle>Nothing here</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    );
  return (
    <ul
      data-slot="data-grid-cards"
      aria-label={ariaLabel}
      className="flex flex-col gap-2"
    >
      {items.map((item) => {
        if (item.kind === "group")
          return (
            <li
              key={item.id}
              data-slot="data-grid-card-group"
              className="px-2 pt-2"
            >
              <SectionToggle
                label={item.label}
                count={item.count}
                expanded={item.expanded}
                onExpandedChange={(next) => onToggleGroup(item.groupId, next)}
              />
            </li>
          );
        if (item.kind === "more")
          return (
            <li key={item.id} data-slot="data-grid-card-more">
              <LoadMore {...item.loadMore} />
            </li>
          );
        const row = item.row.original;
        const id = item.id;
        const label = getRowLabel?.(row) ?? `row ${rowNumbers.get(id) ?? 0}`;
        const context = { rowId: id, selected: selected.has(id) };
        return (
          <li
            key={id}
            data-slot="data-grid-card"
            data-row-id={id}
            data-selected={selected.has(id) ? "" : undefined}
            data-peek-active={activeRowId === id ? "" : undefined}
            className="relative flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm text-card-foreground data-[selected]:layer-selected data-peek-active:layer-selected"
          >
            {onOpen ? (
              <Button
                variant="ghost"
                data-slot="data-grid-card-open"
                aria-label={`Open ${label}`}
                onClick={(event) => onOpen(id, event)}
                className="absolute inset-0 h-auto rounded-[inherit] p-0"
              />
            ) : null}
            <div className="pointer-events-none relative flex min-w-0 items-start gap-2 [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_[role=checkbox]]:pointer-events-auto">
              {selectable ? (
                <Checkbox
                  checked={selected.has(id)}
                  onCheckedChange={() => onToggleRow(id)}
                  aria-label={`Select ${label}`}
                  className="mt-0.5"
                />
              ) : null}
              <div
                data-slot="data-grid-card-title"
                // An empty primary value reads as `untitledLabel`, muted, as the grid's cell does.
                data-untitled={untitledLabel}
                className="min-w-0 flex-1 font-medium wrap-anywhere empty:before:font-normal empty:before:text-muted-foreground empty:before:content-[attr(data-untitled)]"
              >
                {primary ? (
                  <Cell column={primary} row={row} context={context} />
                ) : null}
              </div>
            </div>
            {shown.length > 0 ? (
              <dl
                data-slot="data-grid-card-fields"
                // A field with no value is left out — label and all — and a card whose fields are
                // all empty shows none, so a card never lists bare labels ("Notes", "Status").
                className="pointer-events-none relative grid min-w-0 grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs [&:not(:has(dd:not(:empty)))]:hidden [&_a]:pointer-events-auto [&_button]:pointer-events-auto"
              >
                {shown.map((column) => (
                  <React.Fragment key={column.key}>
                    <dt className="truncate text-muted-foreground [&:has(+dd:empty)]:hidden">
                      {columnLabel(column)}
                    </dt>
                    <dd className="min-w-0 truncate empty:hidden">
                      <Cell column={column} row={row} context={context} />
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** A printable key that should open the editor with itself as the draft (type-to-edit). */
function isTypingKey(event: React.KeyboardEvent): boolean {
  return (
    event.key.length === 1 &&
    event.key !== " " &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  );
}

/**
 * The tab stops a body cell's CONTENT renders (a link chip's `<a>`, a person chip, a checkbox): in
 * a grid only the active cell is tabbable, so each leaves the tab order and is reached from its
 * cell instead (Enter on a read-only cell, then arrows; Escape returns). A cell being edited keeps
 * its editor's stops.
 */
const CELL_CONTENT_STOPS =
  '[data-slot="data-grid-cell"]:not([data-editing]) :is(a[href], button, input, select, textarea, summary, [contenteditable="true"], [tabindex]):not([tabindex="-1"])';

/**
 * The widgets inside a body cell, in order, that the cell's keyboard model steps through: the
 * innermost ones (a chip, not the editable value around it), never the cell's own edit surface.
 */
function cellWidgets(cell: HTMLElement): HTMLElement[] {
  const candidates = [
    ...cell.querySelectorAll<HTMLElement>(
      'a[href], button, input:not([type="hidden"]), select, textarea, summary, [contenteditable="true"], [tabindex]',
    ),
  ].filter(
    (node) =>
      !node.matches(':disabled, [data-slot="editable-cell-display"]') &&
      !node.closest('[aria-hidden="true"]') &&
      node.getClientRects().length > 0,
  );
  return candidates.filter(
    (node) =>
      !candidates.some((other) => other !== node && node.contains(other)),
  );
}

/** Take every cell's content stops out of the tab order, now and whenever the body changes. */
function useCellContentOutOfTabOrder(table: HTMLTableElement | null) {
  React.useEffect(() => {
    if (!table) return;
    const apply = (root: Element) => {
      if (root.matches(CELL_CONTENT_STOPS)) (root as HTMLElement).tabIndex = -1;
      for (const node of root.querySelectorAll<HTMLElement>(CELL_CONTENT_STOPS))
        node.tabIndex = -1;
    };
    apply(table);
    // Rows page and virtualise in and out, and chips resolve after they mount: re-apply to what
    // each change added or touched (a scroll tick adds a column or a few rows; the whole table is
    // not searched again). Setting `tabindex` re-triggers once and then finds nothing to do.
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes") {
          if (record.target instanceof Element) apply(record.target);
          continue;
        }
        for (const node of record.addedNodes)
          if (node instanceof Element) apply(node);
      }
    });
    observer.observe(table, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["tabindex", "href", "contenteditable", "data-editing"],
    });
    return () => observer.disconnect();
  }, [table]);
}

/** Whether `footer` is an embedded block's footer object rather than a node. */
function isBlockFooter(
  footer: React.ReactNode | DataGridBlockFooter,
): footer is DataGridBlockFooter {
  return (
    footer != null &&
    typeof footer === "object" &&
    !React.isValidElement(footer) &&
    // React's own objects (an element, a portal) carry `$$typeof`; a block footer never does.
    !("$$typeof" in footer) &&
    !Array.isArray(footer) &&
    !(Symbol.iterator in footer) &&
    !("then" in footer)
  );
}

const defaultBlockCount = (shown: number, total: number) =>
  `${shown} of ${total}`;

/** An embedded block's footer: "+ New row" at the start, "25 of 117" at the end. */
function GridBlockFooter({
  footer,
  readOnly,
}: {
  footer: DataGridBlockFooter;
  readOnly: boolean;
}) {
  const {
    onNewRow,
    newRowLabel = "New row",
    shown,
    total,
    countLabel = defaultBlockCount,
  } = footer;
  const canAdd = onNewRow != null && !readOnly;
  const counted = shown != null && total != null && total > shown;
  if (!canAdd && !counted) return null;
  return (
    <div
      data-slot="data-grid-footer"
      className="flex min-h-10 min-w-0 items-center gap-2 border-t border-border px-1.5 py-1"
    >
      {canAdd ? (
        <Button
          variant="ghost"
          size="sm"
          data-slot="data-grid-new-row"
          className="text-muted-foreground"
          onClick={onNewRow}
        >
          <Plus aria-hidden />
          {newRowLabel}
        </Button>
      ) : null}
      {counted ? (
        <span
          data-slot="data-grid-row-count"
          className="ms-auto pe-1.5 text-xs text-muted-foreground tabular-nums"
        >
          {countLabel(shown, total)}
        </span>
      ) : null}
    </div>
  );
}

/**
 * `DataGrid<T>` — the full-parity data grid: client or host-sorted multi-key
 * sort, a column picker and host-applied `columnOrder` (drag a header to
 * request a new one), responsive revelation in the auto layout, and — in the
 * fixed layout — frozen, resizable and windowed columns. Rows group into
 * collapsible sections (a client `group` column or host `sections`, each
 * paging its own keyset), window with `virtualize` (grouped or not), page with
 * `pagedMode`, and close with a sticky summary row. The APG grid keyboard
 * layer roves one tab stop over the header row, the body and the summary row
 * by row id and column key: arrows, <kbd>Home</kbd>/<kbd>End</kbd>,
 * <kbd>PageUp</kbd>/<kbd>PageDown</kbd>, <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+arrows
 * to the data edge, <kbd>Enter</kbd>/<kbd>F2</kbd> or typing to edit, and
 * <kbd>Shift</kbd>+<kbd>F10</kbd> for the cell or header menu.
 *
 * @example
 * <DataGrid
 *   aria-label="Deals"
 *   columns={[
 *     { key: "name", header: "Name", sortable: true, mobile: "visible" },
 *     { key: "stage", header: "Stage", sortable: true,
 *       editable: { type: "select", options: stages } },
 *     { key: "amount", header: "Amount", align: "end", mobile: "merge" },
 *   ]}
 *   data={deals}
 *   getRowId={(d) => d.id}
 *   onCellCommit={(row, key, value) => api.patch(row.id, { [key]: value })}
 *   selectable
 * />
 *
 * @example
 * // Spreadsheet scale: host-sorted, frozen primary column, both axes windowed.
 * <DataGrid
 *   aria-label="Sample requests"
 *   columns={fields}
 *   data={rows}
 *   getRowId={(r) => r.id}
 *   sortMode="manual"
 *   sort={sort}
 *   onSortChange={setSort}
 *   onColumnResize={saveWidth}
 *   virtualize
 *   virtualizeColumns
 *   rowHeight="short"
 *   maxHeight="70dvh"
 *   ariaRowCount={total + 1}
 * />
 *
 * @example
 * // A table block in a page: sized to its rows, editable for people who can edit.
 * <DataGrid
 *   embedded
 *   aria-label="QA fixtures"
 *   columns={fields}
 *   data={rows}
 *   getRowId={(r) => r.id}
 *   toolbar={<BlockHeader icon={<Table2 />} title="QA fixtures" />}
 *   footer={{ onNewRow: addRow, shown: rows.length, total }}
 *   readOnly={!canEdit}
 *   onRowOpen={openPeek}
 * />
 */
export function DataGrid<T>({
  columns: declaredColumns,
  data,
  getRowId,
  sortMode = "client",
  sort,
  onSortChange,
  maxSortKeys = 2,
  columnVisibility,
  onColumnVisibilityChange,
  columnPicker: columnPickerProp,
  columnOrder,
  onColumnReorder,
  onColumnResize,
  virtualizeColumns = false,
  headerTrailing: headerTrailingProp,
  groupState,
  onGroupStateChange,
  sections: hostSections,
  rowHeight,
  summaryRow,
  cellMenu,
  onCellCommit: onCellCommitProp,
  cellStatus,
  selectable = false,
  selectedIds,
  onSelectionChange,
  loadMore,
  pagedMode,
  virtualize: virtualizeProp = false,
  maxHeight: maxHeightProp,
  fill = false,
  endSpacer = false,
  columnDividers = false,
  editingTint = false,
  editing: editingMode = "inline",
  headerAlign: gridHeaderAlign = "column",
  ariaRowCount,
  ariaColCount,
  ariaRowIndexOffset = 0,
  loading = false,
  emptyState,
  toolbar,
  footer,
  "aria-label": ariaLabel = "Data grid",
  className,
  ref,
  selectionMode = "rows",
  onCellsCommit: onCellsCommitProp,
  onFill: onFillProp,
  onPasteOverflow: onPasteOverflowProp,
  onUndo: onUndoProp,
  onRedo: onRedoProp,
  remoteChanges,
  onRowOpen,
  activeRowId,
  getRowLabel,
  untitledLabel = "Untitled",
  actionsRef,
  selectionActions,
  selectionLabel,
  selectionSecondaryActions,
  selectionMoreLabel,
  clearSelectionLabel,
  selectionBarLabel,
  loadingRows = 5,
  phoneLayout = "scroll",
  cardFields = 3,
  embedded = false,
  maxRows = embedded ? 25 : undefined,
  readOnly = false,
}: DataGridProps<T>) {
  // An embedded block sizes to its rows (no inner scroll, so no row windowing) and leaves column
  // choice to its block header; a read-only grid drops every write path at the door.
  const columnPicker = columnPickerProp ?? !embedded;
  const virtualize = virtualizeProp && !embedded;
  const headerTrailing = readOnly ? undefined : headerTrailingProp;
  const onCellCommit = readOnly ? undefined : onCellCommitProp;
  const onCellsCommit = readOnly ? undefined : onCellsCommitProp;
  const onFill = readOnly ? undefined : onFillProp;
  const onPasteOverflow = readOnly ? undefined : onPasteOverflowProp;
  const onUndo = readOnly ? undefined : onUndoProp;
  const onRedo = readOnly ? undefined : onRedoProp;
  // A numeric column without an alignment of its own lines its figures — and its header — up at
  // the end (UX-12). Normalised once, so every part reads one `align`. A read-only grid's columns
  // lose their editors and paste parsers, so no cell edits, pastes, clears or fills.
  const columns = React.useMemo(
    () =>
      declaredColumns.map((column) => {
        let next = column;
        if (next.numeric && next.align === undefined)
          next = { ...next, align: "end" as const };
        if (gridHeaderAlign === "start" && next.headerAlign === undefined)
          next = { ...next, headerAlign: "start" as const };
        if (readOnly && (next.editable != null || next.parse != null))
          next = { ...next, editable: undefined, parse: undefined };
        return next;
      }),
    [declaredColumns, readOnly, gridHeaderAlign],
  );
  // ---- controlled-optional state (the shared house idiom) ------------------
  const [activeSort, commitSort] = useControlledState<DataGridSort[]>(
    sort,
    EMPTY_SORT,
    onSortChange,
  );
  // A controlled sort with no `onSortChange` is set elsewhere (a toolbar): headers show it
  // read-only — the glyph and `aria-sort` — and never sort on a click.
  const sortLocked = sort !== undefined && onSortChange === undefined;
  const [visibility, commitVisibility] = useControlledState<
    Record<string, boolean>
  >(columnVisibility, EMPTY_VISIBILITY, onColumnVisibilityChange);
  const [groups, commitGroups] = useControlledState<GroupState>(
    groupState,
    EMPTY_GROUPS,
    onGroupStateChange,
  );

  // ---- the root: the selection bar centres over it, and its width picks the phone layout ----
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [measureRoot, rootWidth] = useContainerWidth();
  const [root, setRootState] = React.useState<HTMLElement | null>(null);
  const setRoot = React.useMemo(
    () => mergeRefs(ref, rootRef, measureRoot, setRootState),
    [ref, measureRoot],
  );
  const cardMode =
    phoneLayout === "cards" && rootWidth != null && rootWidth < PHONE_TIER_PX;

  // ---- the viewport (state, so the body's virtualiser sees it on mount) ----
  const [viewport, setViewportState] = React.useState<HTMLDivElement | null>(
    null,
  );
  const [measureRef, containerWidth] = useContainerWidth();
  const setViewport = React.useCallback(
    (node: HTMLDivElement | null) => {
      setViewportState(node);
      measureRef(node);
    },
    [measureRef],
  );

  // `fill` is a `maxHeight` the grid measures; the host's own wins, and an embedded block sizes to
  // its rows.
  const filledHeight = useFillHeight(
    viewport,
    root,
    fill && !embedded && maxHeightProp == null,
  );
  const maxHeight = embedded
    ? undefined
    : (maxHeightProp ??
      (fill
        ? filledHeight != null
          ? `${filledHeight}px`
          : FILL_FALLBACK_HEIGHT
        : undefined));
  const endSpacerPx = endSpacer === true ? END_SPACER_PX : endSpacer || 0;

  // ---- columns: order, layout, widths ---------------------------------------
  const ordered = React.useMemo(() => {
    if (!columnOrder) return columns;
    const byKey = new Map(columns.map((c) => [c.key, c]));
    const seen = columnOrder
      .map((key) => byKey.get(key))
      .filter((c): c is DataGridColumn<T> => c !== undefined);
    const missing = columns.filter((c) => !columnOrder.includes(c.key));
    return [...seen, ...missing];
  }, [columns, columnOrder]);

  const fixed =
    embedded ||
    virtualizeColumns ||
    onColumnResize != null ||
    columns.some(
      (column) =>
        column.width != null ||
        column.frozen === true ||
        column.resizable === true,
    );

  /**
   * AUTO layout — the platform-harvested revelation (`revealColumns`): `visible` always stays,
   * `merge` overflow stacks into the primary cell, and only an explicit `hidden` actually
   * disappears — where it is COUNTED, so the toolbar can say so. FIXED layout scrolls instead.
   */
  const { visibleColumns, mergedColumns, hiddenColumns } = React.useMemo(() => {
    const shown = ordered.filter((column) => visibility[column.key] !== false);
    if (fixed)
      return {
        visibleColumns: shown,
        mergedColumns: [] as DataGridColumn<T>[],
        hiddenColumns: [] as DataGridColumn<T>[],
      };
    return revealColumns(
      shown,
      containerWidth,
      selectable ? SELECTION_COLUMN_WIDTH : 0,
    );
  }, [ordered, visibility, containerWidth, selectable, fixed]);

  /** The cards' columns: every column the host shows, in order, before revelation. */
  const cardColumns = React.useMemo(
    () => ordered.filter((column) => visibility[column.key] !== false),
    [ordered, visibility],
  );

  // Live widths while a resize is in flight, and a committed one until the host answers: the next
  // `columns` it passes is the authority (its persisted width, a normalised one, or the old one
  // after a refusal), so a committed override is dropped then. A drag in flight is kept.
  const [widthOverrides, setWidthOverrides] = React.useState<
    Record<string, { width: number; committed: boolean }>
  >({});
  React.useEffect(() => {
    setWidthOverrides((current) => {
      const kept = Object.entries(current).filter(
        ([, entry]) => !entry.committed,
      );
      return kept.length === Object.keys(current).length
        ? current
        : Object.fromEntries(kept);
    });
  }, [columns]);

  /** Every visible column with its precomputed layout, in render order. */
  const placed = React.useMemo(() => {
    const out: PlacedColumn<T>[] = [];
    let frozenRun = fixed;
    let offset = selectable ? SELECTION_COLUMN_WIDTH : 0;
    visibleColumns.forEach((column, index) => {
      const primary = index === 0;
      const width =
        widthOverrides[column.key]?.width ??
        column.width ??
        (primary ? PRIMARY_WIDTH : DEFAULT_WIDTH);
      const frozen = frozenRun && column.frozen === true;
      if (!frozen) frozenRun = false;
      const ariaColIndex =
        ordered.findIndex((c) => c.key === column.key) + (selectable ? 2 : 1);
      out.push({
        column,
        key: column.key,
        label: columnLabel(column),
        width,
        offset: frozen ? offset : undefined,
        edge: false,
        primary,
        ariaColIndex,
        dataIndex: index,
        dividers: columnDividers,
        floating: editingMode === "floating",
        cellClass: fixed
          ? cn(
              CELL_BASE_CLASS,
              "overflow-hidden text-ellipsis",
              alignClass(column.align),
              // An editable cell's display is a padded 32px box: the cell drops its own vertical
              // padding so the box fits a short (32px) or medium row exactly.
              rowHeight &&
                (column.editable ? "py-0" : CELL_PAD_CLASS[rowHeight]),
              column.mono && "font-mono text-sm tabular-nums",
              column.numeric && "tabular-nums",
              frozen && FROZEN_CELL_CLASS,
              "focus-visible:-outline-offset-2",
              columnDividers && (frozen ? FROZEN_DIVIDER_CLASS : DIVIDER_CLASS),
              editingTint && EDITING_TINT_CLASS,
            )
          : cn(
              CELL_BASE_CLASS,
              columnCellClass(column, { fill: primary }),
              // The roving cell lives inside the scroll viewport, which clips its overflow — an
              // outward focus outline would be cut off, so it is pulled inside (SP-03).
              "focus-visible:-outline-offset-2",
              columnDividers && (frozen ? FROZEN_DIVIDER_CLASS : DIVIDER_CLASS),
              editingTint && EDITING_TINT_CLASS,
            ),
      });
      if (frozen) offset += width;
    });
    const frozenCount = out.filter((p) => p.offset != null).length;
    if (frozenCount > 0) {
      const edge = out[frozenCount - 1]!;
      out[frozenCount - 1] = {
        ...edge,
        edge: true,
        cellClass: cn(edge.cellClass, FROZEN_EDGE_CLASS),
      };
    }
    return out;
  }, [
    visibleColumns,
    ordered,
    widthOverrides,
    fixed,
    selectable,
    rowHeight,
    columnDividers,
    editingTint,
    editingMode,
  ]);

  const frozenPlaced = React.useMemo(
    () => placed.filter((p) => p.offset != null),
    [placed],
  );
  const centerPlaced = React.useMemo(
    () => placed.filter((p) => p.offset == null),
    [placed],
  );
  const selectOffset = frozenPlaced.length > 0 && selectable ? 0 : undefined;
  const frozenWidth =
    (selectable ? SELECTION_COLUMN_WIDTH : 0) +
    frozenPlaced.reduce((sum, p) => sum + p.width, 0);
  const tableWidth =
    frozenWidth +
    centerPlaced.reduce((sum, p) => sum + p.width, 0) +
    (headerTrailing ? TRAILING_WIDTH : 0);

  // ---- column windowing ------------------------------------------------------
  const windowColumns = fixed && virtualizeColumns;
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: windowColumns ? centerPlaced.length : 0,
    getScrollElement: () => viewport,
    estimateSize: (index) => centerPlaced[index]?.width ?? DEFAULT_WIDTH,
    getItemKey: (index) => centerPlaced[index]?.key ?? index,
    paddingStart: frozenWidth,
    // A column scrolled into view lands clear of the frozen columns.
    scrollPaddingStart: frozenWidth,
    // One column each side: a column is a cell in every rendered row.
    overscan: 1,
  });
  const widthSignature = centerPlaced.map((p) => p.width).join(",");
  React.useEffect(() => {
    if (windowColumns) columnVirtualizer.measure();
  }, [windowColumns, widthSignature, frozenWidth, columnVirtualizer]);
  const columnItems = windowColumns ? columnVirtualizer.getVirtualItems() : [];
  const windowStart = windowColumns ? (columnItems[0]?.index ?? 0) : 0;
  const windowEnd = windowColumns
    ? (columnItems.at(-1)?.index ?? -1) + 1
    : centerPlaced.length;
  const padStart = windowColumns
    ? (columnItems[0]?.start ?? frozenWidth) - frozenWidth
    : 0;
  const padEnd = windowColumns
    ? Math.max(
        0,
        columnVirtualizer.getTotalSize() -
          (columnItems.at(-1)?.end ?? frozenWidth),
      )
    : 0;

  const openable = onRowOpen != null;
  const w = React.useMemo<ColumnWindow<T>>(() => {
    const center = centerPlaced.slice(windowStart, windowEnd);
    return {
      fixed,
      selectable,
      selectOffset,
      frozen: frozenPlaced,
      center,
      padStart,
      padEnd,
      trailing: headerTrailing != null,
      span:
        (selectable ? 1 : 0) +
        frozenPlaced.length +
        center.length +
        // The two spacers and the filler.
        (fixed ? 3 : 0) +
        (headerTrailing != null ? 1 : 0),
      merged: mergedColumns,
      rowHeight,
      openable,
      untitledLabel,
    };
  }, [
    openable,
    untitledLabel,
    fixed,
    selectable,
    selectOffset,
    frozenPlaced,
    centerPlaced,
    windowStart,
    windowEnd,
    padStart,
    padEnd,
    headerTrailing,
    mergedColumns,
    rowHeight,
  ]);

  // ---- rows: client sort via the TanStack row model, or the host's order ---
  const columnHelper = React.useMemo(
    () => createColumnHelper<GridFeatures, EngineRow>(),
    [],
  );
  const tanColumns = React.useMemo<
    ColumnDef<GridFeatures, EngineRow, unknown>[]
  >(
    () =>
      columns.map((column) =>
        columnHelper.accessor((row) => readValue(column, row as T), {
          id: column.key,
        }),
      ),
    [columns, columnHelper],
  );
  // Referential stability matters: the engine memoizes the sorted row model
  // on [sorting, preSortedRows] by identity — a fresh array per render would
  // re-sort every render and invalidate every downstream memo.
  const sortingState: SortingState = React.useMemo(
    () =>
      activeSort.map((entry) => ({
        id: entry.key,
        desc: entry.direction === "desc",
      })),
    [activeSort],
  );
  // `sorting` is fully controlled by `activeSort` and is never written through
  // the engine — the header buttons call `cycleSort`/`commitSort` — so no
  // `onSortingChange` is wired. In `manual` mode the engine sees no rows at all.
  const table = useTable<GridFeatures, EngineRow>({
    features: gridFeatures,
    data: sortMode === "client" ? (data as unknown as EngineRow[]) : EMPTY_ROWS,
    columns: tanColumns,
    state: { sorting: sortingState },
    enableSortingRemoval: true,
    getRowId: (row) => getRowId(row as T),
  });
  const engineRows = table.getSortedRowModel().rows as unknown as GridRow<T>[];
  const manualRows = React.useMemo(
    () =>
      sortMode === "manual"
        ? data.map((row) => ({ id: getRowId(row), original: row }))
        : null,
    [sortMode, data, getRowId],
  );
  const sortedRows = manualRows ?? engineRows;

  // ---- groups, flattened into one item list -------------------------------
  const groupColumn = hostSections ? undefined : columns.find((c) => c.group);
  const allItems = React.useMemo<GridItem<T>[]>(() => {
    type Section = {
      id: string;
      label: React.ReactNode;
      count?: number;
      rows: GridRow<T>[];
      loadMore?: LoadMoreState;
    };
    let sectionList: Section[] | null = null;
    if (hostSections) {
      const owner = new Map<string, Section>();
      sectionList = hostSections.map((section) => {
        const entry: Section = {
          id: section.id,
          label: section.label,
          count: section.count,
          rows: [],
          loadMore: section.loadMore,
        };
        for (const id of section.rowIds) owner.set(id, entry);
        return entry;
      });
      for (const row of sortedRows) owner.get(row.id)?.rows.push(row);
    } else if (groupColumn) {
      const map = new Map<string, Section>();
      for (const row of sortedRows) {
        const id = String(readValue(groupColumn, row.original) ?? "—");
        const bucket = map.get(id);
        if (bucket) bucket.rows.push(row);
        else map.set(id, { id, label: id, rows: [row] });
      }
      sectionList = [...map.values()];
    }
    if (!sectionList)
      return sortedRows.map((row) => ({ kind: "row", id: row.id, row }));
    const out: GridItem<T>[] = [];
    for (const section of sectionList) {
      const expanded = groups[section.id] !== "collapsed";
      out.push({
        kind: "group",
        id: `${GROUP_PREFIX}${section.id}`,
        groupId: section.id,
        label: section.label,
        count: section.count ?? section.rows.length,
        expanded,
      });
      if (!expanded) continue;
      for (const row of section.rows)
        out.push({ kind: "row", id: row.id, row });
      if (
        section.loadMore &&
        (section.loadMore.hasMore ||
          (section.loadMore.error != null && section.loadMore.error !== false))
      )
        out.push({
          kind: "more",
          id: `${MORE_PREFIX}${section.id}`,
          groupId: section.id,
          loadMore: section.loadMore,
        });
    }
    return out;
  }, [hostSections, groupColumn, sortedRows, groups]);
  // `maxRows`: the first rows in DISPLAY order (sorted, grouped, collapsed groups left out) — an
  // embedded block's cap. Everything after the last row kept goes, group headers included.
  const items = React.useMemo(() => {
    if (maxRows == null) return allItems;
    let rows = 0;
    let end = allItems.length;
    for (let index = 0; index < allItems.length; index++) {
      if (allItems[index]!.kind !== "row") continue;
      if (rows === Math.max(0, maxRows)) {
        end = index;
        break;
      }
      rows += 1;
    }
    if (rows < Math.max(0, maxRows)) return allItems;
    // Cut right after the last row kept: no trailing group header or load-more row.
    const cut = allItems.slice(0, end);
    while (cut.length && cut.at(-1)!.kind !== "row") cut.pop();
    return cut.length === allItems.length ? allItems : cut;
  }, [allItems, maxRows]);

  const rowItems = React.useMemo(
    () =>
      items.filter(
        (item): item is Extract<GridItem<T>, { kind: "row" }> =>
          item.kind === "row",
      ),
    [items],
  );
  const hasRows = sortedRows.length > 0;
  const hasItems = items.length > 0;

  // ---- selection (the shared preserved-off-view semantics) -----------------
  const visibleIds = React.useMemo(
    () => rowItems.map((item) => item.id),
    [rowItems],
  );
  const rowNumbers = React.useMemo(
    () => new Map(visibleIds.map((id, index) => [id, index + 1])),
    [visibleIds],
  );
  const {
    selected,
    allSelected,
    indeterminate,
    toggleAll,
    toggleRow,
    setSelected,
  } = useRowSelection({ rowIds: visibleIds, selectedIds, onSelectionChange });
  const clearSelection = React.useCallback(
    () => setSelected(new Set()),
    [setSelected],
  );

  // ---- ARIA geometry -------------------------------------------------------
  // aria-rowindex counts EVERY row (header, group rows, data rows, load-more rows and the
  // summary row); aria-colcount conveys the FULL declared column set with per-cell indices in
  // that set, so hidden and windowed-out columns read as gaps rather than being erased.
  const ariaRowIndexBase = 2 + ariaRowIndexOffset;
  const footerRowIndex = ariaRowIndexBase + items.length;
  const anyGroupHasMore = (hostSections ?? []).some(
    (section) => section.loadMore?.hasMore,
  );
  const ariaRowTotal =
    ariaRowCount ??
    (loadMore?.hasMore || anyGroupHasMore
      ? -1
      : footerRowIndex - 1 + (summaryRow ? 1 : 0));
  const ariaColTotal = ariaColCount ?? ordered.length + (selectable ? 1 : 0);

  // ---- the roving focus model ----------------------------------------------
  const gridId = React.useId();
  const hiddenHintId = React.useId();
  const sortHintId = React.useId();
  const { announce, Announcer } = useAnnouncer();

  // ---- cells mode: ranges, clipboard, fill --------------------------------
  const cellsMode = selectionMode === "cells";
  const dataKeys = React.useMemo(() => placed.map((p) => p.key), [placed]);
  const dataKeyIndex = React.useMemo(
    () => new Map(dataKeys.map((key, index) => [key, index])),
    [dataKeys],
  );
  const selection = useGridSelection({
    rowIds: cellsMode ? visibleIds : EMPTY_KEYS,
    colKeys: cellsMode ? dataKeys : EMPTY_KEYS,
  });
  const range = selection.bounds;
  // "4 by 3 cells selected" — announced for a range, not for every single-cell move.
  const rangeSize = range ? `${range.rows}x${range.columns}` : "";
  React.useEffect(() => {
    if (!range || range.rows * range.columns < 2) return;
    announce(`${range.rows} by ${range.columns} cells selected`);
    // Announce the size, not every move at the same size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeSize]);
  // A fill drag's window listeners, removed on release, cancel or unmount.
  const fillCleanup = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => fillCleanup.current?.(), []);
  const [fillRows, setFillRows] = React.useState<{
    top: number;
    bottom: number;
  } | null>(null);

  /** Column keys in navigation order (every visible column, windowed or not). */
  const navKeys = React.useMemo(
    () => [...(selectable ? [SELECT] : []), ...placed.map((p) => p.key)],
    [selectable, placed],
  );
  /** Row ids in navigation order: header, groups and rows, summary. */
  const navRows = React.useMemo(
    () => [
      HEADER,
      // A group's load-more row is on the path only while its page failed (its Try again).
      ...items
        .filter(
          (item) =>
            item.kind !== "more" ||
            (item.loadMore.error != null && item.loadMore.error !== false),
        )
        .map((item) => item.id),
      ...(summaryRow ? [FOOTER] : []),
    ],
    [items, summaryRow],
  );
  const navRowIndex = React.useMemo(
    () => new Map(navRows.map((id, index) => [id, index])),
    [navRows],
  );
  const itemIndex = React.useMemo(
    () => new Map(items.map((item, index) => [item.id, index])),
    [items],
  );
  /** The header row's keys: the columns, then the trailing control when there is one. */
  const headerKeys = React.useMemo(
    () => (headerTrailing ? [...navKeys, TRAILING] : navKeys),
    [navKeys, headerTrailing],
  );
  const firstItemNav = navRows.length > 1 && navRows[1] !== FOOTER ? 1 : 0;
  const lastItemNav = navRows.length - (summaryRow ? 2 : 1);

  const [active, setActive] = React.useState<GridPosition | null>(null);
  // The roving coordinate is RESOLVED against what exists: a removed row or a hidden column
  // falls back to the first row and the first column, so the grid never loses its tab stop.
  const resolved: GridPosition = {
    rowId:
      active && navRowIndex.has(active.rowId)
        ? active.rowId
        : (navRows[firstItemNav] ?? HEADER),
    key:
      active &&
      (navKeys.includes(active.key) ||
        (active.key === TRAILING && headerTrailing != null))
        ? active.key
        : (navKeys[0] ?? SELECT),
  };
  // The trailing control lives in the header alone; elsewhere its key means the last column.
  if (resolved.key === TRAILING && resolved.rowId !== HEADER)
    resolved.key = navKeys.at(-1) ?? SELECT;
  // A windowed-out column cannot hold the tab stop; the first rendered one does instead.
  const renderedKeys = [
    ...(selectable ? [SELECT] : []),
    ...w.frozen.map((p) => p.key),
    ...w.center.map((p) => p.key),
    ...(headerTrailing ? [TRAILING] : []),
  ];
  const tabKey = renderedKeys.includes(resolved.key)
    ? resolved.key
    : (renderedKeys[0] ?? resolved.key);

  const [editing, setEditingState] = React.useState<
    (GridPosition & { seed?: string }) | null
  >(null);
  const [headerMenuKey, setHeaderMenuKey] = React.useState<string | null>(null);
  const [menuTarget, setMenuTarget] = React.useState<GridPosition | null>(null);

  const nodes = React.useRef(new Map<string, HTMLElement>());
  // Turning `readOnly` on mid-edit (the viewer lost edit access) drops the editor with its
  // column's `editable`: cancel the edit too, and give focus back to the cell it was in, so the
  // grid's keys (and Escape) work again.
  React.useEffect(() => {
    if (!readOnly) return;
    setEditingState((current) => {
      if (current == null) return current;
      const cell = nodes.current.get(nodeKey(current.rowId, current.key));
      if (
        cell?.contains(document.activeElement) ||
        document.activeElement === document.body
      )
        requestAnimationFrame(() => cell?.focus());
      return null;
    });
  }, [readOnly]);
  const pendingFocus = React.useRef<string | null>(null);
  /** A focused cell that unmounted this commit (a refetch moved or removed its row). */
  const lostFocus = React.useRef<GridPosition | null>(null);
  const rowVirtualizerRef = React.useRef<Virtualizer<
    HTMLDivElement,
    Element
  > | null>(null);
  const onVirtualizer = React.useCallback(
    (virtualizer: Virtualizer<HTMLDivElement, Element> | null) => {
      rowVirtualizerRef.current = virtualizer;
    },
    [],
  );

  const loadMoreFired = React.useRef(false);
  const dataLength = data.length;
  React.useEffect(() => {
    loadMoreFired.current = false;
  }, [dataLength, loadMore?.loading]);
  // The one way the grid asks for the next page — the scroll sentinel and ArrowDown past the last
  // row share it, so a page is requested ONCE: the guard resets when rows arrive or `loading`
  // moves, so a host that omits `loading` cannot be hammered either.
  const requestMore = (): boolean => {
    if (!loadMore?.hasMore || loadMore.loading || loadMoreFired.current)
      return false;
    loadMoreFired.current = true;
    loadMore.onLoadMore();
    announce("Loading more rows…");
    return true;
  };

  const centerIndex = React.useMemo(
    () => new Map(centerPlaced.map((p, index) => [p.key, index])),
    [centerPlaced],
  );

  /** Move the tab stop and DOM focus; scrolls a windowed-out target into view first. */
  const focusAt = (rowId: string, key: string) => {
    setActive({ rowId, key });
    const isGroup = isLineRow(rowId);
    const target = nodeKey(rowId, isGroup ? GROUP : key);
    const mounted = nodes.current.get(target);
    if (mounted) {
      pendingFocus.current = null;
      mounted.focus();
      return;
    }
    // Not mounted: windowed out on one axis or both. Scroll it in; the cell focuses itself as it
    // registers (`api.register`).
    pendingFocus.current = target;
    const column = centerIndex.get(key);
    if (!isGroup && windowColumns && column != null)
      columnVirtualizer.scrollToIndex(column, { align: "auto" });
    const index = itemIndex.get(rowId);
    if (index != null)
      rowVirtualizerRef.current?.scrollToIndex(index, { align: "auto" });
    // A target that never mounts (filtered out, a no-op scroll) must not steal focus later.
    window.setTimeout(() => {
      if (pendingFocus.current === target) pendingFocus.current = null;
    }, 1000);
  };

  // ---- cells mode operations ------------------------------------------------
  /** A row's index among the loaded data rows, or -1 (constant time: `rowNumbers` is a map). */
  const rowIndexOf = (rowId: string) => (rowNumbers.get(rowId) ?? 0) - 1;
  /** Whether paste, clear, cut and fill may write a column. */
  const writable = (column: DataGridColumn<T>) =>
    column.editable != null || column.parse != null;
  /** The cells an operation acts on: the range, or the active data cell alone. */
  const operationBounds = (): GridRangeBounds | null => {
    if (range) return range;
    const r = rowIndexOf(resolved.rowId);
    const c = dataKeyIndex.get(resolved.key) ?? -1;
    return r === -1 || c === -1
      ? null
      : { top: r, bottom: r, left: c, right: c, rows: 1, columns: 1 };
  };
  const blockOf = (
    bounds: GridRangeBounds,
    top = bounds.top,
    bottom = bounds.bottom,
  ) => ({
    rowIds: visibleIds.slice(top, bottom + 1),
    keys: dataKeys.slice(bounds.left, bounds.right + 1),
  });
  /** A fill target: the columns a fill may write (read-only ones are left alone). */
  const fillTargetOf = (
    bounds: GridRangeBounds,
    top: number,
    bottom: number,
  ) => {
    const block = blockOf(bounds, top, bottom);
    return {
      rowIds: block.rowIds,
      keys: block.keys.filter((key) =>
        writable(placed[dataKeyIndex.get(key)!]!.column),
      ),
    };
  };
  /** Ask the host to write a batch, then say what happened ("Pasted 12 cells · 2 skipped"). */
  const commitCells = async (
    changes: CellChange[],
    verb: string,
    skippedBefore: number,
  ) => {
    if (!onCellsCommit || changes.length === 0) {
      if (skippedBefore > 0)
        announce(`${skippedBefore} cells can't be changed`);
      return;
    }
    let results: CellCommitResult[];
    try {
      results = await onCellsCommit(changes);
    } catch {
      // The host's write failed outright: nothing was written, and the grid says so.
      announce("Couldn't save — nothing changed");
      return;
    }
    const failed = results.filter((result) => result.status !== "ok").length;
    const ok = results.length - failed;
    const skipped = skippedBefore + failed;
    announce(
      `${verb} ${ok} ${ok === 1 ? "cell" : "cells"}${skipped > 0 ? ` · ${skipped} skipped` : ""}`,
    );
  };
  /** Clear every writable cell of the operation's cells (Delete, cut). */
  const clearCells = (verb: string) => {
    const bounds = operationBounds();
    if (!bounds) return;
    const { rowIds, keys } = blockOf(bounds);
    const changes: CellChange[] = [];
    let skipped = 0;
    for (const rowId of rowIds) {
      const row = rowsById.get(rowId);
      if (row === undefined) continue;
      for (const key of keys) {
        const column = placed[dataKeyIndex.get(key)!]!.column;
        if (!writable(column)) {
          skipped += 1;
          continue;
        }
        changes.push({
          rowId,
          key,
          value: null,
          previous: readValue(column, row),
        });
      }
    }
    void commitCells(changes, verb, skipped);
  };
  /** The text a copy writes for the operation's cells, as TSV and HTML. */
  const copyCells = (data: DataTransfer): number => {
    const bounds = operationBounds();
    if (!bounds) return 0;
    const { rowIds, keys } = blockOf(bounds);
    const matrix = rowIds.map((rowId) => {
      const row = rowsById.get(rowId)!;
      return keys.map((key) => {
        const column = placed[dataKeyIndex.get(key)!]!.column;
        if (column.format) return column.format(row);
        const value = readValue(column, row);
        return value == null ? "" : String(value);
      });
    });
    data.setData("text/plain", serializeTsv(matrix));
    data.setData("text/html", serializeHtmlTable(matrix));
    return rowIds.length * keys.length;
  };
  const pasteCells = (data: DataTransfer) => {
    const parsed = parseClipboard({
      text: data.getData("text/plain"),
      html: data.getData("text/html"),
      sheets: data.getData(SHEETS_COMPACT_TABLE_TYPE),
    });
    const bounds = operationBounds();
    if (!bounds || parsed.length === 0) return;
    // One value fills the range; a pattern that divides it tiles; anything else lands at the
    // range's top-left at its own size.
    const matrix = expandPaste(
      { rows: bounds.rows, columns: bounds.columns },
      parsed,
    );
    const changes: CellChange[] = [];
    const overflow: GridClipboardMatrix = [];
    let skipped = 0;
    matrix.forEach((cells, r) => {
      const rowId = visibleIds[bounds.top + r];
      if (rowId === undefined) {
        overflow.push(cells);
        return;
      }
      const row = rowsById.get(rowId)!;
      cells.forEach((cell, c) => {
        const placedColumn = placed[bounds.left + c];
        if (!placedColumn || !writable(placedColumn.column)) {
          skipped += 1;
          return;
        }
        const column = placedColumn.column;
        changes.push({
          rowId,
          key: placedColumn.key,
          value: column.parse ? column.parse(cell, row) : cell.text,
          previous: readValue(column, row),
        });
      });
    });
    // The pasted block becomes the selection.
    const lastRow = Math.min(
      visibleIds.length - 1,
      bounds.top + matrix.length - 1,
    );
    const lastCol = Math.min(
      dataKeys.length - 1,
      bounds.left + (matrix[0]?.length ?? 1) - 1,
    );
    selection.select({
      rowId: visibleIds[bounds.top]!,
      colKey: dataKeys[bounds.left]!,
    });
    selection.extendTo({
      rowId: visibleIds[lastRow]!,
      colKey: dataKeys[lastCol]!,
    });
    if (overflow.length > 0)
      onPasteOverflow?.({
        matrix: overflow,
        keys: dataKeys.slice(
          bounds.left,
          bounds.left + (matrix[0]?.length ?? 0),
        ),
        afterRowId: visibleIds.at(-1)!,
      });
    void commitCells(changes, "Pasted", skipped);
  };
  /** ⌘/Ctrl+D: the range's top row down through it, or the row above into a one-row range. */
  const fillDown = () => {
    const bounds = operationBounds();
    if (!bounds || !onFill) return;
    const [source, target] =
      bounds.rows > 1
        ? [
            blockOf(bounds, bounds.top, bounds.top),
            fillTargetOf(bounds, bounds.top + 1, bounds.bottom),
          ]
        : bounds.top > 0
          ? [
              blockOf(bounds, bounds.top - 1, bounds.top - 1),
              fillTargetOf(bounds, bounds.top, bounds.bottom),
            ]
          : [null, null];
    if (source && target && target.keys.length > 0)
      onFill({ source, target, series: false });
  };
  /** The fill handle: drag up or down from the range; release reports the fill. */
  const fillStart = (event: React.PointerEvent) => {
    const bounds = operationBounds();
    if (!bounds || !onFill || !viewport) return;
    fillCleanup.current?.();
    const pointerId = event.pointerId;
    let target: { top: number; bottom: number } | null = null;
    const move = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) return;
      const cell = document
        .elementFromPoint(pointer.clientX, pointer.clientY)
        ?.closest<HTMLElement>("[data-grid-row]");
      const index = cell ? rowIndexOf(cell.dataset.gridRow ?? "") : -1;
      if (index === -1) return;
      target =
        index > bounds.bottom
          ? { top: bounds.bottom + 1, bottom: index }
          : index < bounds.top
            ? { top: index, bottom: bounds.top - 1 }
            : null;
      setFillRows(target);
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      fillCleanup.current = null;
      setFillRows(null);
    };
    const cancel = (pointer: PointerEvent) => {
      if (pointer.pointerId === pointerId) stop();
    };
    const up = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) return;
      stop();
      if (!target) return;
      const fillTarget = fillTargetOf(bounds, target.top, target.bottom);
      if (fillTarget.keys.length === 0) return;
      onFill({
        source: blockOf(bounds),
        target: fillTarget,
        series: pointer.altKey,
      });
      selection.select({
        rowId: visibleIds[Math.min(bounds.top, target.top)]!,
        colKey: dataKeys[bounds.left]!,
      });
      selection.extendTo({
        rowId: visibleIds[Math.max(bounds.bottom, target.bottom)]!,
        colKey: dataKeys[bounds.right]!,
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    fillCleanup.current = stop;
  };
  /** A clipboard event the grid owns: cells mode, not editing, from a cell (not a field). */
  const ownsClipboard = (event: React.ClipboardEvent) => {
    if (!cellsMode || editing) return false;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, [contenteditable='true']"))
      return false;
    const cell = target.closest<HTMLElement>("[data-grid-row]");
    return cell != null && rowNumbers.has(cell.dataset.gridRow ?? "");
  };
  const handleCopy = (event: React.ClipboardEvent) => {
    if (!ownsClipboard(event)) return;
    event.preventDefault();
    const count = copyCells(event.clipboardData);
    if (count > 1) announce(`Copied ${count} cells`);
  };
  const handleCut = (event: React.ClipboardEvent) => {
    if (!ownsClipboard(event)) return;
    event.preventDefault();
    copyCells(event.clipboardData);
    clearCells("Cut");
  };
  const handlePaste = (event: React.ClipboardEvent) => {
    if (!ownsClipboard(event) || !onCellsCommit) return;
    event.preventDefault();
    pasteCells(event.clipboardData);
  };
  // The focused cell hears a remote change; no other does.
  const announcedRemote = React.useRef(0);
  React.useEffect(() => {
    const change = remoteChanges?.get(
      gridCellKey(resolved.rowId, resolved.key),
    );
    if (!change?.announcement || change.at <= announcedRemote.current) return;
    if (!viewport?.contains(document.activeElement)) return;
    announcedRemote.current = change.at;
    announce(change.announcement);
    // Only a new change map is news.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteChanges]);

  // The latest values the stable api reads, refreshed after every commit.
  const rowsById = React.useMemo(
    () => new Map(sortedRows.map((row) => [row.id, row.original])),
    [sortedRows],
  );
  const current = {
    selection,
    cellsMode,
    rowNumbers,
    dataKeyIndex,
    fillStart,
    focusAt,
    restoreFocus: (lost: GridPosition) => restoreFocus(lost),
    rowsById,
    navKeys,
    navRows,
    navRowIndex,
    onCellCommit,
    toggleRow,
    groups,
    commitGroups,
    visibleIds,
    openRow: (rowId: string, event: React.SyntheticEvent | null) => {
      const index = (rowNumbers.get(rowId) ?? 0) - 1;
      if (index >= 0) onRowOpen?.(rowId, { event, index });
    },
    focusCell: (rowId: string, key: string) => {
      if (cellsMode && rowNumbers.has(rowId) && dataKeyIndex.has(key))
        selection.select({ rowId, colKey: key });
      focusAt(rowId, key);
    },
  };
  const latest = React.useRef(current);
  React.useLayoutEffect(() => {
    latest.current = current;
  });

  // Focus follows the position, not the DOM node: when new data unmounts the focused cell (its
  // row moved out of the window, or left), focus goes back to the same row and column — scrolled
  // in — or, if the row is gone, to the tab stop that replaced it. A cell that unmounts because
  // the reader scrolled it away is left alone: chasing it would fight the scroll. The body
  // decides, every commit, because a scroll re-renders the body alone.
  const restoreFocus = (lost: GridPosition) => {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused !== document.body) return;
    const target = navRowIndex.has(lost.rowId)
      ? lost
      : { rowId: navRows[firstItemNav] ?? HEADER, key: lost.key };
    focusAt(
      target.rowId,
      isLineRow(target.rowId) || navKeys.includes(target.key)
        ? target.key
        : (navKeys[0] ?? SELECT),
    );
  };
  // The loss a data change caused, captured at that commit so a later measuring commit (which
  // changes no data) cannot discard it before the restore runs.
  const scheduleRestore = React.useCallback(() => {
    const lost = lostFocus.current;
    lostFocus.current = null;
    if (!lost) return;
    // After the parent's own commit, so the latest positions are in place.
    requestAnimationFrame(() => latest.current.restoreFocus(lost));
  }, []);
  const widgetFocus = React.useRef<{
    rowId: string;
    key: string;
    index: number;
  } | null>(null);
  const onBodyCommit = React.useCallback(
    (itemsChanged: boolean) => {
      if (itemsChanged) scheduleRestore();
      else lostFocus.current = null;
      // Only when the swap dropped focus to the page: focus that moved on stays where it went.
      const kept = widgetFocus.current;
      widgetFocus.current = null;
      const focused = document.activeElement;
      if (kept && (focused == null || focused === document.body)) {
        const cell = nodes.current.get(nodeKey(kept.rowId, kept.key));
        if (cell) (cellWidgets(cell)[kept.index] ?? cell).focus();
      }
    },
    [scheduleRestore],
  );
  // When new data empties the grid the body unmounts and never reports; the parent restores
  // focus to the tab stop that is left (child effects run first, so a loss the body handled is
  // already gone).
  React.useLayoutEffect(() => {
    scheduleRestore();
  }, [items, scheduleRestore]);

  const api = React.useMemo<GridApi>(
    () => ({
      register(rowId, key, node) {
        const id = nodeKey(rowId, key);
        if (!node) {
          const gone = nodes.current.get(id);
          if (gone && gone.contains(document.activeElement))
            lostFocus.current = { rowId, key };
          nodes.current.delete(id);
          return;
        }
        nodes.current.set(id, node);
        if (pendingFocus.current === id) {
          pendingFocus.current = null;
          node.focus({ preventScroll: true });
        }
      },
      focused(rowId, key) {
        // Cells mode: focus that lands on a data cell outside the range's focus (an editor's
        // Enter or Tab, a programmatic move) collapses the range onto it, so every operation
        // acts where the reader is.
        const {
          selection: model,
          cellsMode: cells,
          rowNumbers: numbers,
          dataKeyIndex: keysAt,
        } = latest.current;
        if (cells && numbers.has(rowId) && keysAt.has(key)) {
          const range = model.current();
          if (range?.focus.rowId !== rowId || range.focus.colKey !== key)
            model.select({ rowId, colKey: key });
        }
        setActive((current) =>
          key === GROUP
            ? {
                rowId,
                key: current?.key ?? latest.current.navKeys[0] ?? SELECT,
              }
            : current?.rowId === rowId && current.key === key
              ? current
              : { rowId, key },
        );
      },
      setEditing(rowId, key, open) {
        if (open) {
          setEditingState({ rowId, key });
          return;
        }
        setEditingState((current) =>
          current && current.rowId === rowId && current.key === key
            ? null
            : current,
        );
        // Restore grid focus once the editor unmounts — when focus fell to <body> or is still
        // inside the cell. A close that came from clicking ANOTHER control (the Columns
        // trigger) must not steal focus back from what the user just opened, and a commit that
        // navigated has already moved it.
        requestAnimationFrame(() => {
          const cell = nodes.current.get(nodeKey(rowId, key));
          if (!cell) return;
          const focused = document.activeElement;
          if (
            focused instanceof HTMLElement &&
            focused !== document.body &&
            !cell.contains(focused)
          )
            return;
          cell.focus();
        });
      },
      navigate(rowId, key, direction, via) {
        const {
          navKeys: keys,
          navRows: rows,
          navRowIndex: rowIndex,
        } = latest.current;
        if (via === "tab") {
          const next = keys.indexOf(key) + (direction === "next" ? 1 : -1);
          if (next >= 0 && next < keys.length)
            latest.current.focusAt(rowId, keys[next]!);
          return;
        }
        let index = rowIndex.get(rowId) ?? 0;
        // Enter moves to the next DATA row: group rows and the summary are stepped over.
        do index += direction === "next" ? 1 : -1;
        while (
          index > 0 &&
          index < rows.length &&
          (isLineRow(rows[index]!) || rows[index] === FOOTER)
        );
        if (index > 0 && index < rows.length && rows[index] !== FOOTER)
          latest.current.focusAt(rows[index]!, key);
      },
      commit(rowId, key, value) {
        const row = latest.current.rowsById.get(rowId);
        if (row === undefined) return;
        return latest.current.onCellCommit?.(row, key, value);
      },
      toggleRow(rowId) {
        latest.current.toggleRow(rowId);
      },
      pointerDown(rowId, key, extend) {
        const { selection: model } = latest.current;
        if (extend) model.extendTo({ rowId, colKey: key });
        else model.select({ rowId, colKey: key });
      },
      pointerOver(rowId, key) {
        // A fill drag also crosses cells with the button held; it is not a selection drag.
        if (fillCleanup.current) return;
        latest.current.selection.extendTo({ rowId, colKey: key });
      },
      fillStart(event) {
        latest.current.fillStart(event);
      },
      keepWidgetFocus(rowId, key, index) {
        widgetFocus.current = { rowId, key, index };
      },
      openRow(rowId, event) {
        latest.current.openRow(rowId, event);
      },
      toggleGroup(groupId, expanded) {
        latest.current.commitGroups({
          ...latest.current.groups,
          [groupId]: expanded ? "expanded" : "collapsed",
        });
      },
    }),
    [],
  );

  React.useImperativeHandle(
    actionsRef,
    () => ({
      focusCell: (rowId, key) => latest.current.focusCell(rowId, key),
      getRowOrder: () => [...latest.current.visibleIds],
    }),
    [],
  );
  // The open record's row comes into view as a peek walks the rows (scrolled to its index when
  // the rows are windowed, so a row that is not mounted is reached too).
  React.useEffect(() => {
    if (activeRowId == null) return;
    const index = itemIndex.get(activeRowId);
    if (!cardMode && index != null && rowVirtualizerRef.current) {
      rowVirtualizerRef.current.scrollToIndex(index, { align: "auto" });
      return;
    }
    // Cards have no viewport of their own: the card is found under the root.
    (cardMode ? rootRef.current : viewport)
      ?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(activeRowId)}"]`)
      ?.scrollIntoView?.({ block: "nearest" });
    // Only a new open row moves the scroll; a refetch of the same one does not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRowId]);

  const registerTrailing = React.useCallback(
    (node: HTMLElement | null) => api.register(HEADER, TRAILING, node),
    [api],
  );
  const focusTrailing = React.useCallback(
    () => api.focused(HEADER, TRAILING),
    [api],
  );

  // ---- header interactions -------------------------------------------------
  const handleSort = (key: string, additive: boolean) =>
    commitSort(cycleSort(activeSort, key, { additive, maxKeys: maxSortKeys }));

  const resizeTo = (key: string, width: number, commit: boolean) => {
    setWidthOverrides((current) => ({
      ...current,
      [key]: { width, committed: commit },
    }));
    if (commit) onColumnResize?.(key, width);
  };
  /** Double-click: the widest rendered value (or the header label), within the bounds. */
  const autoFit = (p: PlacedColumn<T>) => {
    if (!viewport) return;
    const escaped = CSS.escape(p.key);
    const nodes = [
      ...viewport.querySelectorAll<HTMLElement>(
        `td[data-grid-key="${escaped}"], [data-grid-key="${escaped}"] [data-slot="data-grid-head-label"]`,
      ),
    ];
    if (nodes.length === 0) return;
    // Each value's INTRINSIC width: a range over its contents measures the text as laid out,
    // overflow included, so a column wider than its values can shrink too.
    // Block and flex wrappers inside a cell are as wide as the column, so they are released to
    // `max-content` for the one synchronous read and put back.
    const released = nodes.flatMap((node) =>
      [...node.querySelectorAll<HTMLElement>("*")].filter(
        (child) => getComputedStyle(child).display !== "inline",
      ),
    );
    const saved = released.map((child) => child.style.cssText);
    for (const child of released) {
      child.style.width = "max-content";
      child.style.maxWidth = "none";
    }
    const range = document.createRange();
    let widest = 0;
    for (const node of nodes) {
      range.selectNodeContents(node);
      widest = Math.max(widest, range.getBoundingClientRect().width);
    }
    released.forEach((child, index) => {
      child.style.cssText = saved[index]!;
    });
    const { min, max } = columnResizeBounds(p.column);
    // The cell's inline padding (`px-2`); the sort glyph or the menu chevron when the header has
    // one, and the type icon when it has that.
    const chrome =
      16 +
      (p.column.sortable || p.column.headerMenu ? 24 : 0) +
      (p.column.icon != null ? 18 : 0);
    const next = Math.min(max, Math.max(min, Math.ceil(widest + chrome)));
    resizeTo(p.key, next, true);
  };

  // Header drag-to-reorder (scrolling columns only; frozen ones stay put).
  const reorderKeys = React.useMemo(
    () => centerPlaced.map((p) => p.key),
    [centerPlaced],
  );
  const reorder = useDragReorder({
    lists: { columns: reorderKeys },
    axis: "horizontal",
    disabled: onColumnReorder == null,
    onReorder: ({ id, to }) => {
      if (!onColumnReorder) return;
      const moved = reorderKeys.filter((key) => key !== id);
      moved.splice(to.index, 0, id);
      const after = moved[to.index + 1];
      const before = moved[to.index - 1];
      const full = ordered
        .map((column) => column.key)
        .filter((key) => key !== id);
      const anchor =
        after != null ? full.indexOf(after) : full.indexOf(before!) + 1;
      full.splice(anchor < 0 ? full.length : anchor, 0, id);
      onColumnReorder(full);
    },
  });

  /**
   * Resolve the cell a menu gesture began on. Only a body cell with a menu opens one; anywhere
   * else Base UI's handler is stopped and the grid has no menu.
   */
  const claimMenu = (
    event: React.SyntheticEvent & { preventBaseUIHandler?: () => void },
  ) => {
    if (!cellMenu) return;
    const cell = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-grid-row]",
    );
    const rowId = cell?.dataset.gridRow;
    const key = cell?.dataset.gridKey;
    const content =
      rowId &&
      key &&
      rowId !== HEADER &&
      rowId !== FOOTER &&
      !isLineRow(rowId) &&
      key !== SELECT
        ? cellMenu(rowId, key)
        : null;
    if (content == null || !rowId || !key) {
      event.preventBaseUIHandler?.();
      return;
    }
    setMenuTarget({ rowId, key });
    setActive({ rowId, key });
  };

  const openCellMenu = (cell: HTMLElement) => {
    const rect = cell.getBoundingClientRect();
    cell.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 8,
        clientY: rect.bottom,
      }),
    );
  };

  /** Rows a PageUp/PageDown moves by: the viewport's height in rows. */
  const pageSize = () => {
    const height = viewport?.clientHeight ?? 0;
    const row = rowHeight ? ROW_PX[rowHeight] : 40;
    return Math.max(1, Math.floor((height - HEADER_PX) / row) - 1);
  };

  // Tab back into the grid returns to the cell that was active, even when its row or column has
  // been windowed out since (the stand-in tab stop only keeps the grid reachable): focus that a
  // Tab key brings in from outside onto any other cell moves on to the active one, scrolled into
  // view. A pointer, or a host focusing a cell itself, is left where it put focus.
  const tabbing = React.useRef(false);
  React.useEffect(() => {
    let reset = 0;
    const stop = () => {
      tabbing.current = false;
      window.clearTimeout(reset);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return stop();
      tabbing.current = true;
      window.clearTimeout(reset);
      // The key's focus move — a dialog's focus trap may hand it on a frame or two later — lands
      // well inside this; any other key or a press ends it sooner.
      reset = window.setTimeout(stop, 500);
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", stop, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", stop, true);
      window.clearTimeout(reset);
    };
  }, []);
  const [tableNode, setTableNode] = React.useState<HTMLTableElement | null>(
    null,
  );
  useCellContentOutOfTabOrder(tableNode);
  const handleGridFocus = (event: React.FocusEvent<HTMLTableElement>) => {
    if (!tabbing.current || editing) return;
    const from = event.relatedTarget as Node | null;
    if (from && event.currentTarget.contains(from)) return;
    // Tab lands only on the one tab stop; a host focusing any other cell meanwhile meant it.
    const target = event.target as HTMLElement;
    if (target.tabIndex !== 0) return;
    const cell = target.closest<HTMLElement>("[data-grid-row]");
    if (!cell || !navRowIndex.has(resolved.rowId)) return;
    const rowId = cell.dataset.gridRow!;
    if (
      rowId === resolved.rowId &&
      (isLineRow(rowId) || cell.dataset.gridKey === resolved.key)
    )
      return;
    event.stopPropagation();
    focusAt(resolved.rowId, resolved.key);
  };

  // Escape on a widget inside a body cell returns to the cell in ONE press: caught before the
  // widget's own layers (its name tooltip closes on Escape and keeps the key), which close as
  // focus leaves them.
  const handleGridKeyDownCapture = (
    event: React.KeyboardEvent<HTMLTableElement>,
  ) => {
    if (event.key !== "Escape" || editing) return;
    // An IME's Escape dismisses its candidates; it never leaves the widget.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const inner = event.target as HTMLElement;
    const cell = inner.closest<HTMLElement>('[data-slot="data-grid-cell"]');
    if (!cell || cell === inner || !event.currentTarget.contains(cell)) return;
    event.preventDefault();
    event.stopPropagation();
    cell.focus();
  };
  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
    // IME composition never moves, commits or opens anything.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    // Edit mode suspends grid navigation entirely (Escape is handled by the editor, which
    // reports back through onEditingChange).
    if (editing) return;
    const origin = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-grid-row]",
    );
    if (!origin || !event.currentTarget.contains(origin)) return;
    // Focus is on a widget INSIDE a body cell (a link chip reached with Enter): arrows step
    // through the cell's widgets, Escape returns to the cell (`handleGridKeyDownCapture`), and
    // every other key is the widget's own (Enter follows the link) — never an edit or a move.
    // Up and Down still move.
    const inner = event.target as HTMLElement;
    if (inner !== origin && origin.dataset.slot === "data-grid-cell") {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const widgets = cellWidgets(origin);
        // The focused widget itself; else the innermost one holding it (never an ancestor that
        // would hand focus back to its own child).
        let at = widgets.indexOf(inner);
        if (at < 0)
          widgets.forEach((node, index) => {
            if (node.contains(inner)) at = index;
          });
        const back =
          (event.key === "ArrowLeft") !==
          (getComputedStyle(event.currentTarget).direction === "rtl");
        widgets[at + (back ? -1 : 1)]?.focus();
        return;
      }
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    }
    const rowId = origin.dataset.gridRow!;
    const isGroup = isLineRow(rowId);
    const key = isGroup ? resolved.key : origin.dataset.gridKey!;
    const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const rowAt = navRowIndex.get(rowId) ?? 0;
    // The header row also holds the trailing control; every other row has the columns alone.
    const keys = rowId === HEADER ? headerKeys : navKeys;
    const keyAt = Math.max(0, keys.indexOf(key));
    const mod = event.metaKey || event.ctrlKey;
    const placedColumn = placed.find((p) => p.key === key);
    const go = (row: number, col: number) => {
      const nextRow = navRows[Math.max(0, Math.min(row, navRows.length - 1))]!;
      const rowKeys = nextRow === HEADER ? headerKeys : navKeys;
      const wanted = keys[Math.max(0, Math.min(col, keys.length - 1))]!;
      const nextKey = rowKeys.includes(wanted)
        ? wanted
        : (rowKeys.at(-1) ?? wanted);
      event.preventDefault();
      // Cells mode: a plain move collapses the range onto the new cell.
      if (cellsMode) {
        if (rowNumbers.has(nextRow) && dataKeyIndex.has(nextKey))
          selection.select({ rowId: nextRow, colKey: nextKey });
        else selection.clear();
      }
      focusAt(nextRow, nextKey);
    };

    // Cells mode, on a data cell: ranges, clipboard keys, clear, fill, undo.
    const onDataCell =
      cellsMode && rowNumbers.has(rowId) && dataKeyIndex.has(key);
    if (onDataCell) {
      const arrows: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: isRtl ? "right" : "left",
        ArrowRight: isRtl ? "left" : "right",
      };
      const direction = arrows[event.key];
      if (event.shiftKey && direction && !mod && !event.altKey) {
        event.preventDefault();
        if (!selection.focus) selection.select({ rowId, colKey: key });
        const focus = selection.extend(direction);
        if (focus) focusAt(focus.rowId, focus.colKey);
        return;
      }
      if (event.key === " " && event.shiftKey) {
        event.preventDefault();
        selection.selectRow(rowId);
        return;
      }
      if (event.key === " " && event.ctrlKey) {
        event.preventDefault();
        selection.selectColumn(key);
        return;
      }
      if (mod && (event.key === "a" || event.key === "A")) {
        event.preventDefault();
        selection.selectAll();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        clearCells("Cleared");
        return;
      }
      if (mod && (event.key === "d" || event.key === "D")) {
        event.preventDefault();
        fillDown();
        return;
      }
      if (mod && (event.key === "z" || event.key === "Z")) {
        event.preventDefault();
        if (event.shiftKey) onRedo?.();
        else onUndo?.();
        return;
      }
      if (event.ctrlKey && (event.key === "y" || event.key === "Y")) {
        event.preventDefault();
        onRedo?.();
        return;
      }
      if (event.key === "Escape" && range && range.rows * range.columns > 1) {
        event.preventDefault();
        selection.select({ rowId, colKey: key });
        return;
      }
    }

    // The header row: sort, menu and resize live here.
    if (rowId === HEADER && placedColumn) {
      if (
        event.altKey &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
        onColumnResize &&
        placedColumn.column.resizable !== false
      ) {
        const next = columnResizeKeyWidth(
          event.key,
          event.shiftKey,
          placedColumn.width,
          { ...columnResizeBounds(placedColumn.column), rtl: isRtl },
        );
        event.preventDefault();
        if (next != null && next !== placedColumn.width) {
          resizeTo(key, next, true);
          announce(`${placedColumn.label} ${next} pixels`);
        }
        return;
      }
      if (
        (event.key === "F10" && event.shiftKey) ||
        event.key === "ContextMenu"
      ) {
        if (placedColumn.column.headerMenu) {
          event.preventDefault();
          setHeaderMenuKey(key);
        }
        return;
      }
      if (event.key === "Enter") {
        if (placedColumn.column.headerMenu) {
          event.preventDefault();
          setHeaderMenuKey(key);
        } else if (placedColumn.column.sortable) {
          event.preventDefault();
          handleSort(key, event.shiftKey);
        }
        return;
      }
    }

    switch (event.key) {
      case "ArrowDown":
        if (mod) return go(lastItemNav, keyAt);
        // Keyboard-continuous load-more: walking past the last row fetches the next page.
        if (rowAt === lastItemNav && rowAt > 0 && requestMore()) {
          event.preventDefault();
          return;
        }
        return go(rowAt + 1, keyAt);
      case "ArrowUp":
        if (mod) return go(firstItemNav || 0, keyAt);
        return go(rowAt - 1, keyAt);
      case "ArrowRight":
      case "ArrowLeft": {
        if (isGroup) return;
        const forward = (event.key === "ArrowRight") !== isRtl;
        if (mod) return go(rowAt, forward ? keys.length - 1 : 0);
        return go(rowAt, keyAt + (forward ? 1 : -1));
      }
      case "Home":
        if (mod) return go(firstItemNav || 0, 0);
        return go(rowAt, 0);
      case "End":
        if (mod) return go(lastItemNav, navKeys.length - 1);
        return go(rowAt, keys.length - 1);
      case "PageDown":
        if (rowAt === 0 || rowId === FOOTER) return;
        return go(Math.min(lastItemNav, rowAt + pageSize()), keyAt);
      case "PageUp":
        if (rowAt === 0 || rowId === FOOTER) return;
        return go(Math.max(firstItemNav || 0, rowAt - pageSize()), keyAt);
      default:
        break;
    }

    // A failed group page: Enter or Space retries through the button inside.
    if (rowId.startsWith(MORE_PREFIX)) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        origin.querySelector<HTMLElement>("button")?.click();
      }
      return;
    }

    // The summary row: the cell holds focus; Enter or Space opens its function picker.
    if (rowId === FOOTER) {
      if (event.key === "Enter" || event.key === " ") {
        const trigger = origin.querySelector<HTMLElement>(
          '[data-slot="select-trigger"]',
        );
        if (trigger) {
          event.preventDefault();
          trigger.click();
        }
      }
      return;
    }

    // Body cells: edit, type-to-edit, the cell menu.
    if (
      rowId === HEADER ||
      rowId === FOOTER ||
      isGroup ||
      key === SELECT ||
      !placedColumn
    )
      return;
    const column = placedColumn.column;
    if (
      (event.key === "F10" && event.shiftKey) ||
      event.key === "ContextMenu"
    ) {
      if (cellMenu) {
        event.preventDefault();
        openCellMenu(origin);
      }
      return;
    }
    // Opening the row (IN-04): Space on any of its cells, Enter on its primary cell (the row
    // header — F2 still edits that one).
    if (
      onRowOpen &&
      !mod &&
      !event.altKey &&
      !event.shiftKey &&
      (event.key === " " || (event.key === "Enter" && placedColumn.primary))
    ) {
      event.preventDefault();
      current.openRow(rowId, event);
      return;
    }
    // A cell's links and chips are reached from the cell: Alt+Enter (and, on a read-only cell,
    // Enter or F2) moves into its first widget, which shows its name as it takes focus.
    if (event.key === "Enter" && event.altKey && !mod) {
      const first = cellWidgets(origin)[0];
      if (first) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (!column.editable) {
      if (event.key === "Enter" || event.key === "F2") {
        const first = cellWidgets(origin)[0];
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }
    if (event.key === "Enter" || event.key === "F2") {
      event.preventDefault();
      setEditingState({ rowId, key });
      announce(`Editing ${placedColumn.label}`);
      return;
    }
    if (isTypingKey(event)) {
      const type = column.editable.type;
      event.preventDefault();
      setEditingState({
        rowId,
        key,
        // Every editor that takes text starts from the key; the date and select popovers don't.
        seed: type === "date" || type === "select" ? undefined : event.key,
      });
      announce(`Editing ${placedColumn.label}`);
    }
  };

  // The frozen edge's shadow: an attribute set only when it changes (G2: re-setting it on every
  // scroll event invalidated style for the whole grid and was the hottest frame). The scroll
  // handler never reads layout: a virtualiser's own handler has just committed the newly mounted
  // cells, so reading `scrollLeft` there forced their style and layout synchronously (G1.11:
  // ~6 ms of every horizontal tick). Once a frame, it takes the offset the column virtualiser
  // already read — it observes the viewport whether or not columns window.
  React.useEffect(() => {
    if (!viewport || frozenPlaced.length === 0) return;
    let scrolled = viewport.scrollLeft !== 0;
    viewport.toggleAttribute("data-scrolled-x", scrolled);
    let frame = 0;
    const update = () => {
      frame = 0;
      const next =
        (columnVirtualizer.scrollOffset ?? viewport.scrollLeft) !== 0;
      if (next !== scrolled) {
        scrolled = next;
        viewport.toggleAttribute("data-scrolled-x", next);
      }
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [viewport, frozenPlaced.length, columnVirtualizer]);

  // More columns past the end: a quiet trailing edge shadow on the frame while the viewport can
  // still scroll sideways (an embedded block's wide table on a phone). The extent is read when the
  // viewport or its content resizes, the offset once a frame from the column virtualiser — the
  // scroll handler itself reads no layout, as above.
  const [frame, setFrame] = React.useState<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!viewport || !frame) return;
    let extent = 0;
    let more: boolean | null = null;
    let raf = 0;
    const update = () => {
      raf = 0;
      const offset = Math.abs(
        columnVirtualizer.scrollOffset ?? viewport.scrollLeft,
      );
      const next = extent - offset > 1;
      if (next !== more) {
        more = next;
        frame.toggleAttribute("data-more-x", next);
      }
    };
    const measure = () => {
      extent = viewport.scrollWidth - viewport.clientWidth;
      update();
    };
    const onScroll = () => {
      if (raf === 0) raf = requestAnimationFrame(update);
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(viewport);
    if (viewport.firstElementChild)
      observer?.observe(viewport.firstElementChild);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer?.disconnect();
      viewport.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [viewport, frame, columnVirtualizer]);

  // ---- render --------------------------------------------------------------
  /** A closed function picker hands focus back to its cell, which roves. */
  const refocusFooter = (key: string) => {
    requestAnimationFrame(() => {
      const cell = nodes.current.get(nodeKey(FOOTER, key));
      const focused = document.activeElement;
      // Not when focus has moved on (Tab out of the open picker): only back from the popup.
      if (
        !cell ||
        (focused instanceof HTMLElement &&
          focused !== document.body &&
          !cell.contains(focused) &&
          !focused.closest('[data-slot="select-content"]'))
      )
        return;
      cell.focus();
    });
  };
  // The header and summary cells' actions: stable, reading the latest state (see `GridEdgeActions`).
  const edgeCurrent = {
    sort: handleSort,
    resize: resizeTo,
    autoFit,
    summaryClosed: refocusFooter,
  };
  const edgeLatest = React.useRef(edgeCurrent);
  React.useLayoutEffect(() => {
    edgeLatest.current = edgeCurrent;
  });
  const edgeActions = React.useMemo<GridEdgeActions<T>>(
    () => ({
      sort: (key, additive) => edgeLatest.current.sort(key, additive),
      setMenuOpen: (key, open) => setHeaderMenuKey(open ? key : null),
      resize: (key, width, commit) =>
        edgeLatest.current.resize(key, width, commit),
      autoFit: (p) => edgeLatest.current.autoFit(p),
      summaryClosed: (key) => edgeLatest.current.summaryClosed(key),
    }),
    [],
  );
  const headerCell = (p: PlacedColumn<T>) => {
    const entryIndex = activeSort.findIndex((entry) => entry.key === p.key);
    const entry = entryIndex === -1 ? null : activeSort[entryIndex]!;
    const reorderable = onColumnReorder != null && p.offset == null;
    const item = reorderable ? reorder.getItemProps("columns", p.key) : null;
    return (
      <GridHeadCell
        key={p.key}
        placed={p}
        fixed={fixed}
        direction={entry?.direction ?? null}
        order={entry && activeSort.length > 1 ? entryIndex + 1 : undefined}
        tabStop={resolved.rowId === HEADER && tabKey === p.key}
        menuOpen={headerMenuKey === p.key}
        resizable={
          fixed && onColumnResize != null && p.column.resizable !== false
        }
        actions={edgeActions}
        itemRef={item?.ref}
        handleRef={
          reorderable ? reorder.getHandleProps("columns", p.key).ref : undefined
        }
        dragging={item?.["data-dragging"] != null}
        dropEdge={item?.["data-drop-edge"]}
        dragPending={item?.["data-drag-pending"] != null}
        openSlot={p.primary && openable}
        sortLocked={sortLocked}
      />
    );
  };

  const headerRow = (
    <tr aria-rowindex={1} className="border-b">
      {selectable ? (
        <SelectAllHead
          role="columnheader"
          aria-colindex={1}
          data-grid-row={HEADER}
          data-grid-key={SELECT}
          controlTabIndex={
            resolved.rowId === HEADER && tabKey === SELECT ? 0 : -1
          }
          controlRef={(node: HTMLElement | null) =>
            api.register(HEADER, SELECT, node)
          }
          onFocus={() => api.focused(HEADER, SELECT)}
          className={cn(selectOffset != null && "sticky z-30 bg-background")}
          style={stickyStyle(selectOffset)}
          checked={allSelected}
          indeterminate={indeterminate}
          onToggle={toggleAll}
          disabled={loading || visibleIds.length === 0}
        />
      ) : null}
      {w.frozen.map(headerCell)}
      {fixed ? <th aria-hidden="true" className="p-0" /> : null}
      {w.center.map(headerCell)}
      {fixed ? <th aria-hidden="true" className="p-0" /> : null}
      {headerTrailing ? (
        <th
          data-slot="data-grid-head-trailing"
          className="h-10 px-1 align-middle"
        >
          {headerTrailing({
            tabIndex: resolved.rowId === HEADER && tabKey === TRAILING ? 0 : -1,
            ref: registerTrailing,
            onFocus: focusTrailing,
            "data-grid-row": HEADER,
            "data-grid-key": TRAILING,
          })}
        </th>
      ) : null}
      {fixed ? (
        <th aria-hidden="true" data-slot="data-grid-filler" className="p-0" />
      ) : null}
    </tr>
  );

  const summaryLoading = new Set(summaryRow?.loading ?? []);
  const footerCell = (p: PlacedColumn<T>) => (
    <GridFooterCell
      key={p.key}
      placed={p}
      tabStop={resolved.rowId === FOOTER && tabKey === p.key}
      summaryRow={summaryRow}
      loading={summaryLoading.has(p.key)}
      actions={edgeActions}
    />
  );

  const summary = summaryRow ? (
    <tfoot
      data-slot="data-grid-summary"
      className="sticky bottom-0 z-20 border-t bg-background"
    >
      <TableRow aria-rowindex={footerRowIndex} className="hover:bg-none">
        {selectable ? (
          <TableCell
            aria-colindex={1}
            data-grid-row={FOOTER}
            data-grid-key={SELECT}
            ref={(node: HTMLElement | null) =>
              api.register(FOOTER, SELECT, node)
            }
            tabIndex={resolved.rowId === FOOTER && tabKey === SELECT ? 0 : -1}
            onFocus={() => api.focused(FOOTER, SELECT)}
            className={cn(
              "bg-background",
              selectOffset != null && "sticky z-30",
            )}
            style={stickyStyle(selectOffset)}
          />
        ) : null}
        {w.frozen.map(footerCell)}
        {fixed ? <td aria-hidden="true" className="bg-background p-0" /> : null}
        {w.center.map(footerCell)}
        {fixed ? <td aria-hidden="true" className="bg-background p-0" /> : null}
        {headerTrailing ? (
          <td aria-hidden="true" className="bg-background p-0" />
        ) : null}
        {fixed ? <td aria-hidden="true" className="bg-background p-0" /> : null}
      </TableRow>
    </tfoot>
  ) : null;

  // A sorted column that revelation merged or hid (or the picker switched off)
  // takes its header's arrow and `aria-sort` with it; state the order instead.
  const sortSummary = offscreenSortSummary(activeSort, ordered, visibleColumns);
  const rowVirtual = virtualize && pagedMode == null;
  const bodyTabStop =
    resolved.rowId !== HEADER && resolved.rowId !== FOOTER
      ? { rowId: resolved.rowId, key: tabKey }
      : null;

  const gridTable = (
    // DS-68: the grid owns roving focus, so truncated text and RelativeTime in its cells are
    // not extra tab stops. It owns the live region too: a cell's save status is spoken through
    // the grid's one `Announcer`, not a region per mounted cell (`EditableCell` opts in).
    <TruncationFocusProvider focusable={false}>
      <AnnouncerScope announce={announce}>
        <table
          ref={setTableNode}
          data-slot="table"
          role="grid"
          aria-label={ariaLabel}
          aria-describedby={
            [
              hiddenColumns.length > 0 ? hiddenHintId : null,
              sortSummary != null ? sortHintId : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-rowcount={ariaRowTotal}
          aria-colcount={ariaColTotal}
          aria-busy={loading || undefined}
          data-grid-id={gridId}
          data-layout={fixed ? "fixed" : "auto"}
          onKeyDown={handleGridKeyDown}
          onKeyDownCapture={handleGridKeyDownCapture}
          onFocusCapture={handleGridFocus}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          className={cn(
            "group/grid caption-bottom text-sm",
            // A drag or Shift+click extends the cell range, never a text selection; the cell
            // being edited keeps its own.
            cellsMode && "select-none [&_[data-editing]]:select-text",
            fixed ? "table-fixed" : "w-full",
          )}
          // FIXED: the columns' own widths, and never narrower than the viewport — the filler
          // track takes the rest (DS-1).
          style={fixed ? { width: tableWidth, minWidth: "100%" } : undefined}
        >
          {fixed ? (
            <colgroup>
              {selectable ? (
                <col style={{ width: SELECTION_COLUMN_WIDTH }} />
              ) : null}
              {w.frozen.map((p) => (
                <col key={p.key} style={{ width: p.width }} />
              ))}
              <col style={{ width: w.padStart }} />
              {w.center.map((p) => (
                <col key={p.key} style={{ width: p.width }} />
              ))}
              <col style={{ width: w.padEnd }} />
              {headerTrailing ? (
                <col style={{ width: TRAILING_WIDTH }} />
              ) : null}
              <col data-slot="data-grid-filler-col" />
            </colgroup>
          ) : null}
          <thead
            data-slot="table-header"
            className={cn(
              (maxHeight != null || fixed) && "sticky top-0 z-20 bg-background",
            )}
          >
            {headerRow}
          </thead>

          {loading ? (
            <TableBody>
              {fixed ? (
                <FixedSkeletonRows w={w} rows={loadingRows} />
              ) : (
                <SkeletonRows
                  columns={visibleColumns}
                  rows={loadingRows}
                  selectable={selectable}
                  slot="data-grid-skeleton-row"
                />
              )}
            </TableBody>
          ) : !hasItems && !hasRows ? (
            <TableBody>
              <EmptyRow
                colSpan={w.span}
                slot="data-grid-empty-row"
                // Held to the viewport, so a wide grid's empty or error state is centred where
                // the reader is and never clipped by the columns scrolled off (UX-10).
                viewportWidth={containerWidth ?? undefined}
              >
                {emptyState}
              </EmptyRow>
            </TableBody>
          ) : (
            <GridBody
              viewport={viewport}
              items={items}
              w={w}
              virtualize={rowVirtual}
              headerPx={HEADER_PX}
              footerPx={summaryRow ? HEADER_PX : 0}
              tabStop={bodyTabStop}
              editing={editing}
              selected={selected}
              cellStatus={cellStatus}
              sort={activeSort}
              rowNumbers={rowNumbers}
              cellsMode={cellsMode}
              range={cellsMode ? range : null}
              fill={fillRows}
              remoteChanges={remoteChanges}
              fillEnabled={cellsMode && onFill != null}
              ariaRowIndexBase={ariaRowIndexBase}
              onVirtualizer={onVirtualizer}
              onCommit={onBodyCommit}
              activeRowId={activeRowId}
              getRowLabel={getRowLabel}
            />
          )}
          {/* The next page loading: skeleton rows the height of real ones, appended in place. */}
          {!loading && hasRows && loadMore?.hasMore && loadMore.loading ? (
            <TableBody data-slot="data-grid-more">
              {fixed ? (
                <FixedSkeletonRows w={w} rows={3} />
              ) : (
                <SkeletonRows
                  columns={visibleColumns}
                  rows={3}
                  selectable={selectable}
                  slot="data-grid-skeleton-row"
                />
              )}
            </TableBody>
          ) : null}
          {summary}
        </table>
      </AnnouncerScope>
    </TruncationFocusProvider>
  );

  const viewportInner = (
    <>
      {gridTable}
      {/* Inside the scroll viewport, so a `maxHeight` grid loads as its own body scrolls. */}
      {loadMore ? (
        <div className="sticky start-0 w-fit max-w-full">
          <LoadMore
            {...loadMore}
            onLoadMore={() => {
              // A retry after an error bypasses the guard; the sentinel goes through it.
              if (loadMore.error != null && loadMore.error !== false)
                loadMore.onLoadMore();
              else requestMore();
            }}
            skeleton={null}
          />
        </div>
      ) : null}
    </>
  );

  const viewportProps = {
    ref: setViewport,
    "data-slot": "grid-viewport",
    className: cn(
      // `overscroll-x-contain`: a sideways pan that reaches the end stops there instead of moving
      // the page (vertical pans still reach it).
      "relative overflow-auto overscroll-x-contain",
      maxHeight != null && "max-h-[calc(var(--data-grid-max-height))]",
      // Filling: as tall as the room, however few the rows.
      fill && maxHeight != null && "min-h-[calc(var(--data-grid-max-height))]",
      endSpacerPx > 0 &&
        "after:block after:h-(--data-grid-end-spacer) after:content-['']",
    ),
    // Native focus scrolling keeps the focused cell clear of the sticky header, the summary row
    // and the frozen columns.
    style: {
      scrollPaddingTop: HEADER_PX,
      scrollPaddingBottom: summaryRow ? HEADER_PX : undefined,
      scrollPaddingInlineStart: frozenWidth || undefined,
    } as React.CSSProperties,
  };

  return (
    <GridApiContext.Provider value={api}>
      <div
        ref={setRoot}
        data-slot="data-grid"
        // Inside a page's prose (an embedded block): the prose recipe's table rules stay out.
        data-prose="off"
        data-layout-mode={cardMode ? "cards" : "grid"}
        data-embedded={embedded ? "" : undefined}
        data-read-only={readOnly ? "" : undefined}
        // An embedded block is not part of the text around it (a page editor's own node).
        contentEditable={embedded ? false : undefined}
        // Its own stacking context: the sticky header, summary row and frozen columns layer
        // inside the grid and never over the page's floating parts (an ActionBar at z-10).
        className={cn(
          "isolate flex w-full min-w-0 flex-col",
          // Embedded: one framed block — header, rows and footer ruled from each other.
          embedded
            ? "overflow-hidden rounded-lg border border-border"
            : "gap-3",
          className,
        )}
        // Viewport height flows through a custom property (contract-clean).
        style={
          maxHeight || endSpacerPx > 0
            ? ({
                ["--data-grid-max-height"]: maxHeight,
                ["--data-grid-end-spacer"]:
                  endSpacerPx > 0 ? `${endSpacerPx}px` : undefined,
              } as React.CSSProperties)
            : undefined
        }
      >
        {(toolbar != null ||
          columnPicker ||
          hiddenColumns.length > 0 ||
          sortSummary != null) && (
          <div
            data-slot="data-grid-toolbar"
            className={cn(
              "flex min-w-0 flex-wrap items-center justify-between gap-2",
              embedded && "border-b border-border",
            )}
          >
            <div className="min-w-0 flex-1">{toolbar}</div>
            {hiddenColumns.length > 0 ? (
              // Revelation dropped something. Saying so is the whole point: a
              // column that vanishes with no affordance is silent data loss. The
              // grid is described by this line, so it is heard with the grid.
              <span
                id={hiddenHintId}
                data-slot="data-grid-hidden-hint"
                className="text-xs text-muted-foreground"
              >
                {hiddenColumns.length} column
                {hiddenColumns.length === 1 ? "" : "s"} hidden
              </span>
            ) : null}
            {sortSummary != null ? (
              <span
                id={sortHintId}
                data-slot="data-grid-sort-hint"
                className="text-xs text-muted-foreground"
              >
                {sortSummary}
              </span>
            ) : null}
            {columnPicker ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm">
                      <Columns3 /> Columns
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  {ordered.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.key}
                      checked={visibility[column.key] !== false}
                      onCheckedChange={(checked) =>
                        commitVisibility({
                          ...visibility,
                          [column.key]: checked === true,
                        })
                      }
                    >
                      {columnLabel(column)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        )}

        {cardMode ? (
          <>
            {summaryRow && !loading ? (
              <GridCardsSummary summaryRow={summaryRow} columns={cardColumns} />
            ) : null}
            <GridCards
              items={items}
              // Every shown column, before the table's revelation merged or dropped any: a card
              // has room for its fields whatever the grid would have fitted.
              columns={cardColumns}
              fields={cardFields}
              selectable={selectable}
              selected={selected}
              onToggleRow={toggleRow}
              onToggleGroup={api.toggleGroup}
              onOpen={onRowOpen ? api.openRow : undefined}
              activeRowId={activeRowId}
              getRowLabel={getRowLabel}
              rowNumbers={rowNumbers}
              loading={loading}
              loadingRows={loadingRows}
              emptyState={emptyState}
              ariaLabel={ariaLabel}
              untitledLabel={untitledLabel}
            />
            {loadMore ? <LoadMore {...loadMore} /> : null}
          </>
        ) : (
          <div
            ref={setFrame}
            data-slot="data-grid-viewport-frame"
            className="relative flex min-h-0 min-w-0 flex-col"
          >
            {cellMenu ? (
              <ContextMenu
                onOpenChange={(open) => {
                  if (open) return;
                  // Back to the cell the menu was for, once the popup lets go of focus.
                  const target = menuTarget;
                  requestAnimationFrame(() => {
                    if (!target) return;
                    const focused = document.activeElement;
                    if (
                      focused instanceof HTMLElement &&
                      focused !== document.body &&
                      viewport?.contains(focused) !== true
                    )
                      return;
                    nodes.current
                      .get(nodeKey(target.rowId, target.key))
                      ?.focus();
                  });
                }}
              >
                <ContextMenuTrigger
                  {...viewportProps}
                  // A right click and a long press (Base UI opens that one from its own touch timer,
                  // with no contextmenu event) both resolve the cell first.
                  onContextMenu={claimMenu}
                  onTouchStart={claimMenu}
                >
                  {viewportInner}
                </ContextMenuTrigger>
                <ContextMenuContent>
                  {menuTarget
                    ? cellMenu(menuTarget.rowId, menuTarget.key)
                    : null}
                </ContextMenuContent>
              </ContextMenu>
            ) : (
              <div {...viewportProps}>{viewportInner}</div>
            )}
            {/* More columns past the end: a quiet edge shadow, like the frozen edge's. */}
            <span
              aria-hidden
              data-slot="data-grid-more-x"
              className="pointer-events-none absolute inset-y-0 end-0 z-30 w-3 bg-linear-to-l from-foreground/10 to-transparent opacity-0 transition-opacity duration-fast in-data-more-x:opacity-100 rtl:bg-linear-to-r"
            />
          </div>
        )}

        {pagedMode ? <CursorPager {...pagedMode} /> : null}
        {isBlockFooter(footer) ? (
          <GridBlockFooter footer={footer} readOnly={readOnly} />
        ) : footer != null ? (
          <div
            data-slot="data-grid-footer"
            className={cn(embedded && "border-t border-border")}
          >
            {footer}
          </div>
        ) : null}
        {selectable && selectionActions && selected.size > 0 ? (
          <SelectionBarSpacer slot="data-grid-selection-spacer" />
        ) : null}
        {selectable && selectionActions ? (
          <SelectionActionBar
            slot="data-grid-selection-bar"
            selected={selected}
            onClear={clearSelection}
            actions={selectionActions}
            containerRef={rootRef}
            label={selectionLabel}
            secondaryActions={selectionSecondaryActions}
            moreLabel={selectionMoreLabel}
            clearLabel={clearSelectionLabel}
            barLabel={selectionBarLabel}
          />
        ) : null}
        <Announcer />
        <reorder.Announcer />
      </div>
    </GridApiContext.Provider>
  );
}

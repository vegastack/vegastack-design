// @vegastack data-grid@0.23.6 sha256-+tGE7bN96sCQ6MqN70nLjbwwYbGLw27l8XlE6rdFqww=

"use client";

import * as React from "react";
import { Columns3 } from "lucide-react";
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
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  columnCellClass,
  cycleSort,
  EmptyRow,
  mergedValueClass,
  offscreenSortSummary,
  revealColumns,
  SELECTED_ROW_CLASS,
  SELECTION_COLUMN_WIDTH,
  SelectAllHead,
  SelectionCell,
  SectionToggle,
  SkeletonRows,
  SortableHead,
  useContainerWidth,
  useControlledState,
  useRowSelection,
  type DataTableColumnLayout,
  type GroupState,
} from "@/components/ui/data-table-parts";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EditableCell,
  type EditableCellEditor,
} from "@/components/ui/editable-cell";
import type { AutoSaveStatus } from "@/components/ui/auto-save-input";
import {
  LoadMore,
  type LoadMoreProps,
  type LoadMoreState,
} from "@/components/ui/load-more";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { TruncationFocusProvider } from "@/components/ui/truncated-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ---
`DataGrid` is the commissioned full-parity sibling `DataList`'s docs always promised —
everything the presentational core declares out of scope that is still PRESENTATIONAL:
multi-key sort, column visibility + ordering, responsive column revelation, row
grouping with collapsible sections, keyboard-continuous load-more, opt-in row
virtualization, and the APG grid keyboard layer with inline cell editing. It still
does NOT own data fetching, filter state, view persistence, or the mutation — G7
holds; `onCellCommit` is a request and `cellStatus` is the host's word on it.

Engine split (the D1/D2 sanction): TanStack Table computes the SORTED ROW MODEL
(multi-key, typed comparators) and nothing else — column visibility and column
order are this file's own state, applied before the engine sees a column;
TanStack Virtual measures the windowed rows behind the `virtualize` flag. Neither
touches DOM or focus — the APG keyboard layer (roving gridcell tabindex, Enter/F2
edit mode with grid-nav suspension, Escape restore) is this file's own, because no
library ships it. Grouping is computed here over the sorted leaves (a section per
group value, collapsible, its own <tbody> — valid HTML where a Collapsible div
between tbody and tr is not).

Two behaviours are deliberately DIFFERENT from DataList, documented for migrators:
- Cells render as ELEMENTS (`<Cell/>`), so a `render` implementation may use hooks —
  DataList invokes `col.render` as a plain function and cannot allow that.
- The grid SORTS ITS OWN DATA (that is what the row-model engine is for); DataList
  only signals intent. `sort`/`onSortChange` stay controllable for URL state.

Deliberately NOT done here:
- No filter UI (FilterBuilder + the host), no pagination UI (the `footer` slot), no
  saved views/URL state (host, G7), no CSV export, no aggregation footers.
- No column resize, and no built-in reorder affordance — `columnOrder` APPLIES a
  host-owned order (a settings surface); visibility ships with its picker.
- Virtualization and grouping are mutually exclusive (documented): windowing grouped
  section rows adds complexity no current consumer needs.
--- */

/* ---
The engine boundary. TanStack Table v9 requires an EXPLICIT feature set (v8
bundled every feature into every table), which makes the sanctioned exception's
promise checkable rather than asserted: the only feature registered here is row
sorting. Column visibility, column order, row selection, grouping, and the whole
APG keyboard layer are absent from this list because they are computed in this
file — v9 ships `columnVisibilityFeature`, `columnOrderingFeature` and
`rowSelectionFeature`, and none of them is adopted.

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

/** A column definition. */
export interface DataGridColumn<T> extends DataTableColumnLayout {
  /** Header label. */
  header: React.ReactNode;
  /**
   * Cell content. Rendered as a component ELEMENT (hooks are safe here —
   * unlike `DataList.render`, which is invoked as a plain function).
   * Ignored when the column is `editable` — the editor owns that cell.

   * @default undefined
   */
  render?: (row: T, context: DataGridCellContext) => React.ReactNode;
  /**
   * Sort/group value for the row. Defaults to reading `row[key]`.

   * @default undefined
   */
  accessor?: (row: T) => unknown;
  /**
   * Header click sorts by this column; shift-click adds it as a secondary key.
   * @default false
   */
  sortable?: boolean;
  /**
   * Open this editor on Enter/F2 while the cell has grid focus. Uses
   * `EditableCell` in `focusMode="managed"` — the grid owns reachability, the
   * cell owns the editor and its async status.

   * @default undefined
   */
  editable?: EditableCellEditor;
  /**
   * Group rows into collapsible sections by this column's value. One grouping
   * column at most; grouping disables `virtualize`.
   * @default false
   */
  group?: boolean;
}

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
  /** Column definitions, left to right (base order; see `columnOrder`). */
  columns: DataGridColumn<T>[];
  /** Row data. The grid sorts it itself (the row-model engine). */
  data: T[];
  /** Stable, unique row id — selection and edit identity. */
  getRowId: (row: T) => string;
  /**
   * Controlled multi-sort (priority order). Omit for uncontrolled.

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
   * @default true
   */
  columnPicker?: boolean;
  /**
   * Column order (array of keys), applied left to right. Controlled-only:
   * the grid ships no reorder affordance — the host owns it (a settings
   * surface). Omit to use the declared column order.

   * @default undefined
   */
  columnOrder?: string[];
  /**
   * Controlled collapsed state per group value. Omit for uncontrolled.

   * @default undefined
   */
  groupState?: GroupState;
  /**
   * Fired when a group toggles.

   * @default undefined
   */
  onGroupStateChange?: (state: GroupState) => void;
  /**
   * Commit an inline cell edit. Return a promise to engage the async layer;
   * rejection reverts and announces (EditableCell's contract).

   * @default undefined
   */
  onCellCommit?: (row: T, key: string, value: string) => void | Promise<void>;
  /**
   * The host's word on a cell write in flight (`AutoSaveStatus`). Omit to let
   * each cell derive status from the `onCellCommit` promise.

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
   * Keyset paging: the shared `LoadMore` footer below the grid, plus a
   * keyboard-continuous trigger when ArrowDown moves past the last row.
   * `endLabel` is shown once `hasMore` is false (nothing by default).
   * @default undefined
   */
  loadMore?: DataGridLoadMoreProps;
  /**
   * Window the rows with TanStack Virtual (needs a fixed-height viewport via
   * `maxHeight`). Ignored while a `group` column exists.
   * @default false
   */
  virtualize?: boolean;
  /**
   * Scroll-viewport max height as a CSS length — required for `virtualize`,
   * useful alone for sticky headers. Flows to the Table container through
   * `--data-grid-max-height`.

   * @default undefined
   */
  maxHeight?: string;
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
  /** Host slot below the table.
   * @default undefined
   */
  footer?: React.ReactNode;
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
}

// Stable empty defaults. The uncontrolled initial value must be referentially
// stable across renders: the sorted row model memoizes on `[sorting, rows]` by
// identity, so a fresh `[]` per render would re-sort every render and invalidate
// every memo downstream of it.
const EMPTY_SORT: DataGridSort[] = [];
const EMPTY_VISIBILITY: Record<string, boolean> = {};
const EMPTY_GROUPS: GroupState = {};

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

/**
 * `DataGrid<T>` — the full-parity data grid: multi-key sort (shift-click),
 * column visibility picker + host-applied `columnOrder`,
 * responsive column revelation (`minWidth` + per-column `mobile` posture,
 * `merge` stacking into the primary cell), collapsible row grouping (one
 * `<tbody>` per section), keyboard-continuous load-more, opt-in row
 * virtualization, row selection, and the APG grid keyboard layer: roving
 * `gridcell` focus, <kbd>Enter</kbd>/<kbd>F2</kbd> opening the cell editor
 * (suspending grid navigation) and <kbd>Escape</kbd> restoring it.
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
 */
export function DataGrid<T>({
  columns,
  data,
  getRowId,
  sort,
  onSortChange,
  maxSortKeys = 2,
  columnVisibility,
  onColumnVisibilityChange,
  columnPicker = true,
  columnOrder,
  groupState,
  onGroupStateChange,
  onCellCommit,
  cellStatus,
  selectable = false,
  selectedIds,
  onSelectionChange,
  loadMore,
  virtualize = false,
  maxHeight,
  loading = false,
  emptyState,
  toolbar,
  footer,
  "aria-label": ariaLabel = "Data grid",
  className,
  ref,
}: DataGridProps<T>) {
  // ---- controlled-optional state (the shared house idiom) ------------------
  const [activeSort, commitSort] = useControlledState<DataGridSort[]>(
    sort,
    EMPTY_SORT,
    onSortChange,
  );
  const [visibility, commitVisibility] = useControlledState<
    Record<string, boolean>
  >(columnVisibility, EMPTY_VISIBILITY, onColumnVisibilityChange);
  const [groups, commitGroups] = useControlledState<GroupState>(
    groupState,
    EMPTY_GROUPS,
    onGroupStateChange,
  );

  // Column order is CONTROLLED-ONLY: the grid applies it, the host owns the
  // reorder affordance (a settings surface). No internal order state exists,
  // so there is deliberately no onColumnOrderChange.
  const order = columnOrder ?? null;

  // ---- responsive column revelation ---------------------------------------
  // The measurement and the partition are shared with DataList
  // (`data-table-parts`); the grid keeps a RefObject too, because the
  // virtualiser reads its scroll element from it.
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [measureRef, containerWidth] = useContainerWidth();
  const setContainer = React.useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      measureRef(node);
    },
    [measureRef],
  );

  const ordered = React.useMemo(() => {
    if (!order) return columns;
    const byKey = new Map(columns.map((c) => [c.key, c]));
    const seen = order
      .map((key) => byKey.get(key))
      .filter((c): c is DataGridColumn<T> => c !== undefined);
    const missing = columns.filter((c) => !order.includes(c.key));
    return [...seen, ...missing];
  }, [columns, order]);

  /**
   * The platform-harvested revelation (`revealColumns`): `visible` always
   * stays, `merge` overflow stacks into the primary cell, and only an explicit
   * `hidden` actually disappears — where it is COUNTED, so the toolbar can say
   * so. Data is never silently lost.
   */
  const { visibleColumns, mergedColumns, hiddenColumns } = React.useMemo(
    () =>
      revealColumns(
        ordered.filter((column) => visibility[column.key] !== false),
        containerWidth,
        selectable ? SELECTION_COLUMN_WIDTH : 0,
      ),
    [ordered, visibility, containerWidth, selectable],
  );

  // ---- sorting via the TanStack row model ----------------------------------
  const columnHelper = React.useMemo(
    () => createColumnHelper<GridFeatures, EngineRow>(),
    [],
  );
  const tanColumns = React.useMemo<
    ColumnDef<GridFeatures, EngineRow, unknown>[]
  >(
    () =>
      columns.map((column) =>
        columnHelper.accessor(
          (row) =>
            column.accessor
              ? column.accessor(row as T)
              : (row as Record<string, unknown>)[column.key],
          { id: column.key },
        ),
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
  // `onSortingChange` is wired. v9 removed the `getCoreRowModel()` option (the
  // core model is automatic) and `manualPagination`, which lives on
  // `rowPaginationFeature` and was already inert here.
  const table = useTable<GridFeatures, EngineRow>({
    features: gridFeatures,
    data: data as unknown as EngineRow[],
    columns: tanColumns,
    state: { sorting: sortingState },
    enableSortingRemoval: true,
    getRowId: (row) => getRowId(row as T),
  });
  const sortedRows = table.getSortedRowModel().rows as unknown as GridRow<T>[];

  // ---- grouping over the sorted leaves ------------------------------------
  const groupColumn = columns.find((column) => column.group);
  const sections = React.useMemo(() => {
    if (!groupColumn)
      return [
        {
          id: null as string | null,
          label: null as React.ReactNode,
          rows: sortedRows,
        },
      ];
    const map = new Map<string, typeof sortedRows>();
    for (const row of sortedRows) {
      const value = groupColumn.accessor
        ? groupColumn.accessor(row.original)
        : (row.original as Record<string, unknown>)[groupColumn.key];
      const id = String(value ?? "—");
      const bucket = map.get(id);
      if (bucket) bucket.push(row);
      else map.set(id, [row]);
    }
    return [...map.entries()].map(([id, rows]) => ({
      id,
      label: id,
      rows,
    }));
  }, [groupColumn, sortedRows]);

  const flatVisibleRows = React.useMemo(
    () =>
      sections.flatMap((section) =>
        section.id !== null && groups[section.id] === "collapsed"
          ? []
          : section.rows,
      ),
    [sections, groups],
  );

  // ---- selection (the shared preserved-off-view semantics) -----------------
  const visibleIds = React.useMemo(
    () => flatVisibleRows.map((row) => row.id),
    [flatVisibleRows],
  );
  const { selected, allSelected, indeterminate, toggleAll, toggleRow } =
    useRowSelection({ rowIds: visibleIds, selectedIds, onSelectionChange });

  // ---- ARIA geometry -------------------------------------------------------
  // aria-rowindex must count EVERY DOM row (header, group rows, data rows) or
  // AT announces "row 3 of 4" over a 6-row grid; aria-colcount conveys the
  // FULL declared column set with per-cell indices in that set, so hidden
  // columns read as gaps rather than being erased.
  const { ariaRowIndexById, ariaGroupRowIndex, ariaRowTotal } =
    React.useMemo(() => {
      const byId = new Map<string, number>();
      const byGroup = new Map<string, number>();
      let running = 1; // the header row
      for (const section of sections) {
        if (section.id !== null) {
          running += 1;
          byGroup.set(section.id, running);
        }
        const collapsed =
          section.id !== null && groups[section.id] === "collapsed";
        if (collapsed) continue;
        for (const row of section.rows) {
          running += 1;
          byId.set(row.id, running);
        }
      }
      return {
        ariaRowIndexById: byId,
        ariaGroupRowIndex: byGroup,
        ariaRowTotal: running,
      };
    }, [sections, groups]);
  const ariaColIndexByKey = React.useMemo(() => {
    const map = new Map<string, number>();
    ordered.forEach((column, index) => {
      map.set(column.key, index + (selectable ? 1 : 0) + 1);
    });
    return map;
  }, [ordered, selectable]);
  const ariaColTotal = ordered.length + (selectable ? 1 : 0);

  // ---- virtualization (flag; exclusive with grouping) ----------------------
  const canVirtualize = virtualize && !groupColumn;
  const rowVirtualizer = useVirtualizer({
    count: canVirtualize ? flatVisibleRows.length : 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 40,
    // Real heights via measureElement — a merged mobile stack or an open
    // editor is taller than the estimate, and windowed offsets must follow.
    getItemKey: (index) => flatVisibleRows[index]?.id ?? index,
    overscan: 8,
  });

  // ---- the APG grid keyboard layer (pass 2) --------------------------------
  const gridId = React.useId();
  const hiddenHintId = React.useId();
  const sortHintId = React.useId();
  const colCount = visibleColumns.length + (selectable ? 1 : 0);
  const [activeCell, setActiveCell] = React.useState<{
    row: number;
    col: number;
  }>({ row: 0, col: 0 });
  // The roving coordinate is CLAMPED against what is actually rendered: if
  // the active column is hidden or the data shrinks, the tab stop must land
  // on a real cell — otherwise the grid body becomes keyboard-unreachable.
  const clampedActive = {
    row: Math.max(0, Math.min(activeCell.row, flatVisibleRows.length - 1)),
    col: Math.max(0, Math.min(activeCell.col, colCount - 1)),
  };
  const [editingCell, setEditingCell] = React.useState<{
    rowId: string;
    key: string;
  } | null>(null);
  const { announce, Announcer } = useAnnouncer();
  const cellRefs = React.useRef(new Map<string, HTMLElement>());
  const cellKey = (row: number, col: number) => `${row}:${col}`;
  const loadMoreFired = React.useRef(false);
  const dataLength = data.length;
  React.useEffect(() => {
    loadMoreFired.current = false;
  }, [dataLength, loadMore?.loading]);

  const focusCell = React.useCallback(
    (row: number, col: number) => {
      const maxRow = flatVisibleRows.length - 1;
      const clampedRow = Math.max(0, Math.min(row, maxRow));
      const clampedCol = Math.max(0, Math.min(col, colCount - 1));
      setActiveCell({ row: clampedRow, col: clampedCol });
      cellRefs.current.get(cellKey(clampedRow, clampedCol))?.focus();
    },
    [flatVisibleRows.length, colCount],
  );

  const columnAt = (col: number): DataGridColumn<T> | undefined =>
    visibleColumns[selectable ? col - 1 : col];

  const handleGridKeyDown = (event: React.KeyboardEvent) => {
    // Edit mode suspends grid navigation entirely (Escape is handled by the
    // editor, which reports back through onEditingChange).
    if (editingCell) return;
    // The handler is bound to the whole table — only keystrokes that
    // originate in a BODY gridcell belong to the cell layer. A sort header's
    // Enter must sort, not open the active cell's editor.
    const origin = event.target as HTMLElement;
    if (!origin.closest('[role="gridcell"]')) return;
    const { row, col } = clampedActive;
    const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        if (
          row === flatVisibleRows.length - 1 &&
          loadMore?.hasMore &&
          !loadMore.loading &&
          !loadMoreFired.current
        ) {
          // Keyboard-continuous load-more: walking past the last row fetches
          // ONCE per page — the guard resets when rows arrive, so a host
          // that omits `loading` cannot be hammered by repeated presses.
          loadMoreFired.current = true;
          loadMore.onLoadMore();
          announce("Loading more rows…");
          return;
        }
        focusCell(row + 1, col);
        break;
      }
      case "ArrowUp":
        event.preventDefault();
        focusCell(row - 1, col);
        break;
      case "ArrowRight":
        event.preventDefault();
        focusCell(row, col + (isRtl ? -1 : 1));
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusCell(row, col + (isRtl ? 1 : -1));
        break;
      case "Home":
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) focusCell(0, 0);
        else focusCell(row, 0);
        break;
      case "End":
        event.preventDefault();
        if (event.ctrlKey || event.metaKey)
          focusCell(flatVisibleRows.length - 1, colCount - 1);
        else focusCell(row, colCount - 1);
        break;
      case "Enter":
      case "F2": {
        const column = columnAt(col);
        const tanRow = flatVisibleRows[row];
        if (column?.editable && tanRow) {
          event.preventDefault();
          setEditingCell({ rowId: tanRow.id, key: column.key });
          announce(
            `Editing ${typeof column.header === "string" ? column.header : column.key}`,
          );
        }
        break;
      }
      default:
        break;
    }
  };

  const closeEditor = React.useCallback(
    (rowId: string, key: string) => {
      setEditingCell((current) =>
        current && current.rowId === rowId && current.key === key
          ? null
          : current,
      );
      // Restore grid focus to the cell that was being edited.
      const rowIndex = flatVisibleRows.findIndex((r) => r.id === rowId);
      const colIndex =
        visibleColumns.findIndex((column) => column.key === key) +
        (selectable ? 1 : 0);
      if (rowIndex !== -1)
        requestAnimationFrame(() => {
          // Restore when focus fell to <body> (editor unmount) or is still
          // inside the cell (EditableCell's own display return). If the close
          // came from clicking ANOTHER control — the Columns trigger —
          // stealing focus back would close what the user just opened.
          const cell = cellRefs.current.get(cellKey(rowIndex, colIndex));
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
    [flatVisibleRows, visibleColumns, selectable],
  );

  // ---- header interactions -------------------------------------------------
  const handleSort = (key: string, additive: boolean) =>
    commitSort(cycleSort(activeSort, key, { additive, maxKeys: maxSortKeys }));

  // ---- render --------------------------------------------------------------
  const renderRow = (
    tanRow: (typeof sortedRows)[number],
    rowIndex: number,
    virtualProps?: {
      ref: (node: Element | null) => void;
      "data-index": number;
    },
  ) => {
    const row = tanRow.original;
    const id = tanRow.id;
    const isSelected = selected.has(id);
    return (
      <TableRow
        key={id}
        data-slot="data-grid-row"
        data-selected={isSelected ? "" : undefined}
        aria-rowindex={ariaRowIndexById.get(id) ?? rowIndex + 2}
        aria-selected={selectable ? isSelected : undefined}
        {...virtualProps}
        className={cn(
          // A selected row keeps one wash through hover and press (SP-06), light enough that a
          // `secondary` Badge in it stays visible — see `SELECTED_ROW_CLASS`.
          isSelected && SELECTED_ROW_CLASS,
        )}
      >
        {selectable ? (
          <SelectionCell
            role="gridcell"
            aria-colindex={1}
            tabIndex={
              clampedActive.row === rowIndex && clampedActive.col === 0 ? 0 : -1
            }
            ref={(node: HTMLTableCellElement | null) => {
              if (node) cellRefs.current.set(cellKey(rowIndex, 0), node);
              else cellRefs.current.delete(cellKey(rowIndex, 0));
            }}
            onFocus={() => setActiveCell({ row: rowIndex, col: 0 })}
            className="focus-visible:-outline-offset-2"
            checked={isSelected}
            onToggle={() => toggleRow(id)}
            label={`Select row ${rowIndex + 1}`}
          />
        ) : null}
        {visibleColumns.map((column, columnIndex) => {
          const col = columnIndex + (selectable ? 1 : 0);
          const isActive =
            clampedActive.row === rowIndex && clampedActive.col === col;
          const isEditing =
            editingCell?.rowId === id && editingCell.key === column.key;
          const isPrimary = columnIndex === 0;
          return (
            <TableCell
              key={column.key}
              role="gridcell"
              aria-colindex={ariaColIndexByKey.get(column.key)}
              aria-readonly={column.editable ? undefined : true}
              data-slot="data-grid-cell"
              tabIndex={isActive ? 0 : -1}
              ref={(node: HTMLElement | null) => {
                if (node) cellRefs.current.set(cellKey(rowIndex, col), node);
                else cellRefs.current.delete(cellKey(rowIndex, col));
              }}
              onFocus={(event) => {
                if (event.target === event.currentTarget)
                  setActiveCell({ row: rowIndex, col });
              }}
              // The roving cell lives inside the table's scroll viewport, which
              // clips its overflow — an outward focus outline would be cut off,
              // so it is pulled inside (SP-03).
              className={cn(
                columnCellClass(column),
                "focus-visible:-outline-offset-2",
              )}
            >
              {column.editable ? (
                <EditableCell
                  value={String(
                    (column.accessor
                      ? column.accessor(row)
                      : (row as Record<string, unknown>)[column.key]) ?? "",
                  )}
                  label={
                    typeof column.header === "string"
                      ? column.header
                      : column.key
                  }
                  editor={column.editable}
                  focusMode="managed"
                  editing={isEditing}
                  onEditingChange={(open) => {
                    if (open) setEditingCell({ rowId: id, key: column.key });
                    else closeEditor(id, column.key);
                  }}
                  status={cellStatus?.(id, column.key)}
                  onCommit={(next) => onCellCommit?.(row, column.key, next)}
                />
              ) : (
                <Cell
                  column={column}
                  row={row}
                  context={{ rowId: id, selected: isSelected }}
                />
              )}
              {isPrimary && mergedColumns.length > 0 ? (
                <span
                  data-slot="data-grid-merged"
                  className="mt-0.5 flex min-w-0 flex-col gap-0.5 text-xs text-muted-foreground"
                >
                  {mergedColumns.map((merged) => (
                    // `truncate` used to sit here, and it could not keep the promise: an
                    // auto-layout table sizes a column from its min-content width, which an
                    // ellipsis does not lower, so a long merged value still widened the primary
                    // cell. The shared rule wraps instead (`mergedValueClass`).
                    <span
                      key={merged.key}
                      data-sorted={
                        activeSort.find((entry) => entry.key === merged.key)
                          ?.direction
                      }
                      className={mergedValueClass(merged)}
                    >
                      {/* A value lifted out of its column loses the header a screen reader
                          would announce with it, so it carries that header as a prefix — as
                          DataList's stack always has. */}
                      {typeof merged.header === "string" ? (
                        <span className="sr-only">{merged.header}: </span>
                      ) : null}
                      <Cell
                        column={merged}
                        row={row}
                        context={{ rowId: id, selected: isSelected }}
                      />
                    </span>
                  ))}
                </span>
              ) : null}
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  const headerRow = (
    <TableRow aria-rowindex={1}>
      {selectable ? (
        <SelectAllHead
          role="columnheader"
          aria-colindex={1}
          checked={allSelected}
          indeterminate={indeterminate}
          onToggle={toggleAll}
          disabled={loading || visibleIds.length === 0}
        />
      ) : null}
      {visibleColumns.map((column) => {
        const entryIndex = activeSort.findIndex(
          (entry) => entry.key === column.key,
        );
        const entry = entryIndex === -1 ? null : activeSort[entryIndex]!;
        return (
          <SortableHead
            key={column.key}
            role="columnheader"
            aria-colindex={ariaColIndexByKey.get(column.key)}
            data-slot="data-grid-head"
            column={column}
            direction={entry?.direction ?? null}
            order={entry && activeSort.length > 1 ? entryIndex + 1 : undefined}
            onSort={(event) => handleSort(column.key, event.shiftKey)}
          />
        );
      })}
    </TableRow>
  );

  // A sorted column that revelation merged or hid (or the picker switched off)
  // takes its header's arrow and `aria-sort` with it; state the order instead.
  const sortSummary = offscreenSortSummary(activeSort, ordered, visibleColumns);

  const colSpan = colCount;
  const virtualItems = canVirtualize ? rowVirtualizer.getVirtualItems() : [];
  const totalSize = canVirtualize ? rowVirtualizer.getTotalSize() : 0;

  return (
    <div
      ref={ref}
      data-slot="data-grid"
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
      // Viewport height flows through a custom property (contract-clean).
      style={
        maxHeight
          ? ({ ["--data-grid-max-height"]: maxHeight } as React.CSSProperties)
          : undefined
      }
    >
      {(toolbar != null ||
        columnPicker ||
        hiddenColumns.length > 0 ||
        sortSummary != null) && (
        <div
          data-slot="data-grid-toolbar"
          className="flex min-w-0 flex-wrap items-center justify-between gap-2"
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
                    {typeof column.header === "string"
                      ? column.header
                      : column.key}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      )}

      {/* Upstream's `Table` owns its own horizontal overflow container and forwards nothing to
          it, so the vertical scroll box and the ref the virtualiser measures live in a wrapper
          this component owns. Batch 7 rebuilds `data-grid` on the reset primitives. */}
      <div
        ref={setContainer}
        data-slot="data-grid-scroll"
        className={cn(
          maxHeight != null &&
            "max-h-[calc(var(--data-grid-max-height))] overflow-y-auto",
        )}
      >
        {/* DS-68: the grid owns roving focus, so truncated text and RelativeTime in its cells are
            not extra tab stops. */}
        <TruncationFocusProvider focusable={false}>
          <Table
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
            aria-rowcount={loadMore?.hasMore ? -1 : ariaRowTotal}
            aria-colcount={ariaColTotal}
            aria-busy={loading || undefined}
            data-grid-id={gridId}
            onKeyDown={handleGridKeyDown}
          >
            <TableHeader
              className={cn(
                maxHeight != null && "sticky top-0 z-10 bg-background",
              )}
            >
              {headerRow}
            </TableHeader>

            {loading ? (
              <TableBody>
                <SkeletonRows
                  columns={visibleColumns}
                  selectable={selectable}
                  slot="data-grid-skeleton-row"
                />
              </TableBody>
            ) : flatVisibleRows.length === 0 &&
              sections.every((s) => s.rows.length === 0) ? (
              <TableBody>
                <EmptyRow colSpan={colSpan} slot="data-grid-empty-row">
                  {emptyState}
                </EmptyRow>
              </TableBody>
            ) : canVirtualize ? (
              // Spacer-row windowing: rows stay REAL table rows, so cell widths
              // keep tracking the header's column grid and measured heights can
              // vary — an absolutely-positioned flex <tr> would do neither.
              <TableBody>
                {virtualItems.length > 0 && virtualItems[0]!.start > 0 ? (
                  <tr
                    aria-hidden="true"
                    data-slot="data-grid-virtual-pad"
                    style={
                      {
                        ["--data-grid-virtual-pad"]: String(
                          virtualItems[0]!.start,
                        ),
                      } as React.CSSProperties
                    }
                    className="h-[calc(var(--data-grid-virtual-pad)*1px)]"
                  />
                ) : null}
                {virtualItems.map((virtualRow) =>
                  renderRow(
                    flatVisibleRows[virtualRow.index]!,
                    virtualRow.index,
                    {
                      ref: rowVirtualizer.measureElement,
                      "data-index": virtualRow.index,
                    },
                  ),
                )}
                {virtualItems.length > 0 &&
                totalSize > virtualItems[virtualItems.length - 1]!.end ? (
                  <tr
                    aria-hidden="true"
                    data-slot="data-grid-virtual-pad"
                    style={
                      {
                        ["--data-grid-virtual-pad"]: String(
                          totalSize -
                            virtualItems[virtualItems.length - 1]!.end,
                        ),
                      } as React.CSSProperties
                    }
                    className="h-[calc(var(--data-grid-virtual-pad)*1px)]"
                  />
                ) : null}
              </TableBody>
            ) : (
              sections.map((section) => {
                const collapsed =
                  section.id !== null && groups[section.id] === "collapsed";
                // Row indexes are continuous across sections for aria-rowindex.
                const startIndex = flatVisibleRows.findIndex(
                  (row) => row === section.rows[0],
                );
                return (
                  <TableBody
                    key={section.id ?? "__all"}
                    data-slot="data-grid-section"
                    data-group={section.id ?? undefined}
                    data-collapsed={collapsed ? "" : undefined}
                  >
                    {section.id !== null ? (
                      <TableRow
                        data-slot="data-grid-group-row"
                        aria-rowindex={ariaGroupRowIndex.get(section.id)}
                        className="bg-muted hover:bg-muted active:bg-muted"
                      >
                        <TableCell colSpan={colSpan} className="py-1">
                          <SectionToggle
                            label={section.label}
                            count={section.rows.length}
                            expanded={!collapsed}
                            onExpandedChange={(expanded) =>
                              commitGroups({
                                ...groups,
                                [section.id!]: expanded
                                  ? "expanded"
                                  : "collapsed",
                              })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {collapsed
                      ? null
                      : section.rows.map((tanRow) =>
                          renderRow(
                            tanRow,
                            startIndex +
                              section.rows.findIndex((r) => r === tanRow),
                          ),
                        )}
                  </TableBody>
                );
              })
            )}
          </Table>
        </TruncationFocusProvider>
      </div>

      {loadMore ? <LoadMore {...loadMore} /> : null}
      {footer != null ? <div data-slot="data-grid-footer">{footer}</div> : null}
      <Announcer />
    </div>
  );
}

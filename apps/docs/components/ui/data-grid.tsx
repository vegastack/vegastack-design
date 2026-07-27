// @vegastack data-grid@0.3.0 sha256-fugGH0ToEhgoFAPP5Z4T9DUP47tQoh1eUqc3tRko6+Y=

"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Inbox,
} from "lucide-react";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
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
(multi-key, typed comparators) and carries visibility/order state; TanStack Virtual
measures the windowed rows behind the `virtualize` flag. Neither touches DOM or
focus — the APG keyboard layer (roving gridcell tabindex, Enter/F2 edit mode with
grid-nav suspension, Escape restore, Tab advance across editable cells) is this
file's own, because no library ships it. Grouping is computed here over the sorted
leaves (a section per group value, collapsible, its own <tbody> — valid HTML where a
Collapsible div between tbody and tr is not).

Two behaviours are deliberately DIFFERENT from DataList, documented for migrators:
- Cells render as ELEMENTS (`<Cell/>`), so a `render` implementation may use hooks —
  DataList invokes `col.render` as a plain function and cannot allow that.
- The grid SORTS ITS OWN DATA (that is what the row-model engine is for); DataList
  only signals intent. `sort`/`onSortChange` stay controllable for URL state.

Deliberately NOT done here:
- No filter UI (FilterBuilder + the host), no pagination UI (the `footer` slot), no
  saved views/URL state (host, G7), no CSV export, no aggregation footers.
- No column resize — revisit with a real consumer; reorder + visibility ship now.
- Virtualization and grouping are mutually exclusive (documented): windowing grouped
  section rows adds complexity no current consumer needs.
--- */

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
export interface DataGridColumn<T> {
  /** Stable key — sort identity, visibility identity, order identity. */
  key: string;
  /** Header label. */
  header: React.ReactNode;
  /**
   * Cell content. Rendered as a component ELEMENT (hooks are safe here —
   * unlike `DataList.render`, which is invoked as a plain function).

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
   * Pixels this column needs before the responsive revelation shows it.
   * Columns that no longer fit hide right-to-left; `mobile` overrides.
   * @default 120
   */
  minWidth?: number;
  /**
   * Responsive posture: `visible` never hides; `hidden` drops on narrow
   * containers; `merge` stacks the value into the primary (first) column's
   * cell instead of disappearing.
   * @default "hidden"
   */
  mobile?: "visible" | "hidden" | "merge";
  /**
   * Group rows into collapsible sections by this column's value. One grouping
   * column at most; grouping disables `virtualize`.
   * @default false
   */
  group?: boolean;
  /**
   * Horizontal alignment.
   * @default "start"
   */
  align?: "start" | "center" | "end";
}

/** Keyboard-continuous load-more contract for the last row boundary. */
export interface DataGridLoadMore {
  /** More rows exist beyond the current `data`. */
  hasMore: boolean;
  /** Fetch the next page — also fired by ArrowDown past the last row. */
  onLoadMore: () => void;
  /**
   * A fetch is in flight (renders the loading affordance and debounces the
   * keyboard trigger).
   * @default false
   */
  loading?: boolean;
}

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
   * Controlled column order (array of keys). Omit for uncontrolled.

   * @default undefined
   */
  columnOrder?: string[];
  /**
   * Fired when column order changes.

   * @default undefined
   */
  onColumnOrderChange?: (order: string[]) => void;
  /**
   * Controlled collapsed state per group value. Omit for uncontrolled.

   * @default undefined
   */
  groupState?: Record<string, "expanded" | "collapsed">;
  /**
   * Fired when a group toggles.

   * @default undefined
   */
  onGroupStateChange?: (
    state: Record<string, "expanded" | "collapsed">,
  ) => void;
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
  /** Keyboard-continuous load-more at the last row.
   * @default undefined
   */
  loadMore?: DataGridLoadMore;
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

const alignClass = (align: DataGridColumn<unknown>["align"]) =>
  align === "end"
    ? "text-end"
    : align === "center"
      ? "text-center"
      : "text-start";

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
 * column visibility picker + drag/menu-free reorder via `columnOrder`,
 * responsive column revelation (`minWidth` + per-column `mobile` posture,
 * `merge` stacking into the primary cell), collapsible row grouping (one
 * `<tbody>` per section), keyboard-continuous load-more, opt-in row
 * virtualization, row selection, and the APG grid keyboard layer: roving
 * `gridcell` focus, <kbd>Enter</kbd>/<kbd>F2</kbd> opening the cell editor
 * (suspending grid navigation), <kbd>Escape</kbd> restoring it, and
 * <kbd>Tab</kbd> advancing across editable cells while editing.
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
  columnOrder,
  onColumnOrderChange,
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
  // ---- controlled-optional state (the house inline idiom) ------------------
  const [internalSort, setInternalSort] = React.useState<DataGridSort[]>([]);
  const isSortControlled = sort !== undefined;
  const activeSort = isSortControlled ? sort : internalSort;
  const commitSort = (next: DataGridSort[]) => {
    if (!isSortControlled) setInternalSort(next);
    onSortChange?.(next);
  };

  const [internalVisibility, setInternalVisibility] = React.useState<
    Record<string, boolean>
  >({});
  const isVisibilityControlled = columnVisibility !== undefined;
  const visibility = isVisibilityControlled
    ? columnVisibility
    : internalVisibility;
  const commitVisibility = (next: Record<string, boolean>) => {
    if (!isVisibilityControlled) setInternalVisibility(next);
    onColumnVisibilityChange?.(next);
  };

  const [internalOrder, setInternalOrder] = React.useState<string[] | null>(
    null,
  );
  const isOrderControlled = columnOrder !== undefined;
  const order = isOrderControlled ? columnOrder : internalOrder;
  void onColumnOrderChange;
  void setInternalOrder;

  const [internalGroups, setInternalGroups] = React.useState<
    Record<string, "expanded" | "collapsed">
  >({});
  const isGroupControlled = groupState !== undefined;
  const groups = isGroupControlled ? groupState : internalGroups;
  const commitGroups = (next: Record<string, "expanded" | "collapsed">) => {
    if (!isGroupControlled) setInternalGroups(next);
    onGroupStateChange?.(next);
  };

  const [internalSelected, setInternalSelected] = React.useState<Set<string>>(
    () => new Set(),
  );
  const isSelectionControlled = selectedIds != null;
  const selected = isSelectionControlled ? selectedIds : internalSelected;
  const commitSelection = (next: Set<string>) => {
    if (!isSelectionControlled) setInternalSelected(next);
    onSelectionChange?.(next);
  };

  // ---- responsive column revelation ---------------------------------------
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = React.useState<number | null>(
    null,
  );
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Quantized: hiding/showing a column changes the table's own width and
    // re-fires the observer — sub-pixel oscillation must not re-render the
    // grid in a loop.
    const update = () =>
      setContainerWidth((prev) => {
        const next = el.clientWidth;
        return prev !== null && Math.abs(prev - next) <= 1 ? prev : next;
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
   * The platform-harvested revelation: walk columns in order, keep the ones
   * whose cumulative minWidth fits the measured container; `visible` always
   * stays, `merge` overflow stacks into the primary cell.
   */
  const { visibleColumns, mergedColumns } = React.useMemo(() => {
    const pickerVisible = ordered.filter(
      (column) => visibility[column.key] !== false,
    );
    if (containerWidth == null)
      return { visibleColumns: pickerVisible, mergedColumns: [] };
    const selectionWidth = selectable ? 40 : 0;
    let used = selectionWidth;
    const shown: DataGridColumn<T>[] = [];
    const overflow: DataGridColumn<T>[] = [];
    for (const [index, column] of pickerVisible.entries()) {
      const need = column.minWidth ?? 120;
      const isPrimary = index === 0;
      if (
        isPrimary ||
        column.mobile === "visible" ||
        used + need <= containerWidth
      ) {
        used += need;
        shown.push(column);
      } else {
        overflow.push(column);
      }
    }
    return {
      visibleColumns: shown,
      mergedColumns: overflow.filter((column) => column.mobile === "merge"),
    };
  }, [ordered, visibility, containerWidth, selectable]);

  // ---- sorting via the TanStack row model ----------------------------------
  const columnHelper = React.useMemo(() => createColumnHelper<T>(), []);
  const tanColumns = React.useMemo<ColumnDef<T, unknown>[]>(
    () =>
      columns.map((column) =>
        columnHelper.accessor(
          (row) =>
            column.accessor
              ? column.accessor(row)
              : (row as Record<string, unknown>)[column.key],
          { id: column.key },
        ),
      ),
    [columns, columnHelper],
  );
  const sortingState: SortingState = activeSort.map((entry) => ({
    id: entry.key,
    desc: entry.direction === "desc",
  }));
  const table = useReactTable({
    data,
    columns: tanColumns,
    state: { sorting: sortingState },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    enableSortingRemoval: true,
    getRowId: (row) => getRowId(row),
  });
  const sortedRows = table.getSortedRowModel().rows;

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

  // ---- virtualization (flag; exclusive with grouping) ----------------------
  const canVirtualize = virtualize && !groupColumn;
  const rowVirtualizer = useVirtualizer({
    count: canVirtualize ? flatVisibleRows.length : 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 40,
    overscan: 8,
  });

  // ---- the APG grid keyboard layer (pass 2) --------------------------------
  const gridId = React.useId();
  const colCount = visibleColumns.length + (selectable ? 1 : 0);
  const [activeCell, setActiveCell] = React.useState<{
    row: number;
    col: number;
  }>({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = React.useState<{
    rowId: string;
    key: string;
  } | null>(null);
  const [announcement, setAnnouncementState] = React.useState({
    text: "",
    seq: 0,
  });
  const announce = React.useCallback((text: string) => {
    setAnnouncementState((prev) => ({ text, seq: prev.seq + 1 }));
  }, []);
  const cellRefs = React.useRef(new Map<string, HTMLElement>());
  const cellKey = (row: number, col: number) => `${row}:${col}`;

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
    const { row, col } = activeCell;
    const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        if (
          row === flatVisibleRows.length - 1 &&
          loadMore?.hasMore &&
          !loadMore.loading
        ) {
          // Keyboard-continuous load-more: walking past the last row fetches.
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

  /** Tab while editing advances to the next editable cell in the row. */
  const advanceEdit = React.useCallback(
    (fromRowId: string, fromKey: string, backwards: boolean) => {
      const rowIndex = flatVisibleRows.findIndex((r) => r.id === fromRowId);
      if (rowIndex === -1) return false;
      const editableKeys = visibleColumns
        .filter((column) => column.editable)
        .map((column) => column.key);
      const at = editableKeys.indexOf(fromKey);
      const nextKey = editableKeys[at + (backwards ? -1 : 1)];
      if (!nextKey) return false;
      setEditingCell({ rowId: fromRowId, key: nextKey });
      const colIndex =
        visibleColumns.findIndex((column) => column.key === nextKey) +
        (selectable ? 1 : 0);
      setActiveCell({ row: rowIndex, col: colIndex });
      return true;
    },
    [flatVisibleRows, visibleColumns, selectable],
  );

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
        requestAnimationFrame(() =>
          cellRefs.current.get(cellKey(rowIndex, colIndex))?.focus(),
        );
    },
    [flatVisibleRows, visibleColumns, selectable],
  );

  // ---- selection maths (DataList's preserved-off-view semantics) -----------
  const visibleIds = flatVisibleRows.map((row) => row.id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = visibleIds.some((id) => selected.has(id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) for (const id of visibleIds) next.delete(id);
    else for (const id of visibleIds) next.add(id);
    commitSelection(next);
  };
  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    commitSelection(next);
  };

  // ---- header interactions -------------------------------------------------
  const handleSort = (key: string, additive: boolean) => {
    const existing = activeSort.find((entry) => entry.key === key);
    let next: DataGridSort[];
    if (!existing) {
      const base = additive ? activeSort : [];
      next = [...base, { key, direction: "asc" as const }].slice(-maxSortKeys);
    } else if (existing.direction === "asc") {
      next = activeSort.map((entry) =>
        entry.key === key ? { key, direction: "desc" as const } : entry,
      );
    } else {
      next = activeSort.filter((entry) => entry.key !== key);
    }
    commitSort(next);
  };

  // ---- render --------------------------------------------------------------
  const renderRow = (
    tanRow: (typeof sortedRows)[number],
    rowIndex: number,
    style?: React.CSSProperties,
  ) => {
    const row = tanRow.original;
    const id = tanRow.id;
    const isSelected = selected.has(id);
    return (
      <TableRow
        key={id}
        data-slot="data-grid-row"
        data-selected={isSelected ? "" : undefined}
        aria-rowindex={rowIndex + 2}
        aria-selected={selectable ? isSelected : undefined}
        style={style}
        className={cn(
          isSelected && "bg-accent hover:bg-accent data-selected:bg-accent",
        )}
      >
        {selectable ? (
          <TableCell
            role="gridcell"
            aria-colindex={1}
            tabIndex={
              activeCell.row === rowIndex && activeCell.col === 0 ? 0 : -1
            }
            ref={(node: HTMLElement | null) => {
              if (node) cellRefs.current.set(cellKey(rowIndex, 0), node);
              else cellRefs.current.delete(cellKey(rowIndex, 0));
            }}
            onFocus={() => setActiveCell({ row: rowIndex, col: 0 })}
            className="w-0"
          >
            <Checkbox
              size="sm"
              checked={isSelected}
              onCheckedChange={() => toggleRow(id)}
              aria-label={`Select row ${rowIndex + 1}`}
            />
          </TableCell>
        ) : null}
        {visibleColumns.map((column, columnIndex) => {
          const col = columnIndex + (selectable ? 1 : 0);
          const isActive =
            activeCell.row === rowIndex && activeCell.col === col;
          const isEditing =
            editingCell?.rowId === id && editingCell.key === column.key;
          const isPrimary = columnIndex === 0;
          return (
            <TableCell
              key={column.key}
              role="gridcell"
              aria-colindex={col + 1}
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
              className={cn(alignClass(column.align))}
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
                  className="mt-0.5 flex min-w-0 flex-col gap-0.5 text-sm text-muted-foreground"
                >
                  {mergedColumns.map((merged) => (
                    <span key={merged.key} className="min-w-0 truncate">
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
        <TableHead role="columnheader" aria-colindex={1} className="w-0">
          <Checkbox
            size="sm"
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onCheckedChange={toggleAll}
            disabled={loading || visibleIds.length === 0}
            aria-label="Select all rows"
          />
        </TableHead>
      ) : null}
      {visibleColumns.map((column, columnIndex) => {
        const entryIndex = activeSort.findIndex(
          (entry) => entry.key === column.key,
        );
        const entry = entryIndex === -1 ? null : activeSort[entryIndex]!;
        return (
          <TableHead
            key={column.key}
            role="columnheader"
            aria-colindex={columnIndex + (selectable ? 1 : 0) + 1}
            data-slot="data-grid-head"
            data-sorted={entry?.direction}
            aria-sort={
              column.sortable
                ? entry
                  ? entry.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
                : undefined
            }
            className={cn(alignClass(column.align))}
          >
            {column.sortable ? (
              <button
                type="button"
                onClick={(event) => handleSort(column.key, event.shiftKey)}
                className="group/sort -mx-1.5 -my-1 inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-muted-foreground select-none hover:text-foreground"
              >
                {column.header}
                <span aria-hidden className="inline-flex items-center gap-0.5">
                  {entry ? (
                    <>
                      {entry.direction === "asc" ? (
                        <ArrowUp className="size-(--icon-inline)" />
                      ) : (
                        <ArrowDown className="size-(--icon-inline)" />
                      )}
                      {activeSort.length > 1 ? (
                        <span className="text-sm">{entryIndex + 1}</span>
                      ) : null}
                    </>
                  ) : (
                    <ChevronsUpDown className="size-(--icon-inline) opacity-0 group-hover/sort:opacity-(--opacity-hint-soft)" />
                  )}
                </span>
              </button>
            ) : (
              column.header
            )}
          </TableHead>
        );
      })}
    </TableRow>
  );

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
      {(toolbar != null || columns.length > 0) && (
        <div
          data-slot="data-grid-toolbar"
          className="flex min-w-0 items-center justify-between gap-2"
        >
          <div className="min-w-0 flex-1">{toolbar}</div>
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
        </div>
      )}

      <Table
        role="grid"
        aria-label={ariaLabel}
        aria-rowcount={loadMore?.hasMore ? -1 : flatVisibleRows.length + 1}
        aria-colcount={colCount}
        aria-busy={loading || undefined}
        data-grid-id={gridId}
        onKeyDown={handleGridKeyDown}
        containerProps={{
          ref: containerRef,
          className: cn(
            maxHeight != null &&
              "max-h-[calc(var(--data-grid-max-height))] overflow-y-auto",
          ),
        }}
      >
        <TableHeader
          className={cn(
            maxHeight != null && "sticky top-0 z-(--z-raised) bg-background",
          )}
        >
          {headerRow}
        </TableHeader>

        {loading ? (
          <TableBody>
            {Array.from({ length: 5 }, (_, index) => (
              <TableRow key={`skeleton-${index}`} aria-hidden="true">
                {selectable ? (
                  <TableCell className="w-0">
                    <Skeleton className="size-(--icon-inline) rounded-sm" />
                  </TableCell>
                ) : null}
                {visibleColumns.map((column, columnIndex) => (
                  <TableCell key={column.key}>
                    <Skeleton
                      className={columnIndex === 0 ? "h-4 w-32" : "h-4 w-20"}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        ) : flatVisibleRows.length === 0 &&
          sections.every((s) => s.rows.length === 0) ? (
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="p-0">
                {emptyState ?? (
                  <Empty size="sm">
                    <EmptyHeader>
                      <EmptyMedia>
                        <Inbox />
                      </EmptyMedia>
                      <EmptyTitle>No data</EmptyTitle>
                      <EmptyDescription>
                        There are no records to display.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        ) : canVirtualize ? (
          <TableBody
            style={
              {
                ["--data-grid-virtual-height"]: String(totalSize),
              } as React.CSSProperties
            }
            className="relative block h-[calc(var(--data-grid-virtual-height)*1px)]"
          >
            {virtualItems.map((virtualRow) => {
              const tanRow = flatVisibleRows[virtualRow.index]!;
              return (
                <VirtualRowShell key={tanRow.id} start={virtualRow.start}>
                  {renderRow(tanRow, virtualRow.index)}
                </VirtualRowShell>
              );
            })}
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
                    className="bg-muted/(--alpha-wash) hover:bg-muted/(--alpha-wash)"
                  >
                    <TableCell colSpan={colSpan} className="py-1">
                      <button
                        type="button"
                        aria-expanded={!collapsed}
                        onClick={() =>
                          commitGroups({
                            ...groups,
                            [section.id!]: collapsed ? "expanded" : "collapsed",
                          })
                        }
                        className="relative flex min-w-0 items-center gap-1 rounded-sm text-label-sm text-muted-foreground before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:text-foreground"
                      >
                        {collapsed ? (
                          <ChevronRight className="size-(--icon-compact) rtl:rotate-180" />
                        ) : (
                          <ChevronDown className="size-(--icon-compact)" />
                        )}
                        <span className="min-w-0 truncate">
                          {section.label}
                        </span>
                        <span>({section.rows.length})</span>
                      </button>
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

      {loadMore ? (
        <div data-slot="data-grid-load-more" className="flex justify-center">
          {loadMore.hasMore ? (
            <Button
              variant="ghost"
              size="sm"
              loading={loadMore.loading}
              onClick={loadMore.onLoadMore}
            >
              Load more
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">
              All rows loaded
            </span>
          )}
        </div>
      ) : null}
      {footer != null ? <div data-slot="data-grid-footer">{footer}</div> : null}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        <span key={announcement.seq}>{announcement.text}</span>
      </span>
    </div>
  );
}

/**
 * Absolute-positioned shell for a virtualized row — offset flows through a
 * unitless custom property so inline style stays custom-properties-only.
 */
function VirtualRowShell({
  start,
  children,
}: {
  start: number;
  children: React.ReactNode;
}) {
  return (
    <React.Fragment>
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              style?: React.CSSProperties;
              className?: string;
            }>,
            {
              style: {
                ["--data-grid-row-start"]: String(start),
              } as React.CSSProperties,
              className:
                "absolute inset-x-0 top-0 flex w-full translate-y-[calc(var(--data-grid-row-start)*1px)] items-center",
            },
          )
        : children}
    </React.Fragment>
  );
}

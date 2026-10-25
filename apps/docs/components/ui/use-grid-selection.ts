// @vegastack use-grid-selection@0.25.77 sha256-tpKJXQq3GVAZkhnFn5WeURGC0pfUUD5mb3qCmxK1q2o=

"use client";

import * as React from "react";

/* ---
`useGridSelection` is a spreadsheet's range selection as state: an anchor cell, a focus cell, and
the rectangle between them, all by ROW ID and COLUMN KEY — never by index — so a range survives
a refetch that reorders rows, a column moved or hidden, and rows windowed out of the DOM. Indexes
are derived from the current `rowIds`/`colKeys` whenever a question needs them; a cell whose row
or column left is simply no longer in any range.

One range in this version (Shift+click and Shift+arrows extend it; a plain move collapses it).
Ranges over rows the host has not loaded cannot exist — a range is between two ids the grid has.

Deliberately NOT done here:
- No DOM, no focus, no keyboard: `DataGrid` maps keys to `extend`, `selectRow` and the rest.
- No clipboard: `grid-clipboard` reads and writes what a range holds.
--- */

/** One cell: a row id and a column key. */
export interface GridCell {
  rowId: string;
  colKey: string;
}

/** A rectangle between two cells, either of which may be the top-left. */
export interface GridRange {
  /** Where the range started (Shift+click and Shift+arrows keep it). */
  anchor: GridCell;
  /** Where it ends — the active cell. */
  focus: GridCell;
}

/** A range resolved against the current order: inclusive row and column index bounds. */
export interface GridRangeBounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** Rows in the range. */
  rows: number;
  /** Columns in the range. */
  columns: number;
}

/** The direction `extend` moves the focus cell. */
export type GridSelectionDirection = "up" | "down" | "left" | "right";

/** Options for {@link useGridSelection}. */
export interface UseGridSelectionOptions {
  /** Row ids in display order (the loaded rows). */
  rowIds: readonly string[];
  /** Column keys in display order (the selectable columns). */
  colKeys: readonly string[];
  /**
   * Called when the selection changes (to announce "4 by 3 cells selected", say).
   * @default undefined
   */
  onChange?: (range: GridRange | null) => void;
}

/** What {@link useGridSelection} returns. */
export interface UseGridSelectionResult {
  /** The anchor cell, or `null` with nothing selected. */
  anchor: GridCell | null;
  /** The focus cell, or `null`. */
  focus: GridCell | null;
  /** The selected ranges (one in this version), resolved to cells that still exist. */
  ranges: readonly GridRange[];
  /** The selected range's bounds in the current order, or `null`. */
  bounds: GridRangeBounds | null;
  /** Whether a cell is inside a selected range. */
  isSelected: (rowId: string, colKey: string) => boolean;
  /** Collapse the selection to one cell (a plain click or move). */
  select: (cell: GridCell) => void;
  /** Keep the anchor and move the focus to `cell` (Shift+click). */
  extendTo: (cell: GridCell) => void;
  /** Keep the anchor and move the focus one cell (Shift+arrow). Returns the new focus. */
  extend: (direction: GridSelectionDirection) => GridCell | null;
  /** Select every column of a row (Shift+Space). */
  selectRow: (rowId: string) => void;
  /** Select every row of a column (Ctrl+Space). */
  selectColumn: (colKey: string) => void;
  /** Select every cell (⌘/Ctrl+A). */
  selectAll: () => void;
  /** Clear the selection. */
  clear: () => void;
  /**
   * The range as last set, read synchronously — for a handler running before the next render
   * (a focus that follows a click in the same event).
   */
  current: () => GridRange | null;
}

function indexMap(ids: readonly string[]): Map<string, number> {
  return new Map(ids.map((id, index) => [id, index]));
}

/** Bounds of a range in the current order, or `null` when either end left. */
export function gridRangeBounds(
  range: GridRange,
  rowIndex: ReadonlyMap<string, number>,
  colIndex: ReadonlyMap<string, number>,
): GridRangeBounds | null {
  const r1 = rowIndex.get(range.anchor.rowId);
  const r2 = rowIndex.get(range.focus.rowId);
  const c1 = colIndex.get(range.anchor.colKey);
  const c2 = colIndex.get(range.focus.colKey);
  if (
    r1 === undefined ||
    r2 === undefined ||
    c1 === undefined ||
    c2 === undefined
  )
    return null;
  const top = Math.min(r1, r2);
  const bottom = Math.max(r1, r2);
  const left = Math.min(c1, c2);
  const right = Math.max(c1, c2);
  return {
    top,
    bottom,
    left,
    right,
    rows: bottom - top + 1,
    columns: right - left + 1,
  };
}

/**
 * `useGridSelection` — a spreadsheet range selection kept by row id and column key. Pure state:
 * a grid maps its keys and pointer gestures onto `select`, `extend`, `extendTo`, `selectRow`,
 * `selectColumn` and `selectAll`, and asks `isSelected` while it renders.
 *
 * @example
 * const selection = useGridSelection({ rowIds, colKeys });
 * selection.select({ rowId: "r1", colKey: "name" });
 * selection.extend("down"); // anchor r1·name, focus r2·name
 * selection.bounds; // { top: 0, bottom: 1, left: 0, right: 0, rows: 2, columns: 1 }
 */
export function useGridSelection({
  rowIds,
  colKeys,
  onChange,
}: UseGridSelectionOptions): UseGridSelectionResult {
  const [range, setRange] = React.useState<GridRange | null>(null);
  const rowIndex = React.useMemo(() => indexMap(rowIds), [rowIds]);
  const colIndex = React.useMemo(() => indexMap(colKeys), [colKeys]);
  const latest = React.useRef({
    rowIds,
    colKeys,
    rowIndex,
    colIndex,
    range,
    onChange,
  });
  React.useLayoutEffect(() => {
    latest.current = { rowIds, colKeys, rowIndex, colIndex, range, onChange };
  });

  const commit = React.useCallback((next: GridRange | null) => {
    latest.current.range = next;
    setRange(next);
    latest.current.onChange?.(next);
  }, []);

  const bounds = React.useMemo(
    () => (range ? gridRangeBounds(range, rowIndex, colIndex) : null),
    [range, rowIndex, colIndex],
  );
  // A range whose row or column left is no range at all — and is forgotten, so neither a later
  // Shift+click nor the row coming back revives it.
  const live = bounds ? range : null;
  React.useEffect(() => {
    if (range && !bounds) commit(null);
  }, [range, bounds, commit]);

  const isSelected = React.useCallback(
    (rowId: string, colKey: string) => {
      if (!bounds) return false;
      const r = rowIndex.get(rowId);
      const c = colIndex.get(colKey);
      return (
        r !== undefined &&
        c !== undefined &&
        r >= bounds.top &&
        r <= bounds.bottom &&
        c >= bounds.left &&
        c <= bounds.right
      );
    },
    [bounds, rowIndex, colIndex],
  );

  const select = React.useCallback(
    (cell: GridCell) => commit({ anchor: cell, focus: cell }),
    [commit],
  );
  const extendTo = React.useCallback(
    (cell: GridCell) => {
      const current = latest.current.range;
      commit({ anchor: current?.anchor ?? cell, focus: cell });
    },
    [commit],
  );
  const extend = React.useCallback(
    (direction: GridSelectionDirection) => {
      const {
        range: current,
        rowIds: rows,
        colKeys: cols,
        rowIndex: ri,
        colIndex: ci,
      } = latest.current;
      if (!current) return null;
      const r = ri.get(current.focus.rowId);
      const c = ci.get(current.focus.colKey);
      if (r === undefined || c === undefined) return null;
      const nr = Math.max(
        0,
        Math.min(
          rows.length - 1,
          r + (direction === "down" ? 1 : direction === "up" ? -1 : 0),
        ),
      );
      const nc = Math.max(
        0,
        Math.min(
          cols.length - 1,
          c + (direction === "right" ? 1 : direction === "left" ? -1 : 0),
        ),
      );
      const focus = { rowId: rows[nr]!, colKey: cols[nc]! };
      commit({ anchor: current.anchor, focus });
      return focus;
    },
    [commit],
  );
  const selectRow = React.useCallback(
    (rowId: string) => {
      const cols = latest.current.colKeys;
      if (cols.length === 0) return;
      commit({
        anchor: { rowId, colKey: cols[0]! },
        focus: { rowId, colKey: cols.at(-1)! },
      });
    },
    [commit],
  );
  const selectColumn = React.useCallback(
    (colKey: string) => {
      const rows = latest.current.rowIds;
      if (rows.length === 0) return;
      commit({
        anchor: { rowId: rows[0]!, colKey },
        focus: { rowId: rows.at(-1)!, colKey },
      });
    },
    [commit],
  );
  const selectAll = React.useCallback(() => {
    const { rowIds: rows, colKeys: cols } = latest.current;
    if (rows.length === 0 || cols.length === 0) return;
    commit({
      anchor: { rowId: rows[0]!, colKey: cols[0]! },
      focus: { rowId: rows.at(-1)!, colKey: cols.at(-1)! },
    });
  }, [commit]);
  const clear = React.useCallback(() => commit(null), [commit]);
  const current = React.useCallback(() => latest.current.range, []);

  return {
    anchor: live?.anchor ?? null,
    focus: live?.focus ?? null,
    ranges: live ? [live] : [],
    bounds,
    isSelected,
    select,
    extendTo,
    extend,
    selectRow,
    selectColumn,
    selectAll,
    clear,
    current,
  };
}

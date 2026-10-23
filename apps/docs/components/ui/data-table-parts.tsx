// @vegastack data-table-parts@0.25.69 sha256-LZ+u7KxmPL4g0OKN4uK/KjGeRWSfQ/urSgcnAHYr/qo=

"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Ellipsis,
  Inbox,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { PanelActions } from "@/components/ui/panel-search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";

/* ---
The parts BOTH table renderers are built from. `DataList` (presentational) and
`DataGrid` (engine-backed) had independently grown the same sort header, the same
select-all/per-row selection arithmetic, the same skeleton rows and the same empty
row — four recipes, twice each, drifting apart one fix at a time.

The doctrinal split is unchanged and is the reason this file holds parts rather
than a third table component: DataList stays presentational, DataGrid keeps its
engines (TanStack row model + windowing). What they share is chrome and set maths,
neither of which is anybody's differentiator.

Nothing here owns data. `useRowSelection` is controlled-optional set arithmetic;
every other export is a rendered part driven entirely by its props.
--- */

/** Sort direction for a sortable column. */
export type SortDirection = "asc" | "desc";

/**
 * What a column does once its container is too narrow to show it: `visible`
 * never hides, `merge` stacks the value into the primary (first) column's cell,
 * `hidden` drops it and is counted so the loss is reported.
 */
export type DataTableColumnMobile = "visible" | "hidden" | "merge";

/**
 * The layout facts every table column carries, whichever renderer owns it.
 * `DataListColumn` and `DataGridColumn` both extend this, so the alignment and
 * wrapping rules are decided once.
 */
export interface DataTableColumnLayout {
  /** Stable identifier — the React key, the sort key, the visibility key. */
  key: string;
  /**
   * Horizontal alignment of the header and cells.
   * @default "start"
   */
  align?: "start" | "center" | "end";
  /**
   * Render this column's BODY cells in the mono face (`font-mono text-sm` + `tabular-nums`) — for
   * codes and identifiers (SKUs, ticket ids, hashes). Numbers are not codes: a count, an amount
   * or a date column uses `align: "end"` and the regular face with `tabular-nums`. The header
   * cell stays in the sans face either way.
   * @default false
   */
  mono?: boolean;
  /**
   * Set this column's BODY values in tabular figures, in the regular face — for a count, an amount,
   * a size or a date, so their digits line up down the column (`mono` already does for codes).
   * @default false
   */
  numeric?: boolean;
  /**
   * Keep this column's cells on one line instead of wrapping. The primary
   * (first) column is the FILL column: it takes the width the others leave and
   * its text wraps (anywhere, so one unbroken value never widens the table).
   * Every other column is a FIT column: sized to its content and kept on one
   * line, so a short value or label never breaks. `false` on a fit column lets
   * it wrap between words instead (never inside one); `true` on the primary
   * column keeps a code or figure on one line until the table is squeezed.
   * @default true, except for the primary column, which wraps unless it is `align="end"` or `mono`
   */
  nowrap?: boolean;
  /**
   * Pixels this column needs before the responsive revelation shows it.
   * Columns that no longer fit hide right-to-left; `mobile` overrides.
   * @default 120
   */
  minWidth?: number;
  /**
   * Responsive posture when the column no longer fits: `visible` never hides;
   * `merge` stacks the value into the primary (first) column's cell; `hidden`
   * drops it, which is counted and reported so the loss is never silent.
   * `merge` is the default because narrowing a viewport must never lose data
   * silently.
   * @default "merge"
   */
  mobile?: DataTableColumnMobile;
}

/**
 * Text alignment utility for a column. Exported because header cells, body
 * cells and skeleton cells must all agree.
 */
export function alignClass(align: DataTableColumnLayout["align"]): string {
  return align === "end"
    ? "text-end"
    : align === "center"
      ? "text-center"
      : "text-start";
}

/**
 * Whether a column's cells stay on one line. A FIT column (every column but the
 * primary) says nothing and stays on one line. The FILL column (the primary)
 * wraps, EXCEPT in the two shapes that are unreadable when broken: end-aligned
 * figures and mono values. An explicit `nowrap` wins either way.
 */
export function isNowrapColumn(
  column: DataTableColumnLayout,
  fill = false,
): boolean {
  return (
    column.nowrap ?? (!fill || column.align === "end" || column.mono === true)
  );
}

/** Which of the two column roles a cell plays (`columnCellClass`, `headerCellClass`). */
export interface DataTableColumnRole {
  /**
   * The FILL column — the primary (first) column, which takes the width the
   * fit columns leave. Every other column is a FIT column.
   * @default false
   */
  fill?: boolean;
}

/**
 * What the FILL cell becomes inside a `data-squeezed` table — the attribute a
 * renderer sets on its `<table>` when, AFTER revelation, the table still
 * overflows its container (the last rung of "never forces a horizontal
 * scroll"). Only `DataList` sets it; `DataGrid`'s container is allowed to
 * scroll. Squeezed, the fill cell is wrapping and breakable anywhere, because
 * the alternative is overflowing. `wrap-anywhere` is the value that lowers
 * min-content width, which is what an auto-layout table sizes each column from.
 *
 * Only the fill (primary) cell is released. Fit cells and every header keep
 * their one-line posture: releasing them broke short labels mid-word ("Prod" /
 * "ucts", "Un" / "it") the moment ONE long value overflowed. If the table still
 * overflows with the fill cell released, the renderer merges another column
 * instead (`revealColumns`' `extraOverflow`).
 *
 * The release reaches every DESCENDANT too (`**:`), because a cell's own
 * `whitespace` does not reach inside a custom render: a `truncate` span, a
 * `whitespace-nowrap` row or a Badge each pin their own min-content, and
 * `truncate` cannot shrink inside an auto-layout cell anyway, so its ellipsis
 * was never available there — squeezed, it wraps instead.
 *
 * What the release SKIPS (the `KEEP` list, below) is a control and fixed-size
 * content, and everything inside one. Each has a fixed height or a fixed box,
 * so a label wrapped inside it spills out of it — a squeezed `sm` Button
 * measured 45px of text in a 26px box. Skipping is enough for a control that
 * states its own one-line posture (every Button, Toggle and trigger does). The
 * fixed-size content that states none — `Avatar`, `Kbd`, a stepper node — is
 * also put back on one line (`whitespace-nowrap`), because the cell's
 * `whitespace` and `overflow-wrap` INHERIT into it: a Kbd broke `⌘K` in two
 * inside its 20px box (review round 4). It is kept from shrinking too
 * (`shrink-0`): Kbd's own `min-w-5` replaces a flex item's min-content floor,
 * so a squeezed flex row pressed `Ctrl K` into 20px. An unstyled `button` or `role=button`
 * span is not put back: it has no fixed box, so it wraps with its cell. The
 * text around a kept control breaks instead, and the row grows taller. The list is keyed on what reaches the DOM whatever
 * element carries it:
 *
 * - a native `button`/`input`/`select`/`textarea` and the control roles —
 *   `button`, `checkbox`, `combobox`, `radio`, `slider`, `spinbutton`,
 *   `switch`, `tab`;
 * - the CLASS OUTPUT of every exported variant helper with a fixed height —
 *   `buttonVariants` (`group/button`), `toggleVariants` (`group/toggle`),
 *   `navigationMenuTriggerStyle`, `tabsListVariants` and
 *   `stepperNodeVariants` — so `<a className={buttonVariants()}>`, the
 *   documented link-as-button, is kept exactly like a `Button`. A `data-slot`
 *   or a role is not enough: the helper's output lands on foreign elements that
 *   carry neither (review round 4). `data-table-parts.test.tsx` fails when an
 *   exported helper with a fixed height is missing from this list;
 * - `Avatar` and `Kbd`;
 * - DataList's merged `line` (`data-list-merged`, `data-layout="line"`) and everything in it: it
 *   is ONE line that truncates, and it adds nothing to the cell's min-content (it contains its
 *   inline size), so releasing it only broke its values mid-word ("Produc" / "t", "25" / "MB")
 *   inside a squeezed phone row instead of ellipsizing them.
 *
 * Four things look like controls but are TEXT, and stay released:
 *
 * - DataList's own row-action wrapper (`data-list-row-action`) and the sort
 *   header (`data-table-sort`, itself a `Button`) — buttons that hold wrapping
 *   text;
 * - a link-variant Button or `buttonVariants({ variant: "link" })` (its class
 *   output carries `hover:underline`, which no other button variant does): it
 *   reads as text, so it wraps and its fixed height gives way (`h-auto`, with a
 *   24px floor for the pointer target);
 * - `EditableCell`'s display state (`editable-cell-display`), a value you can
 *   click: it wraps, and its `min-h-8` box grows with it;
 * - a Badge — `Badge`, `badgeVariants()` on an anchor, `ToolCallChip` — keyed
 *   on its class output `group/badge`: its fixed `h-5` gives way (`h-auto`) so
 *   a wrapped label stays inside it. (A `Chip` needs nothing: its height is a
 *   `min-h`.)
 *
 * The one list appears four times, identically, because Tailwind can only see
 * a literal class.
 */
const SQUEEZE_CLASS =
  "in-data-squeezed:whitespace-normal in-data-squeezed:wrap-anywhere " +
  "in-data-squeezed:**:not-[:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd],[data-slot=data-list-merged][data-layout=line]),:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd],[data-slot=data-list-merged][data-layout=line])_*]:whitespace-normal " +
  "in-data-squeezed:**:not-[:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd],[data-slot=data-list-merged][data-layout=line]),:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd],[data-slot=data-list-merged][data-layout=line])_*]:wrap-anywhere " +
  "in-data-squeezed:**:[&:is([data-slot=avatar],[data-slot=kbd],[class~='group/stepper-node'])]:whitespace-nowrap " +
  "in-data-squeezed:**:[&:is([data-slot=avatar],[data-slot=kbd],[class~='group/stepper-node'])]:shrink-0 " +
  "in-data-squeezed:**:[&[class~='group/badge']]:h-auto " +
  "in-data-squeezed:**:[&[class~='group/button'][class~='hover:underline']]:h-auto " +
  "in-data-squeezed:**:[&[class~='group/button'][class~='hover:underline']]:min-h-6";

/**
 * The LAST rung, for fit cells only: `data-strained`, which a renderer sets once the fill cell is
 * released, nothing is left to merge (every remaining column is the primary or
 * `mobile: "visible"`) and the table STILL overflows. Only then does a fit cell give up its one
 * line, with the squeeze's release (its keep list less DataList's merged `line`, which only a
 * fill cell holds), so a control still never wraps.
 * It is reached by configuration, never by one long value: several `visible` columns of
 * unbreakable content in a phone-width container. A header still never breaks inside a word.
 * The list is the squeeze's, spelled out again, because Tailwind can only see a literal class.
 */
const STRAIN_CLASS =
  "in-data-strained:whitespace-normal in-data-strained:wrap-anywhere " +
  "in-data-strained:**:not-[:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd]),:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd])_*]:whitespace-normal " +
  "in-data-strained:**:not-[:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd]),:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd])_*]:wrap-anywhere " +
  "in-data-strained:**:[&:is([data-slot=avatar],[data-slot=kbd],[class~='group/stepper-node'])]:whitespace-nowrap " +
  "in-data-strained:**:[&:is([data-slot=avatar],[data-slot=kbd],[class~='group/stepper-node'])]:shrink-0 " +
  "in-data-strained:**:[&[class~='group/badge']]:h-auto " +
  "in-data-strained:**:[&[class~='group/button'][class~='hover:underline']]:h-auto " +
  "in-data-strained:**:[&[class~='group/button'][class~='hover:underline']]:min-h-6";

/**
 * The full class contract for one column's cells — alignment, the fill/fit
 * posture, and the mono numeral face. Used for body and skeleton cells alike.
 *
 * - The FILL column (`fill: true`, the primary) carries no width, so an
 *   auto-layout table hands it every pixel the fit columns leave. It wraps
 *   anywhere, so one unbroken value lowers its min-content instead of widening
 *   the table, and only it is released by the squeeze.
 * - A FIT column is content-sized: `w-0` (the "width: 1%" technique — a
 *   specified width below the content resolves to the content's min-content)
 *   plus `whitespace-nowrap`, so its min-content IS its one-line width. A fit
 *   column that opts out (`nowrap: false`) wraps between words only and shares
 *   the leftover width instead.
 *
 * @example
 * <TableCell className={columnCellClass(column, { fill: index === 0 })} />
 */
export function columnCellClass(
  column: DataTableColumnLayout,
  { fill = false }: DataTableColumnRole = {},
): string {
  const nowrap = isNowrapColumn(column, fill);
  return cn(
    alignClass(column.align),
    // Both directions are spelled out, not just the nowrap one. Batch 5 of the shadcn reset put
    // `Table` back on upstream's file, whose `TableCell` is `whitespace-nowrap` by default
    // (LAY-6 resolves as **shadcn**), so a column that wants to wrap has to say so or `cn`'s
    // merge leaves upstream's class standing.
    fill
      ? cn(
          nowrap ? "whitespace-nowrap" : "whitespace-normal wrap-anywhere",
          SQUEEZE_CLASS,
        )
      : cn(
          // Strained, a fit column gives up its content-sizing too: released text at `w-0` would
          // collapse to one character per line instead of sharing the width.
          nowrap
            ? "w-0 whitespace-nowrap in-data-strained:w-auto"
            : "whitespace-normal",
          STRAIN_CLASS,
        ),
    // Upstream's `TableCell` drops the end padding of a cell holding a checkbox (`pe-0`), and a
    // Checkbox, Switch or Radio reaches 12px past its box for its 24px pointer target
    // (`after:-inset-x-3`). In the LAST cell of a row that pseudo-element poked past the table and
    // scrolled the container 10px (a Switch, in upstream's `p-2`, 3px) once a squeeze had shrunk
    // the cell to the control (review round 4). The last cell keeps the target's 12px instead.
    "last:has-[[role=checkbox],[role=switch],[role=radio]]:pe-3",
    column.mono && "font-mono text-sm tabular-nums",
    column.numeric && "tabular-nums",
  );
}

/**
 * The class contract for ONE value in the primary cell's merged stack.
 *
 * A merged value lives inside the primary column's cell, so without a rule of
 * its own it inherits that cell's posture — and a `mono` or `align: "end"`
 * primary column is `whitespace-nowrap` with the mono face. Every value stacked
 * under it was then pinned to one line too, which widened the primary cell
 * past its budget and scrolled the table sideways: the one thing the
 * revelation exists to prevent (a mono first column measured 390px in a 320px
 * container). So each merged value states its own posture:
 *
 * - it WRAPS, whatever its own column's `nowrap` says. `wrap-anywhere` (not
 *   `wrap-break-word`) is the one that lowers the value's min-content width,
 *   which is what an auto-layout table sizes the column from; a figure only
 *   breaks when the cell is genuinely narrower than it, the alternative to
 *   which is overflowing the table.
 * - it wears ITS OWN column's face: the mono numeral face for a `mono` column,
 *   and `font-sans` otherwise, so a prose value under a mono primary is not
 *   rendered in mono.
 *
 * Shared by `DataList` and `DataGrid` so the two stacks cannot drift again.
 */
export function mergedValueClass(column: DataTableColumnLayout): string {
  return cn(
    "block min-w-0 whitespace-normal wrap-anywhere",
    column.mono ? "font-mono tabular-nums" : "font-sans",
    column.numeric && "tabular-nums",
  );
}

/**
 * The fill of a SELECTED body row, in rest, hover and press alike (SP-06: the
 * selection never flickers under the cursor).
 *
 * Half the `muted` wash, not the full `accent`. `--accent`, `--muted` and
 * `--secondary` share one value (Colors, "The neutral surfaces"), so a full
 * `bg-accent` row painted exactly the fill of a `secondary` Badge and the badge
 * vanished into its own row. Half the wash keeps the row between the page and
 * the badge fill in both themes — the badge stays distinguishable, and
 * `text-muted-foreground` stays above 4.5:1 on it (4.87:1 light, 6.84:1 dark),
 * which a darker tint fails in light (a `primary` tint reaches the badge fill
 * at 5% and drops muted text under AA by 8%). The checkbox remains the
 * authoritative selection cue.
 */
export const SELECTED_ROW_CLASS =
  "bg-muted/50 hover:bg-muted/50 active:bg-muted/50";

/** The `minWidth` a column that declares none is budgeted at. */
export const DEFAULT_COLUMN_MIN_WIDTH = 120;

/** The width budgeted for the leading selection column during revelation. */
export const SELECTION_COLUMN_WIDTH = 40;

/** The three-way split `revealColumns` returns. */
export interface ColumnRevelation<C extends DataTableColumnLayout> {
  /** Columns that keep their own header and cells, in order. */
  visibleColumns: C[];
  /** Overflow columns (`mobile: "merge"`) stacked into the primary cell. */
  mergedColumns: C[];
  /** Overflow columns (`mobile: "hidden"`) dropped — report their count. */
  hiddenColumns: C[];
}

/**
 * The responsive column revelation both renderers share. Walk the columns in
 * order, keep the ones whose cumulative `minWidth` fits `containerWidth`;
 * the primary (first) column and `mobile: "visible"` columns always stay,
 * `merge` overflow stacks into the primary cell, and only an explicit `hidden`
 * disappears — where it is COUNTED, so the host can say so. Data is never
 * silently lost.
 *
 * Hiding is right-to-left: once one hideable column no longer fits, every
 * hideable column after it overflows too — a narrow late column must not
 * survive a wide earlier one (no holes).
 *
 * `containerWidth: null` is the server (and pre-measurement) answer, and it is
 * a declared one (LAY-9): every column is shown, because a table that has not
 * been measured has no evidence that anything overflows.
 *
 * `extraOverflow` is the measured rung on top of the budget: a renderer whose
 * table still overflows once its fill cell is released (or whose fill column is
 * left narrower than its budget) asks for that many MORE columns to overflow.
 * They are taken right-to-left from the hideable shown columns, so the no-holes
 * rule holds; the primary and `visible` columns are never taken.
 *
 * @example
 * const { visibleColumns, mergedColumns, hiddenColumns } = revealColumns(
 *   columns,
 *   containerWidth,
 *   selectable ? SELECTION_COLUMN_WIDTH : 0,
 * );
 */
export function revealColumns<C extends DataTableColumnLayout>(
  columns: readonly C[],
  containerWidth: number | null,
  reservedWidth = 0,
  extraOverflow = 0,
): ColumnRevelation<C> {
  if (containerWidth == null)
    return {
      visibleColumns: [...columns],
      mergedColumns: [],
      hiddenColumns: [],
    };
  const needOf = (column: C) => column.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH;
  const alwaysShown = (column: C, index: number) =>
    index === 0 || column.mobile === "visible";
  // The first column and every `visible` column stay whatever the width, so their budgets are
  // reserved BEFORE the walk: a trailing Status or ⋯ column must not be discovered only after an
  // earlier merge column has already claimed its room (and left the row squeezed).
  let used = columns.reduce(
    (sum, column, index) =>
      alwaysShown(column, index) ? sum + needOf(column) : sum,
    reservedWidth,
  );
  const shown: C[] = [];
  const overflow: C[] = [];
  let exhausted = false;
  for (const [index, column] of columns.entries()) {
    const need = needOf(column);
    if (alwaysShown(column, index)) {
      shown.push(column);
    } else if (!exhausted && used + need <= containerWidth) {
      used += need;
      shown.push(column);
    } else {
      exhausted = true;
      overflow.push(column);
    }
  }
  // The measured rung: the last `extraOverflow` hideable shown columns overflow too.
  const taken = new Set<C>();
  for (
    let index = shown.length - 1;
    index > 0 && taken.size < extraOverflow;
    index--
  ) {
    const column = shown[index]!;
    if (column !== columns[0] && column.mobile !== "visible") taken.add(column);
  }
  if (taken.size > 0) {
    const kept = shown.filter((column) => !taken.has(column));
    const spilled = columns.filter(
      (column) => taken.has(column) || overflow.includes(column),
    );
    shown.length = 0;
    shown.push(...kept);
    overflow.length = 0;
    overflow.push(...spilled);
  }
  return {
    visibleColumns: shown,
    mergedColumns: overflow.filter(
      (column) => (column.mobile ?? "merge") === "merge",
    ),
    hiddenColumns: overflow.filter((column) => column.mobile === "hidden"),
  };
}

/**
 * `useContainerWidth` — measure an element's width and follow it with a
 * `ResizeObserver`. Returns a STABLE callback ref (attach it, or call it with
 * the element to measure) and the width, which is `null` until the first
 * measurement — the server answer `revealColumns` expects.
 *
 * Measured in a layout effect, so a client render corrects the column split
 * before first paint rather than flashing a horizontally-scrolling table.
 * By default it is the integer `clientWidth`, quantized to 1px: hiding or
 * showing a column changes the table's own width and re-fires the observer,
 * and sub-pixel oscillation must not re-render the table in a loop. With
 * `exact`, it is the fractional layout width and every change is reported.
 *
 * @example
 * const [measureRef, containerWidth] = useContainerWidth();
 * <div ref={measureRef}>…</div>
 */
export function useContainerWidth(
  options: {
    /**
     * Report every change, to the fractional pixel, instead of quantizing to
     * 1px. For a consumer whose verdict is re-taken on each change and can
     * only move one way per change (DataListPager's fit), so a sub-pixel
     * change can never feed back into itself.
     * @default false
     */
    exact?: boolean;
  } = {},
): [(element: HTMLElement | null) => void, number | null] {
  const exact = options.exact ?? false;
  const [element, setElement] = React.useState<HTMLElement | null>(null);
  const [width, setWidth] = React.useState<number | null>(null);
  const measureRef = React.useCallback(
    (next: HTMLElement | null) => setElement(next),
    [],
  );
  React.useLayoutEffect(() => {
    if (!element) return;
    const update = () =>
      setWidth((prev) => {
        if (exact) {
          // The used width, fractional and unaffected by transforms.
          const used = parseFloat(getComputedStyle(element).width);
          return Number.isFinite(used) ? used : element.clientWidth;
        }
        const next = element.clientWidth;
        return prev !== null && Math.abs(prev - next) <= 1 ? prev : next;
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, exact]);
  return [measureRef, width];
}

/** Props for `SortHeaderButton`. */
export interface SortHeaderButtonProps {
  /** The header label. */
  children: React.ReactNode;
  /**
   * Direction this column is currently sorted in, or `null` when it is not part
   * of the active sort.
   * @default null
   */
  direction?: SortDirection | null;
  /**
   * 1-based priority of this column within a MULTI-key sort. Omit for a
   * single-key sort — an ordinal on the only sort key is noise.
   * @default undefined
   */
  order?: number;
  /** Activate the sort. The event carries `shiftKey` for additive multi-sort. */
  onSort: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * The column's alignment. In an `end` column the direction glyph LEADS the
   * label, so the label's end lines up with the values' end.
   * @default "start"
   */
  align?: "start" | "center" | "end";
  /**
   * The column name the accessible label is built from ("Sort by <label>"). Defaults to
   * `children` when that is a string or number; a node header without it keeps its own
   * text content as the button's name.
   * @default undefined
   */
  label?: string;
  /**
   * The button's tab stop. A grid that roves focus over its header cells passes `-1`, so the
   * header row stays one stop and the cell (not the button) takes the keyboard.
   * @default undefined
   */
  tabIndex?: number;
  /**
   * Extra classes for the button.
   * @default undefined
   */
  className?: string;
}

/**
 * `SortHeaderButton` — the control inside a sortable header cell. A ghost
 * `Button` sized to sit inside the 32px header row, so its hover wash and its
 * focus outline are upstream's rather than restated here.
 *
 * The LABEL lines up with its column's values: 8px in from the cell's edge,
 * exactly where upstream `TableCell`'s `p-2` puts a value and `TableHead`'s
 * `px-2` puts a plain header. `SortableHead` narrows its own cell padding to
 * `px-0.5` and the button adds its 1px border and `px-1.25` (2 + 1 + 5 = 8), so
 * the hover wash still has room while the button's box never leaves its cell.
 * A negative margin here once bled 8px into the neighbouring cell and stole the
 * leading selection checkbox's 24px hit area — the geometry lane's obstruction
 * probe caught it (`docs/ledger/bugs.md`, 2026-09-09).
 *
 * The direction glyph trails the label in a start or center column. In an END
 * column it leads, so the label's end is the values' end — but it is taken out
 * of flow (absolutely placed in a start padding reserved for it) rather than
 * put first: an icon-first flex row makes the icon the baseline-defining first
 * item, and its baseline synthesizes from the svg box bottom — lifting the
 * label ~2px against its sibling headers. The label stays the only in-flow
 * child, so it defines the baseline in every alignment.
 *
 * The indicator follows the standard sort-header pattern. The ACTIVE column's
 * arrow always shows, at foreground strength. An inactive column's ⇅ is always
 * rendered (so the label never shifts) but transparent; it fades in muted while
 * a fine pointer hovers the header (`group/sort-head` on `SortableHead`, or the
 * button itself standalone) or while the button has keyboard focus. A coarse
 * pointer never hovers, so on touch only the active arrow shows; tapping still
 * sorts. The fade is opacity only — no movement — and is dropped under reduced
 * motion.
 *
 * @example
 * <SortHeaderButton direction="asc" onSort={(e) => sortBy("name", e.shiftKey)}>
 *   Name
 * </SortHeaderButton>
 */
export function SortHeaderButton({
  children,
  direction = null,
  order,
  onSort,
  align = "start",
  label,
  tabIndex,
  className,
}: SortHeaderButtonProps) {
  const leading = align === "end";
  const name =
    label ??
    (typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-slot="data-table-sort"
      aria-label={name != null ? `Sort by ${name}` : undefined}
      {...(tabIndex !== undefined && { tabIndex })}
      onClick={onSort}
      className={cn(
        // The label carries upstream `TableHead`'s own type and ink (`text-sm font-medium`,
        // `text-foreground` inherited from the cell), NOT the `sm` Button's `text-xs` or a muted
        // ink: a sortable header and a plain one sit in the same row and must read as one
        // treatment. Measured before: sortable 12px muted beside plain 14px foreground.
        "group/sort h-7 gap-1 px-1.25 text-sm font-medium select-none",
        // An end column reserves the glyph's room at the START: 5px + the 14px glyph + a 4px
        // gap, and a one-digit multi-sort ordinal (2px gap + ~7px) when there is one.
        leading && (order != null ? "ps-8" : "ps-5.75"),
        // A header label never breaks inside a word: the squeeze releases the fill cell only, and
        // the last rung (`data-strained`) lets a label wrap between its words.
        "in-data-strained:h-auto in-data-strained:min-h-7 in-data-strained:text-start in-data-strained:whitespace-normal",
        className,
      )}
    >
      {children}
      <span
        aria-hidden
        data-slot="data-table-sort-glyph"
        className={cn(
          "inline-flex items-center gap-0.5",
          leading && "absolute start-1.25 top-1/2 -translate-y-1/2",
          direction
            ? "text-foreground"
            : // Inactive: reserved but invisible; a fine-pointer hover on the header (or the
              // button) or keyboard focus fades it in muted. Touch never hovers, so it stays hidden.
              "text-muted-foreground opacity-0 transition-opacity duration-fast ease-standard pointer-fine:group-hover/sort:opacity-100 pointer-fine:group-hover/sort-head:opacity-100 group-focus-visible/sort:opacity-100",
        )}
      >
        {direction ? (
          <>
            {direction === "asc" ? (
              <ArrowUp className="size-3.5" />
            ) : (
              <ArrowDown className="size-3.5" />
            )}
            {order != null ? <span className="text-xs">{order}</span> : null}
          </>
        ) : (
          <ChevronsUpDown className="size-3.5" />
        )}
      </span>
    </Button>
  );
}

/** The column facts a header cell needs, on top of the shared layout. */
export interface DataTableHeaderColumn extends DataTableColumnLayout {
  /** Header label. A string or any node for custom header layouts. */
  header: React.ReactNode;
  /**
   * Clicking the header sorts by this column.
   * @default false
   */
  sortable?: boolean;
  /**
   * Extra className applied to the header cell.
   * @default undefined
   */
  headerClassName?: string;
}

/**
 * The sentence that keeps a sort discoverable once its column has left the
 * header row, or `null` when every sorted column still has its own header.
 *
 * Revelation can merge or hide the very column the table is sorted by — a
 * narrow container, or a sort set by the host on a late column. Its header,
 * and with it the arrow and `aria-sort`, is then gone, and nothing on screen
 * or in the accessibility tree says what order the rows are in. Both
 * renderers print this line beside their hidden-columns count and describe
 * the table by it, rather than force the sorted column visible (which would
 * re-open the horizontal scroll the revelation exists to prevent).
 *
 * @example
 * offscreenSortSummary([{ key: "email", direction: "asc" }], columns, visibleColumns);
 * // "Sorted by Email, ascending"
 */
export function offscreenSortSummary(
  sort: readonly { key: string; direction: SortDirection }[],
  columns: readonly DataTableHeaderColumn[],
  visibleColumns: readonly Pick<DataTableColumnLayout, "key">[],
): string | null {
  const shown = new Set(visibleColumns.map((column) => column.key));
  // Multi-key: once any key is off screen the whole order is stated, because a
  // secondary key only means something after its primary.
  if (sort.every((entry) => shown.has(entry.key))) return null;
  const label = (key: string) => {
    const column = columns.find((candidate) => candidate.key === key);
    return typeof column?.header === "string" ? column.header : key;
  };
  return `Sorted by ${sort
    .map(
      (entry) =>
        `${label(entry.key)}, ${entry.direction === "asc" ? "ascending" : "descending"}`,
    )
    .join(", then ")}`;
}

/** Props for `SortableHead`. */
export interface SortableHeadProps extends Omit<
  React.ComponentProps<"th">,
  "children"
> {
  /** The column this header cell describes. */
  column: DataTableHeaderColumn;
  /**
   * Direction this column is currently sorted in, or `null` when it is not part
   * of the active sort.
   * @default null
   */
  direction?: SortDirection | null;
  /**
   * 1-based priority within a multi-key sort. Omit for a single-key sort.
   * @default undefined
   */
  order?: number;
  /**
   * Activate the sort. Omitted (or with `column.sortable` false) the header
   * renders as static text.
   * @default undefined
   */
  onSort?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * This header heads the FILL column (the primary), which takes the leftover width; every
   * other header is content-sized with its fit column.
   * @default false
   */
  fill?: boolean;
}

/**
 * The class contract for one column's HEADER cell (DS-01): the same alignment and fill/fit width
 * as its body cells, but always on ONE line — a header never breaks, inside a word or between
 * words, and the squeeze never reaches it (it once read "Prod" / "ucts") — and always in the sans
 * face: a header is a label, not a value. A `mono` column's header keeps `tabular-nums` only, so
 * a numeric header's digits (a year, a unit count) still align with the column.
 *
 * @example
 * <TableHead className={headerCellClass(column, { fill: index === 0 })}>{column.header}</TableHead>
 */
export function headerCellClass(
  column: DataTableColumnLayout,
  { fill = false }: DataTableColumnRole = {},
): string {
  return cn(
    alignClass(column.align),
    !fill && isNowrapColumn(column) && "w-0 in-data-strained:w-auto",
    // On the last rung a header may wrap BETWEEN words, never inside one.
    "whitespace-nowrap in-data-strained:whitespace-normal",
    column.mono && "tabular-nums",
  );
}

/**
 * `SortableHead` — one header cell, with the sort affordance and the ARIA the
 * sort state owes assistive technology (`aria-sort`, plus the `data-sortable` /
 * `data-sorted` hooks consumers style against).
 *
 * `aria-sort` is emitted on EVERY sortable column, `"none"` included: a table
 * that only marks the active column tells a screen-reader user which column is
 * sorted but never which ones they could sort.
 *
 * @example
 * <SortableHead column={col} direction="asc" onSort={(e) => sortBy(col.key, e.shiftKey)} />
 */
export function SortableHead({
  column,
  direction = null,
  order,
  onSort,
  fill = false,
  className,
  ...props
}: SortableHeadProps) {
  const sortable = column.sortable === true && onSort != null;
  return (
    <TableHead
      data-sortable={sortable ? "" : undefined}
      data-sorted={direction ?? undefined}
      aria-sort={
        sortable
          ? direction === "asc"
            ? "ascending"
            : direction === "desc"
              ? "descending"
              : "none"
          : undefined
      }
      className={cn(
        headerCellClass(column, { fill }),
        // The sort control carries the cell's inline padding so its box stays
        // inside the cell: 2px here + the button's 1px border and 5px padding
        // put the label 8px in — on its values' edge, like a plain header.
        sortable && "group/sort-head px-0.5",
        column.headerClassName,
        className,
      )}
      {...props}
    >
      {sortable ? (
        <SortHeaderButton
          direction={direction}
          order={order}
          onSort={onSort}
          align={column.align}
          label={typeof column.header === "string" ? column.header : undefined}
        >
          {column.header}
        </SortHeaderButton>
      ) : (
        column.header
      )}
    </TableHead>
  );
}

/** Props for `SelectAllHead`. */
export interface SelectAllHeadProps extends Omit<
  React.ComponentProps<"th">,
  "children"
> {
  /** Every row in the current view is selected. */
  checked: boolean;
  /** Some but not all rows in the current view are selected. */
  indeterminate: boolean;
  /** Toggle every row in the current view. */
  onToggle: () => void;
  /**
   * Disable the control (no rows, or rows still loading).
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessible name for the checkbox.
   * @default "Select all rows"
   */
  label?: string;
  /**
   * The checkbox's tab stop; a grid that roves focus over its header passes `0` or `-1`.
   * @default undefined
   */
  controlTabIndex?: number;
  /**
   * Ref to the checkbox — the focus target a roving grid moves to.
   * @default undefined
   */
  controlRef?: React.Ref<HTMLElement>;
}

/**
 * `SelectAllHead` — the leading header cell holding the tri-state select-all
 * checkbox. Shrink-to-fit, so it opts out of the wrapping floor the other
 * columns take.
 *
 * @example
 * <SelectAllHead checked={allSelected} indeterminate={indeterminate} onToggle={toggleAll} />
 */
export function SelectAllHead({
  checked,
  indeterminate,
  onToggle,
  disabled = false,
  label = "Select all rows",
  controlTabIndex,
  controlRef,
  className,
  ...props
}: SelectAllHeadProps) {
  return (
    <TableHead
      data-slot="data-table-select-all"
      // `pe-2!` reinstates the trailing padding upstream's `TableHead` removes with
      // `[&:has([role=checkbox])]:pe-0`. Since Batch 5 put `Table` back on upstream's file the head
      // is `h-10 px-2`, which is tighter than the pre-reset cell, and with no trailing padding the
      // checkbox's centred 24px pointer target crossed into the next column and was taken by the
      // sort-header Button (A11Y-2, measured by the geometry lane). Eight pixels of inline-end
      // padding keep the square inside this cell without moving the checkbox.
      className={cn("w-0 pe-2!", className)}
      {...props}
    >
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label={label}
        {...(controlTabIndex !== undefined && { tabIndex: controlTabIndex })}
        ref={controlRef}
      />
    </TableHead>
  );
}

/** Props for `SelectionCell`. */
export interface SelectionCellProps extends Omit<
  React.ComponentProps<"td">,
  "children"
> {
  /** This row is selected. */
  checked: boolean;
  /** Toggle this row. */
  onToggle: () => void;
  /** Accessible name for the checkbox — name the row, not the column. */
  label: string;
  /**
   * The checkbox's tab stop; a grid that roves focus over its cells passes `0` or `-1`.
   * @default undefined
   */
  controlTabIndex?: number;
  /**
   * Ref to the checkbox — the focus target a roving grid moves to.
   * @default undefined
   */
  controlRef?: React.Ref<HTMLElement>;
}

/**
 * `SelectionCell` — the leading body cell holding one row's selection checkbox.
 *
 * It stops mouse propagation as defence in depth: a clickable row already
 * ignores clicks that originate on an interactive descendant, but toggling
 * selection must never also activate the row even if that guard is bypassed.
 *
 * @example
 * <SelectionCell checked={isSelected} onToggle={() => toggleRow(id)} label={`Select row ${index + 1}`} />
 */
export function SelectionCell({
  checked,
  onToggle,
  label,
  controlTabIndex,
  controlRef,
  className,
  onClick,
  ...props
}: SelectionCellProps) {
  return (
    <TableCell
      data-slot="data-table-selection-cell"
      // Same as `SelectAllHead`: upstream's `[&:has([role=checkbox])]:pe-0` would let the
      // checkbox's 24px pointer target spill into the next column (A11Y-2).
      className={cn("w-0 pe-2!", className)}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      {...props}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        aria-label={label}
        {...(controlTabIndex !== undefined && { tabIndex: controlTabIndex })}
        ref={controlRef}
      />
    </TableCell>
  );
}

/** Props for `SkeletonRows`. */
export interface SkeletonRowsProps {
  /** The columns being rendered, so the placeholder matches the real geometry. */
  columns: DataTableColumnLayout[];
  /**
   * How many placeholder rows to draw.
   * @default 5
   */
  rows?: number;
  /**
   * Draw the leading selection column's placeholder.
   * @default false
   */
  selectable?: boolean;
  /**
   * `data-slot` for each placeholder row, so each renderer keeps its own
   * selector surface.
   * @default "data-table-skeleton-row"
   */
  slot?: string;
}

/** The widest placeholder bar, in spacing steps (10rem): a phone's primary column always fits it. */
const SKELETON_BAR_MAX_STEPS = 40;

/**
 * A placeholder's shape: a bar about 70% of the column's `minWidth` budget (the width its real
 * values are sized for, capped at 10rem), so a loading table's columns settle where the loaded
 * table's do; a narrow icon column (a row's ⋯ menu) gets an icon-sized square. In spacing steps,
 * never pixels.
 */
function skeletonBar(column: DataTableColumnLayout): {
  className: string;
  style?: React.CSSProperties;
} {
  const budget = column.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH;
  if (budget <= 48) return { className: "size-6" };
  const steps = Math.min(
    SKELETON_BAR_MAX_STEPS,
    Math.round((budget * 0.7) / 4),
  );
  return {
    className: "h-4 max-w-full",
    style: { width: `calc(var(--spacing) * ${steps})` },
  };
}

/**
 * `SkeletonRows` — the loading state. Rows are `aria-hidden`: the announcement
 * belongs to the table's own busy/live wiring, not to a wall of placeholders.
 *
 * @example
 * <TableBody><SkeletonRows columns={columns} rows={5} selectable /></TableBody>
 */
export function SkeletonRows({
  columns,
  rows = 5,
  selectable = false,
  slot = "data-table-skeleton-row",
}: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: Math.max(1, rows) }, (_, rowIndex) => (
        <TableRow
          key={`skeleton-${rowIndex}`}
          data-slot={slot}
          aria-hidden="true"
        >
          {selectable ? (
            <TableCell className="w-0">
              <Skeleton className="size-3.5 rounded-sm" />
            </TableCell>
          ) : null}
          {columns.map((column, index) => {
            const bar = skeletonBar(column);
            return (
              <TableCell
                key={column.key}
                className={columnCellClass(column, { fill: index === 0 })}
              >
                <Skeleton
                  className={cn(
                    bar.className,
                    column.align === "end"
                      ? "ms-auto"
                      : column.align === "center" && "mx-auto",
                  )}
                  style={bar.style}
                />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}

/** Props for `EmptyRow`. */
export interface EmptyRowProps {
  /** How many columns the empty state spans. */
  colSpan: number;
  /**
   * A custom empty state. Omit for the built-in `Empty` composition.
   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * `data-slot` for the row, so each renderer keeps its own selector surface.
   * @default "data-table-empty-row"
   */
  slot?: string;
}

/**
 * `EmptyRow` — the "no records" state, rendered as a real full-width row so the
 * table keeps valid semantics instead of collapsing to a bare div.
 *
 * @example
 * <TableBody><EmptyRow colSpan={columns.length + 1} /></TableBody>
 */
export function EmptyRow({
  colSpan,
  children,
  slot = "data-table-empty-row",
}: EmptyRowProps) {
  return (
    <TableRow data-slot={slot} className="hover:bg-transparent">
      {/* `p-2`: a custom empty node never touches the header row above it. */}
      <TableCell colSpan={colSpan} className="min-w-0 p-2">
        {children ?? (
          <Empty icon={<Inbox aria-hidden />}>
            <EmptyHeader>
              <EmptyTitle>Nothing here</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </TableCell>
    </TableRow>
  );
}

/** One item of a row's actions menu. */
export interface RowActionItem {
  /**
   * An item (the default). `{ type: "separator" }` is the other kind of entry.
   * @default "item"
   */
  type?: "item";
  /** The item's text, and its accessible name. */
  label: string;
  /**
   * Run the action. Omit for a link action that passes `render`.
   * @default undefined
   */
  onSelect?: () => void;
  /**
   * Render the item as another element — `<a href="…" />` or a router `Link` — so the action
   * is a real link that opens in a new tab on ⌘-click.
   * @default undefined
   */
  render?: React.ReactElement;
  /**
   * Paint the item in the destructive ink (delete, archive).
   * @default false
   */
  destructive?: boolean;
  /**
   * Keep the item in the menu but unavailable. It stays reachable by arrow keys.
   * @default false
   */
  disabled?: boolean;
  /**
   * Why a disabled item is unavailable — a tooltip on the item, read as its description.
   * @default undefined
   */
  disabledReason?: string;
  /**
   * A leading icon. A row with exactly one action that has an icon shows it as an icon button
   * with a tooltip instead of a menu.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * Tick the item as the current choice (the current status in "Change status ›"). A ticked item
   * still runs `onSelect`.
   * @default undefined
   */
  checked?: boolean;
  /**
   * A one-key shortcut shown at the item's end. Pressing the key while its menu is open picks it
   * (the Status menu's 1–7 and 0).
   * @default undefined
   */
  shortcut?: string;
  /**
   * Draw a separator above this item — to set a destructive action apart from the rest.
   * @default false
   */
  separatorBefore?: boolean;
  /**
   * Nested actions: the item opens a submenu ("Change status ›", "Assign ›") listing these
   * entries instead of running `onSelect`. Separators and further nesting work the same way.
   * @default undefined
   */
  items?: RowAction[];
  /**
   * Custom submenu content (a searched, paged list such as "Assign › people"): compose it from a
   * `PanelSearch` row and a `PanelList` of `DropdownMenuItem`s. Alongside it, `items` are the
   * list's static actions ("Assign to me", "Unassign") and render in a `PanelActions` footer
   * below it — give each an `icon`.
   * @default undefined
   */
  submenu?: React.ReactNode;
}

/** A divider between groups of row actions: `{ type: "separator" }`. */
export interface RowActionSeparator {
  /** Marks the entry as a separator. */
  type: "separator";
}

/**
 * One entry of a row's actions menu — an item, or `{ type: "separator" }` between groups.
 * Leading, trailing and doubled separators are dropped.
 */
export type RowAction = RowActionItem | RowActionSeparator;

/** True for a real item (not a separator). */
export function isRowActionItem(action: RowAction): action is RowActionItem {
  return action.type !== "separator";
}

/**
 * The entries as items, each marked when a separator (or `separatorBefore`) precedes it — with
 * leading, trailing and doubled separators dropped.
 */
function withSeparators(actions: RowAction[]) {
  const out: { action: RowActionItem; separated: boolean }[] = [];
  let pending = false;
  for (const action of actions) {
    if (!isRowActionItem(action)) {
      pending = true;
      continue;
    }
    out.push({
      action,
      separated: out.length > 0 && (pending || !!action.separatorBefore),
    });
    pending = false;
  }
  return out;
}

/**
 * A menu's one-key shortcuts: pressing an item's `shortcut` clicks that item (which also closes
 * the menu), ahead of the menu's typeahead.
 */
export function pickShortcut(event: React.KeyboardEvent<HTMLElement>) {
  if (event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1)
    return;
  const item = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      "[data-row-action-shortcut]",
    ),
  ).find(
    (node) =>
      node.dataset.rowActionShortcut === event.key.toUpperCase() &&
      !node.hasAttribute("data-disabled"),
  );
  if (!item) return;
  event.preventDefault();
  event.stopPropagation();
  item.click();
}

/**
 * `RowActionMenuItems` — a `RowAction[]` as dropdown menu items, for a host that already owns
 * a menu (Board's card menu, SortableList's row menu) and merges its own items after them.
 * `onAction` runs before each action's `onSelect` — the host's hook to keep focus in the list
 * when the action removes the row.
 *
 * @example
 * <DropdownMenuContent>
 *   <RowActionMenuItems actions={actions} />
 *   <DropdownMenuSeparator />
 *   {moveItems}
 * </DropdownMenuContent>
 */
export function RowActionMenuItems({
  actions,
  onAction,
}: {
  actions: RowAction[];
  onAction?: () => void;
}) {
  return (
    <>
      {withSeparators(actions).map(({ action, separated }) => (
        <React.Fragment key={action.label}>
          {separated ? <DropdownMenuSeparator /> : null}
          {action.submenu ||
          (action.items && action.items.some(isRowActionItem)) ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                data-slot="row-action-submenu-trigger"
                disabled={action.disabled}
                className={cn(action.destructive && "text-destructive-text")}
              >
                {action.icon}
                {action.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                // A person list (the `submenu` slot) gets room for a name over an email.
                className={action.submenu ? "min-w-72" : "min-w-48"}
                onKeyDown={pickShortcut}
              >
                {action.submenu ? (
                  <>
                    {action.submenu}
                    {action.items?.some(isRowActionItem) ? (
                      // Beside a searched list, `items` are its static actions ("Assign to
                      // me", "Unassign"): a footer under the list, not rows above the search.
                      <PanelActions>
                        <RowActionMenuItems
                          actions={action.items}
                          onAction={onAction}
                        />
                      </PanelActions>
                    ) : null}
                  </>
                ) : (
                  <RowActionMenuItems
                    actions={action.items ?? []}
                    onAction={onAction}
                  />
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <RowActionMenuItem action={action} onAction={onAction} />
          )}
        </React.Fragment>
      ))}
    </>
  );
}

/**
 * One plain row action. A disabled item's `disabledReason` is a tooltip on the item (and its
 * accessible description), never a wrapped second line inside the menu.
 */
function RowActionMenuItem({
  action,
  onAction,
}: {
  action: RowActionItem;
  onAction?: () => void;
}) {
  const reasonId = React.useId();
  const reason = action.disabled ? action.disabledReason : undefined;
  const item = (
    <DropdownMenuItem
      variant={action.destructive ? "destructive" : "default"}
      disabled={action.disabled}
      render={action.render}
      aria-describedby={reason ? reasonId : undefined}
      data-row-action-shortcut={action.shortcut?.toUpperCase()}
      onClick={
        action.disabled || !action.onSelect
          ? undefined
          : () => {
              onAction?.();
              action.onSelect?.();
            }
      }
    >
      {action.icon}
      {action.label}
      {action.checked ? <span className="sr-only">(current)</span> : null}
      {action.checked ? (
        <Check
          data-slot="row-action-check"
          aria-hidden="true"
          className={cn(!action.shortcut && "ms-auto")}
        />
      ) : null}
      {action.shortcut ? (
        <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
      ) : null}
      {reason ? (
        <span id={reasonId} hidden>
          {reason}
        </span>
      ) : null}
    </DropdownMenuItem>
  );
  if (!reason) return item;
  return (
    <Tooltip>
      <TooltipTrigger render={item} />
      <TooltipContent side="left">{reason}</TooltipContent>
    </Tooltip>
  );
}

/** Props accepted by `RowActionsMenu`. */
export interface RowActionsMenuProps {
  /** The row's name, used in the trigger's accessible name. */
  label: string;
  /** The actions, in menu order. Renders nothing when empty. */
  actions: RowAction[];
  /**
   * The trigger's accessible name, from the row's label.
   * @default (label) => `Actions for ${label}`
   */
  actionsLabel?: (label: string) => string;
}

/** The default name of a row's ⋯ trigger — shared by DataList, SortableList and Board. */
export const defaultActionsLabel = (label: string) => `Actions for ${label}`;

/**
 * `RowActionsMenu` — one ⋯ menu per row, named for the row ("Actions for Aria"). A row with a
 * single icon action gets that action as an icon button with a tooltip instead.
 *
 * @example
 * <RowActionsMenu
 *   label={product.name}
 *   actions={[
 *     { label: "Edit", onSelect: () => edit(product) },
 *     { label: "Delete", destructive: true, disabled: inUse, disabledReason: "In use by 3 lists" },
 *   ]}
 * />
 */
export function RowActionsMenu({
  label,
  actions,
  actionsLabel = defaultActionsLabel,
}: RowActionsMenuProps) {
  const reasonId = React.useId();
  const items = actions.filter(isRowActionItem);
  if (items.length === 0) return null;
  const only = items.length === 1 ? items[0]! : null;
  if (only && only.icon != null && !only.items && !only.submenu) {
    const name = `${only.label} ${label}`;
    // A tooltip is not a description: a disabled icon action says why through a hidden element.
    const reason = only.disabled ? only.disabledReason : undefined;
    return (
      <>
        {reason ? (
          <span id={reasonId} hidden>
            {reason}
          </span>
        ) : null}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                data-slot="row-actions-menu-action"
                aria-label={name}
                aria-describedby={reason ? reasonId : undefined}
                disabled={only.disabled}
                render={only.render}
                nativeButton={only.render == null}
                onClick={only.disabled ? undefined : only.onSelect}
                className={cn(only.destructive && "text-destructive-text")}
              >
                {only.icon}
              </Button>
            }
          />
          <TooltipContent>{reason ?? only.label}</TooltipContent>
        </Tooltip>
      </>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            data-slot="row-actions-menu-trigger"
            aria-label={actionsLabel(label)}
          >
            <Ellipsis />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        data-slot="row-actions-menu-content"
        className="w-max min-w-48 max-w-72 whitespace-nowrap"
        onKeyDown={pickShortcut}
      >
        <RowActionMenuItems actions={actions} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Collapsed or expanded, per section (DataList) or group (DataGrid) id. */
export type GroupState = Record<string, "expanded" | "collapsed">;

/** Props accepted by `SectionToggle`. */
export interface SectionToggleProps {
  /** The section's name. */
  label: React.ReactNode;
  /**
   * How many rows the section holds. Shown muted, in tabular numerals, after the label.
   * @default undefined
   */
  count?: number;
  /** Whether the section's rows are shown. */
  expanded: boolean;
  /** Called with the next expanded state when the toggle is activated. */
  onExpandedChange: (expanded: boolean) => void;
  /**
   * The count as a screen reader hears it.
   * @default (n) => `${n} rows` ("1 row" for one)
   */
  countLabel?: (count: number) => string;
  /**
   * The toggle's tab stop. A grid that roves focus over its rows passes `0` or `-1`.
   * @default undefined
   */
  tabIndex?: number;
  /**
   * Ref to the toggle button — the focus target a roving grid moves to.
   * @default undefined
   */
  ref?: React.Ref<HTMLButtonElement>;
}

const defaultCountLabel = (n: number) => `${n} ${n === 1 ? "row" : "rows"}`;

/**
 * `SectionToggle` — the disclosure button a section or group header carries: a chevron, the
 * label, and a muted tabular count. DataGrid's group row and `SectionRow` both render it.
 *
 * @example
 * <SectionToggle label="Overdue" count={3} expanded={open} onExpandedChange={setOpen} />
 */
export function SectionToggle({
  label,
  count,
  expanded,
  onExpandedChange,
  countLabel = defaultCountLabel,
  tabIndex,
  ref,
}: SectionToggleProps) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="xs"
      data-slot="section-toggle"
      {...(tabIndex !== undefined && { tabIndex })}
      aria-expanded={expanded}
      onClick={() => onExpandedChange(!expanded)}
      // `aria-expanded` on upstream's ghost Button means "this control's POPUP is open", and it
      // paints `bg-muted text-foreground` to say so. Here it means "this SECTION is expanded",
      // the resting state of every section — so the two neutralisers keep the resting header
      // quiet and leave hover and press to the variant.
      className={cn(
        // design.md "Headings": a table section row is a group label.
        "-mx-2 min-w-0 justify-start text-xs font-medium text-muted-foreground",
        "aria-expanded:bg-transparent aria-expanded:text-muted-foreground",
        "[&_svg:not([class*='size-'])]:size-3",
      )}
    >
      {expanded ? <ChevronDown /> : <ChevronRight className="rtl:rotate-180" />}
      <span className="min-w-0 truncate">{label}</span>
      {count != null ? (
        <>
          <span
            aria-hidden="true"
            data-slot="section-row-count"
            className="text-muted-foreground tabular-nums"
          >
            {count}
          </span>
          <span className="sr-only">, {countLabel(count)}</span>
        </>
      ) : null}
    </Button>
  );
}

/** Props accepted by `SectionRow`. */
export interface SectionRowProps extends SectionToggleProps {
  /** The section's id (reflected as `data-section`). */
  id: string;
  /** How many columns the header spans. */
  colSpan: number;
}

/**
 * `SectionRow` — a section's header row: one `th scope="rowgroup"` spanning the table, holding
 * a `SectionToggle`. Put it first in the section's own `<tbody>`, so the header names every row
 * below it.
 *
 * @example
 * <TableBody>
 *   <SectionRow id="overdue" label="Overdue" count={3} colSpan={4} expanded onExpandedChange={toggle} />
 *   {rows}
 * </TableBody>
 */
export function SectionRow({ id, colSpan, ...toggle }: SectionRowProps) {
  return (
    <TableRow
      data-slot="section-row"
      data-section={id}
      className="bg-muted hover:bg-muted active:bg-muted"
    >
      <TableHead scope="rowgroup" colSpan={colSpan} className="h-auto py-1">
        <SectionToggle {...toggle} />
      </TableHead>
    </TableRow>
  );
}

/**
 * The next sort state after activating `key`.
 *
 * One cycle serves both renderers: `asc → desc → cleared`, so a third click on a
 * header removes that key rather than trapping the user in a sort they cannot
 * undo. `additive` (shift-click) keeps the existing keys and appends, capped at
 * `maxKeys` by dropping the OLDEST — a cap that dropped the newest would make
 * the last click do nothing.
 */
export function cycleSort(
  active: readonly { key: string; direction: SortDirection }[],
  key: string,
  {
    additive = false,
    maxKeys = 1,
  }: { additive?: boolean; maxKeys?: number } = {},
): { key: string; direction: SortDirection }[] {
  const existing = active.find((entry) => entry.key === key);
  if (!existing) {
    const base = additive ? active : [];
    return [...base, { key, direction: "asc" as const }].slice(-maxKeys);
  }
  if (existing.direction === "asc")
    return active.map((entry) =>
      entry.key === key ? { key, direction: "desc" as const } : entry,
    );
  return active.filter((entry) => entry.key !== key);
}

/**
 * The house controlled-optional state idiom, once. `controlled !== undefined`
 * means the host owns the value (including a deliberate `null`); otherwise the
 * hook keeps its own and still reports every change.
 */
export function useControlledState<T>(
  controlled: T | undefined,
  initial: T,
  onChange?: (next: T) => void,
): [T, (next: T) => void] {
  const [internal, setInternal] = React.useState<T>(initial);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : internal;
  const commit = React.useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [value, commit];
}

/** Options accepted by `useRowSelection`. */
export interface UseRowSelectionOptions {
  /** Row ids in the CURRENT view, in display order. */
  rowIds: string[];
  /**
   * Controlled selection. Omit for uncontrolled (the hook keeps its own set).
   * @default undefined
   */
  selectedIds?: Set<string>;
  /**
   * Fired with the next selection.
   * @default undefined
   */
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

/** What `useRowSelection` returns. */
export interface UseRowSelectionResult {
  /** The effective selection (controlled set, or the hook's own). */
  selected: Set<string>;
  /** Every row in the current view is selected. */
  allSelected: boolean;
  /** At least one row in the current view is selected. */
  someSelected: boolean;
  /** Some but not all — the tri-state checkbox's middle position. */
  indeterminate: boolean;
  /** Select or clear every row in the current view. */
  toggleAll: () => void;
  /** Toggle one row. */
  toggleRow: (id: string) => void;
  /** Replace the whole selection — a range, select-all from the keyboard, or clear. */
  setSelected: (next: Set<string>) => void;
}

/**
 * `useRowSelection` — controlled-optional row selection arithmetic.
 *
 * Every operation is scoped to the CURRENT VIEW's ids and derives the next set
 * from the existing one, so selections for rows outside `rowIds` (another page,
 * a filtered-out row) always survive. With host-owned paging and filtering the
 * visible rows are only ever a slice, so select-all UNIONS the current ids onto
 * the selection and clearing REMOVES only the current ids — it never wipes what
 * the user cannot see.
 */
export function useRowSelection({
  rowIds,
  selectedIds,
  onSelectionChange,
}: UseRowSelectionOptions): UseRowSelectionResult {
  const [internal, setInternal] = React.useState<Set<string>>(() => new Set());
  const isControlled = selectedIds != null;
  const selected = isControlled ? selectedIds : internal;

  const commit = React.useCallback(
    (next: Set<string>) => {
      if (!isControlled) setInternal(next);
      onSelectionChange?.(next);
    },
    [isControlled, onSelectionChange],
  );

  // Memoised: a grid re-renders its parent on every column-window move, and these scan every
  // loaded id — 50,000 of them in a spreadsheet-sized grid.
  const { allSelected, someSelected } = React.useMemo(() => {
    if (selected.size === 0) return { allSelected: false, someSelected: false };
    let all = rowIds.length > 0;
    let some = false;
    for (const id of rowIds) {
      if (selected.has(id)) some = true;
      else all = false;
      if (some && !all) break;
    }
    return { allSelected: all, someSelected: some };
  }, [rowIds, selected]);

  const toggleAll = React.useCallback(() => {
    const next = new Set(selected);
    if (allSelected) for (const id of rowIds) next.delete(id);
    else for (const id of rowIds) next.add(id);
    commit(next);
  }, [allSelected, rowIds, selected, commit]);

  const toggleRow = React.useCallback(
    (id: string) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      commit(next);
    },
    [selected, commit],
  );

  return {
    selected,
    allSelected,
    someSelected,
    indeterminate: someSelected && !allSelected,
    toggleAll,
    toggleRow,
    setSelected: commit,
  };
}

/** Props accepted by `ColumnResizeHandle`. */
export interface ColumnResizeHandleProps {
  /** The column's name; the handle is announced as "Resize {label}". */
  label: string;
  /** The column's current width, in pixels (`aria-valuenow`). */
  width: number;
  /**
   * The narrowest the column may become, in pixels.
   * @default 64
   */
  min?: number;
  /**
   * The widest the column may become, in pixels.
   * @default 960
   */
  max?: number;
  /** Called with each new width while a drag moves, and for every keyboard step. */
  onResize: (width: number) => void;
  /**
   * Called with the final width when a drag ends, and after every keyboard step — the moment a
   * host persists it.
   * @default undefined
   */
  onResizeEnd?: (width: number) => void;
  /**
   * Called on double-click: fit the column to its content (the host or the grid measures it).
   * @default undefined
   */
  onAutoFit?: () => void;
  /**
   * The handle's tab stop. Standalone it is a stop of its own; a grid that roves focus over its
   * header passes `-1` and drives the same steps from the header cell.
   * @default 0
   */
  tabIndex?: number;
  /**
   * Extra classes for the handle.
   * @default undefined
   */
  className?: string;
}

/** One keyboard step, in pixels; Shift multiplies it by four. */
export const COLUMN_RESIZE_STEP = 8;

/** The width a keyboard key resizes to, or `null` when the key is not a resize key. */
export function columnResizeKeyWidth(
  key: string,
  shiftKey: boolean,
  width: number,
  {
    min = 64,
    max = 960,
    rtl = false,
  }: { min?: number; max?: number; rtl?: boolean } = {},
): number | null {
  const step = shiftKey ? COLUMN_RESIZE_STEP * 4 : COLUMN_RESIZE_STEP;
  const grow = rtl ? "ArrowLeft" : "ArrowRight";
  const shrink = rtl ? "ArrowRight" : "ArrowLeft";
  const next =
    key === grow
      ? width + step
      : key === shrink
        ? width - step
        : key === "Home"
          ? min
          : key === "End"
            ? max
            : null;
  return next == null ? null : Math.min(max, Math.max(min, next));
}

/**
 * `ColumnResizeHandle` — the grip on a header cell's trailing edge. A `separator` with
 * `aria-orientation="vertical"` and its value range, so assistive technology hears "Resize Qty,
 * 160". Drag moves the edge; <kbd>←</kbd>/<kbd>→</kbd> step 8px (<kbd>Shift</kbd> 32px),
 * <kbd>Home</kbd>/<kbd>End</kbd> jump to the minimum and maximum; double-click fits the content.
 * The hit area is 24px wide, centred on the edge, and its visible line shows on hover and focus.
 * Put it inside a `relative` header cell.
 *
 * @example
 * <TableHead className="relative">
 *   Qty
 *   <ColumnResizeHandle label="Qty" width={width} onResize={setWidth} onResizeEnd={save} />
 * </TableHead>
 */
export function ColumnResizeHandle({
  label,
  width,
  min = 64,
  max = 960,
  onResize,
  onResizeEnd,
  onAutoFit,
  tabIndex = 0,
  className,
}: ColumnResizeHandleProps) {
  const drag = React.useRef<{ x: number; width: number; last: number } | null>(
    null,
  );
  const [resizing, setResizing] = React.useState(false);
  const clamp = (next: number) =>
    Math.round(Math.min(max, Math.max(min, next)));
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label}`}
      aria-valuenow={Math.round(width)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={tabIndex}
      data-slot="column-resize-handle"
      data-resizing={resizing ? "" : undefined}
      className={cn(
        // 24px of hit area centred on the cell's trailing edge; the 2px line is the visible part.
        "group/resize absolute inset-y-0 -end-3 z-10 flex w-6 cursor-col-resize touch-none justify-center outline-none select-none",
        className,
      )}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onAutoFit?.();
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, width, last: width };
        setResizing(true);
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!start) return;
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
        const delta = (event.clientX - start.x) * (rtl ? -1 : 1);
        const next = clamp(start.width + delta);
        if (next === start.last) return;
        start.last = next;
        onResize(next);
      }}
      onPointerUp={(event) => {
        const start = drag.current;
        if (!start) return;
        drag.current = null;
        setResizing(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
        if (start.last !== start.width) onResizeEnd?.(start.last);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setResizing(false);
      }}
      onKeyDown={(event) => {
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
        const next = columnResizeKeyWidth(event.key, event.shiftKey, width, {
          min,
          max,
          rtl,
        });
        if (next == null) return;
        event.preventDefault();
        event.stopPropagation();
        if (next === width) return;
        onResize(next);
        onResizeEnd?.(next);
      }}
    >
      <span
        aria-hidden
        className="h-full w-0.5 bg-transparent transition-colors group-hover/resize:bg-border group-focus-visible/resize:bg-ring group-data-resizing/resize:bg-ring"
      />
    </div>
  );
}

/** One summary function a footer cell offers (`Sum`, `Average`, …). */
export interface GridSummaryOption {
  /** The function's id, handed back through `onValueChange`. */
  value: string;
  /** What the menu and the trigger show: "Sum". */
  label: string;
}

/** Props accepted by `GridSummaryCell`. */
export interface GridSummaryCellProps extends Omit<
  React.ComponentProps<"td">,
  "children"
> {
  /** The column's name, for the trigger's accessible name ("Sum of Qty"). */
  columnLabel: string;
  /** The functions this column offers. A built-in "None" item (`null`) comes first. */
  options: readonly GridSummaryOption[];
  /** The chosen function, or `null` for none. */
  value: string | null;
  /** Called with the next function (`null` for none). */
  onValueChange: (value: string | null) => void;
  /**
   * The computed result for the chosen function — the host computes it (on the server, over the
   * filtered rows); the cell never computes over its rows.
   * @default undefined
   */
  result?: React.ReactNode;
  /**
   * The result is being computed: a small skeleton stands in for it.
   * @default false
   */
  loading?: boolean;
  /**
   * Content before the function picker — a summary row's leading "412 rows".
   * @default undefined
   */
  leading?: React.ReactNode;
  /**
   * The trigger's tab stop. A grid that roves focus over its footer CELLS passes `-1` and opens
   * the picker from the cell (so the arrow keys keep moving between cells).
   * @default undefined
   */
  triggerTabIndex?: number;
  /**
   * Called when the picker opens or closes — a roving grid returns focus to the cell on close.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The label of the "no function" item.
   * @default "None"
   */
  noneLabel?: string;
  /**
   * The trigger's text while no function is chosen. It shows only on hover and focus, so a
   * footer of unsummarised columns stays quiet.
   * @default "Summarize"
   */
  placeholder?: string;
}

const SUMMARY_NONE = "\u0000none";

/**
 * `GridSummaryCell` — one footer cell of a grid's summary row: a quiet `Select` of the column's
 * summary functions (None, Count, Sum, …) and the host's result beside the function's name. The
 * value is a prop; the cell computes nothing. The trigger is named "Sum of Qty" (or "Summarize
 * Qty" while none is chosen).
 *
 * @example
 * <GridSummaryCell
 *   columnLabel="Qty"
 *   options={[{ value: "sum", label: "Sum" }, { value: "avg", label: "Average" }]}
 *   value="sum"
 *   onValueChange={setFn}
 *   result="830"
 * />
 */
export function GridSummaryCell({
  columnLabel,
  options,
  value,
  onValueChange,
  result,
  loading = false,
  leading,
  triggerTabIndex,
  onOpenChange,
  noneLabel = "None",
  placeholder = "Summarize",
  className,
  onFocus,
  onPointerEnter,
  onPointerDown,
  ...props
}: GridSummaryCellProps) {
  const chosen = options.find((option) => option.value === value) ?? null;
  // An unsummarised cell mounts its picker only once it is hovered, focused or touched: a wide
  // grid's footer would otherwise build a Select per column on every sideways scroll step.
  const [armed, setArmed] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  // Lazy only inside a grid that roves focus to the cell (it passes the cell's `tabIndex`); a
  // standalone cell keeps its picker mounted so Tab reaches it.
  const live = chosen != null || armed || props.tabIndex === undefined;
  return (
    <TableCell
      data-slot="grid-summary-cell"
      className={cn("group/summary-cell py-1", className)}
      onFocus={(event) => {
        setArmed(true);
        onFocus?.(event);
      }}
      onPointerEnter={(event) => {
        setArmed(true);
        onPointerEnter?.(event);
      }}
      onPointerDown={(event) => {
        // A touch has no hover to arm with: the first tap arms and opens.
        if (!live && event.pointerType !== "mouse") {
          setArmed(true);
          setOpen(true);
        }
        onPointerDown?.(event);
      }}
      {...props}
    >
      {leading != null ? (
        <span className="me-2 align-middle text-xs text-muted-foreground">
          {leading}
        </span>
      ) : null}
      {live ? (
        <Select
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange?.(next);
          }}
          value={chosen ? chosen.value : SUMMARY_NONE}
          onValueChange={(next) =>
            onValueChange(
              next == null || next === SUMMARY_NONE ? null : String(next),
            )
          }
          items={[
            { value: SUMMARY_NONE, label: noneLabel },
            ...options.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
        >
          <SelectTrigger
            variant="ghost"
            size="sm"
            {...(triggerTabIndex !== undefined && {
              tabIndex: triggerTabIndex,
            })}
            aria-label={
              chosen
                ? `${chosen.label} of ${columnLabel}`
                : `${placeholder} ${columnLabel}`
            }
            data-empty={chosen ? undefined : ""}
            className={cn(
              "-mx-2 inline-flex max-w-full min-w-0 gap-1 text-xs text-muted-foreground",
              // Unsummarised, on a fine pointer: invisible until the cell is hovered or focused, so a
              // footer of unsummarised columns stays quiet. A touch screen cannot hover, so it always
              // shows the prompt there.
              "pointer-fine:data-empty:opacity-0 pointer-fine:group-hover/summary-cell:opacity-100 pointer-fine:group-focus-within/summary-cell:opacity-100 data-popup-open:opacity-100",
            )}
          >
            <span className="min-w-0 truncate">
              {chosen ? chosen.label : placeholder}
            </span>
            {chosen ? (
              loading ? (
                <Skeleton
                  data-slot="grid-summary-loading"
                  className="h-3 w-8"
                />
              ) : (
                <span className="font-medium text-foreground tabular-nums">
                  {result}
                </span>
              )
            ) : null}
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            <SelectItem value={SUMMARY_NONE}>{noneLabel}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span
          aria-hidden="true"
          data-slot="grid-summary-placeholder"
          className="text-xs text-muted-foreground pointer-fine:invisible"
        >
          {placeholder}
        </span>
      )}
    </TableCell>
  );
}

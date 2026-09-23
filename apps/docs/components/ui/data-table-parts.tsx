// @vegastack data-table-parts@0.14.0 sha256-F6lHq/a6cDzFK1CVgg+un4GjCYQX35fOyMXu1MJ+JHU=

"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
   * Render this column's values in the mono numeral face (`font-mono text-sm` +
   * `tabular-nums`), so figures line up down the column.
   * @default false
   */
  mono?: boolean;
  /**
   * Keep this column's cells on one line instead of wrapping. Cells wrap by
   * default (D18) — scrolling is reserved for tables that are genuinely wide,
   * not forced by one long value. Figures and mono values are the exception and
   * opt IN automatically.
   * @default true for `align="end"` and `mono` columns, false otherwise
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
 * Whether a column's cells stay on one line. A column that says nothing inherits
 * the wrapping default, EXCEPT the two shapes that are unreadable when broken:
 * end-aligned figures and mono values.
 */
export function isNowrapColumn(column: DataTableColumnLayout): boolean {
  return column.nowrap ?? (column.align === "end" || column.mono === true);
}

/**
 * What a cell (and a sort header's label) becomes inside a `data-squeezed`
 * table — the attribute a renderer sets on its `<table>` when, AFTER
 * revelation, the table still overflows its container (the last rung of
 * "never forces a horizontal scroll"). Only `DataList` sets it; `DataGrid`'s
 * container is allowed to scroll. Squeezed, a cell is
 * wrapping and breakable anywhere, because the alternative is overflowing.
 * `wrap-anywhere` is the value that lowers min-content width, which is what an
 * auto-layout table sizes each column from.
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
 * - `Avatar` and `Kbd`.
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
  "in-data-squeezed:**:not-[:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd]),:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd])_*]:whitespace-normal " +
  "in-data-squeezed:**:not-[:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd]),:is(button:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),input,select,textarea,[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline']),[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab],[class~='group/button']:not([data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']),[class~='group/toggle'],[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node'],[data-slot=avatar],[data-slot=kbd])_*]:wrap-anywhere " +
  "in-data-squeezed:**:[&:is([data-slot=avatar],[data-slot=kbd],[class~='group/stepper-node'])]:whitespace-nowrap " +
  "in-data-squeezed:**:[&:is([data-slot=avatar],[data-slot=kbd],[class~='group/stepper-node'])]:shrink-0 " +
  "in-data-squeezed:**:[&[class~='group/badge']]:h-auto " +
  "in-data-squeezed:**:[&[class~='group/button'][class~='hover:underline']]:h-auto " +
  "in-data-squeezed:**:[&[class~='group/button'][class~='hover:underline']]:min-h-6";

/**
 * The full class contract for one column's cells — alignment, the wrap posture,
 * and the mono numeral face. Used for header, body and skeleton cells alike.
 */
export function columnCellClass(column: DataTableColumnLayout): string {
  return cn(
    alignClass(column.align),
    // Both directions are spelled out, not just the nowrap one. Batch 5 of the shadcn reset put
    // `Table` back on upstream's file, whose `TableCell` is `whitespace-nowrap` by default
    // (LAY-6 resolves as **shadcn**), so a column that wants to wrap has to say so or `cn`'s
    // merge leaves upstream's class standing.
    isNowrapColumn(column) ? "whitespace-nowrap" : "whitespace-normal",
    SQUEEZE_CLASS,
    // Upstream's `TableCell` drops the end padding of a cell holding a checkbox (`pe-0`), and a
    // Checkbox, Switch or Radio reaches 12px past its box for its 24px pointer target
    // (`after:-inset-x-3`). In the LAST cell of a row that pseudo-element poked past the table and
    // scrolled the container 10px (a Switch, in upstream's `p-2`, 3px) once a squeeze had shrunk
    // the cell to the control (review round 4). The last cell keeps the target's 12px instead.
    "last:has-[[role=checkbox],[role=switch],[role=radio]]:pe-3",
    column.mono && "font-mono text-sm tabular-nums",
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
): ColumnRevelation<C> {
  if (containerWidth == null)
    return {
      visibleColumns: [...columns],
      mergedColumns: [],
      hiddenColumns: [],
    };
  let used = reservedWidth;
  const shown: C[] = [];
  const overflow: C[] = [];
  let exhausted = false;
  for (const [index, column] of columns.entries()) {
    const need = column.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH;
    if (index === 0 || column.mobile === "visible") {
      used += need;
      shown.push(column);
    } else if (!exhausted && used + need <= containerWidth) {
      used += need;
      shown.push(column);
    } else {
      exhausted = true;
      overflow.push(column);
    }
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
  className,
}: SortHeaderButtonProps) {
  const leading = align === "end";
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-slot="data-table-sort"
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
        // In a squeezed table the label may wrap like the cells do.
        "in-data-squeezed:h-auto in-data-squeezed:min-h-7 in-data-squeezed:text-start",
        SQUEEZE_CLASS,
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
          <ChevronsUpDown className="size-3.5 opacity-0 transition-opacity duration-fast ease-standard group-hover/sort:opacity-60" />
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
        columnCellClass(column),
        // The sort control carries the cell's inline padding so its box stays
        // inside the cell: 2px here + the button's 1px border and 5px padding
        // put the label 8px in — on its values' edge, like a plain header.
        sortable && "px-0.5",
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
          {columns.map((column, columnIndex) => (
            <TableCell key={column.key} className={columnCellClass(column)}>
              <Skeleton
                className={columnIndex === 0 ? "h-4 w-32" : "h-4 w-20"}
              />
            </TableCell>
          ))}
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
      <TableCell colSpan={colSpan} className="min-w-0 p-0">
        {children ?? (
          <Empty>
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

  const allSelected =
    rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const someSelected = rowIds.some((id) => selected.has(id));

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
  };
}

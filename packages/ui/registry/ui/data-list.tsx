// @vegastack data-list@0.23.12 sha256-Eg16+HOzaZKfRNd9YtkrFY62c1rB8G4FIkUzQ6vbeOw=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { cn, mergeRefs } from "@vegastack/design";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadMore, type LoadMoreProps } from "@/components/ui/load-more";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  columnCellClass,
  EmptyRow,
  mergedValueClass,
  offscreenSortSummary,
  revealColumns,
  SELECTED_ROW_CLASS,
  SELECTION_COLUMN_WIDTH,
  SelectAllHead,
  SelectionCell,
  SkeletonRows,
  RowActionsMenu,
  SectionRow,
  SortableHead,
  useContainerWidth,
  useControlledState,
  useRowSelection,
  type DataTableColumnLayout,
  type GroupState,
  type DataTableColumnMobile,
  type SortDirection,
  type RowAction,
  type RowActionItem,
  type RowActionSeparator,
} from "@/components/ui/data-table-parts";
import { TruncationFocusProvider } from "@/components/ui/truncated-text";
import { Board, type BoardColumn } from "@/components/ui/board";
import { FilterBar } from "@/components/ui/filter-bar";
import { MediaCard } from "@/components/ui/media-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Thumbnail } from "@/components/ui/thumbnail";
import { ViewToggle, type ListView } from "@/components/ui/view-toggle";
import type { DragReorderMove } from "@/components/ui/use-drag-reorder";

export type {
  DataTableColumnMobile,
  RowAction,
  RowActionItem,
  RowActionSeparator,
  SortDirection,
};

/** How a `DataList` lays its rows out: a table, a card grid, or board lanes. */
export type DataListView = ListView;

/** The active sort — which column and which direction. */
export interface SortState {
  /** `key` of the column being sorted. */
  key: string;
  /** Direction of the sort. */
  direction: SortDirection;
}

/**
 * Per-cell context passed as the optional third argument to a column `render`.
 * Existing two-argument render functions remain assignable unchanged.
 */
export interface DataListCellContext {
  /** Stable row id, as produced by `getRowId`. */
  rowId: string;
  /** The `key` of the column this cell belongs to. */
  columnKey: string;
  /** Whether the cell's row is currently selected. */
  selected: boolean;
}

/**
 * A single column definition for {@link DataList}. Generic over the row type `T`
 * so `render` receives a fully-typed row.
 */
export interface DataListColumn<T> extends DataTableColumnLayout {
  /** Header label. A string or any node for custom header layouts. */
  header: React.ReactNode;
  /**
   * Cell renderer. When omitted, the value at `row[key]` is rendered directly
   * (the column `key` is read as a property of the row). Provide `render` for
   * formatted, composed, or computed cells. Receives an optional third
   * {@link DataListCellContext} argument (row id, column key, selection state).
   *
   * Invoked as a **plain function inside `DataList`'s own render**, not mounted
   * as a component — hooks called directly in its body would become `DataList`'s
   * hooks and corrupt hook order when the loading/empty branch flips. Return a
   * component element (`<MyCell row={row} />`) when a cell needs hooks.
   */
  render?: (
    row: T,
    index: number,
    cell: DataListCellContext,
  ) => React.ReactNode;
  /**
   * Allow the user to sort by this column by clicking its header; the header shows a sort
   * indicator (a faint ⇅ at rest, ↑/↓ while sorted). The parent receives the next
   * {@link SortState} via `onSortChange`. With `sortMode="client"`, or a `compare` on the column,
   * `DataList` orders `data` itself; otherwise the parent re-orders `data`.
   * @default false
   */
  sortable?: boolean;
  /**
   * The comparator for this column, ascending. Setting it sorts client-side whatever `sortMode`
   * is; descending is its reverse. Without it, client sorting compares `row[key]` (numbers,
   * dates, then strings with a numeric-aware `localeCompare`), empty values last.
   * @default undefined
   */
  compare?: (a: T, b: T) => number;
  /**
   * The direction the first click sorts by — `"desc"` for dates and amounts where newest or
   * largest first is the useful order. The cycle is first → the other → none.
   * @default "asc"
   */
  sortFirst?: SortDirection;
  /**
   * What this column shows when a narrow container folds it into the first column's cell. A
   * value lifted out of its column loses the header above it, so a bare `4` reads as nothing:
   * return the value with its context instead (`4 to review`). Defaults to `render` (or the raw
   * value), with the header kept as a screen-reader-only prefix; when this is set the prefix is
   * dropped, because the value now carries its own.
   * @default undefined
   */
  mergedRender?: (
    row: T,
    index: number,
    cell: DataListCellContext,
  ) => React.ReactNode;
  /**
   * Show a 32px `Thumbnail` before this column's value (usually the first column), from the
   * row's image URL. The grid view uses it as the card's image. A row with no image shows the
   * list's `thumbnailFallback`.
   * @default undefined
   */
  thumbnail?: (row: T) => string | null | undefined;
  /** Extra className applied to every body cell in this column. */
  className?: string;
  /**
   * Per-cell class hook, called for every body cell in this column and merged
   * after `className`. Use for value-dependent cell styling (a negative-amount
   * tint, a stale-row wash) without a custom `render`.
   * @default undefined
   */
  cellClassName?: (row: T, index: number) => string | undefined;
  /** Extra className applied to the header cell. */
  headerClassName?: string;
  /**
   * Marks this column's cells as containing their own interactive content
   * (a link, button, menu, …). When the **first** column is `interactive` and
   * `onRowClick` is set, `DataList` skips auto-injecting its first-cell row
   * activation button into that cell — so it never nests an interactive element
   * inside the row-activation control. Set this on the first column whenever its
   * `render` returns something focusable/clickable.
   * @default false
   */
  interactive?: boolean;
}

/**
 * What `rowProps` may put on a row: `data-*` attributes for the host's own styling or tests, a
 * class, and the `highlighted` state.
 */
export interface DataListRowProps {
  /**
   * Wash the row in the accent tint and mark it `data-highlighted` — a row the user just created
   * or that just changed. The wash eases in (instantly under reduced motion); clear the flag after
   * a moment to return the row to rest. Selection's wash, when both apply, wins.
   * @default false
   */
  highlighted?: boolean;
  /**
   * Extra classes merged onto the row.
   * @default undefined
   */
  className?: string;
  /** Any `data-*` attribute, passed through to the row. */
  [attribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Props accepted by `DataList`. Extends upstream `Table`'s own props (minus `children`), so every
 * `<table>` attribute type-checks here and flows straight through.
 *
 * Batch 5 of the shadcn reset put `Table` back on upstream's file, which is a plain `<table>` in a
 * `data-slot="table-container"` overflow div and takes no props of its own. The pre-reset
 * spreadsheet voice (`grid`, `headerTone`, `density`) and container hooks (`scrollLabel`,
 * `containerProps`) are therefore gone; Batch 7 rebuilds this component on the reset primitives.
 */
export interface DataListProps<T> extends Omit<
  React.ComponentProps<typeof Table>,
  "children"
> {
  /** Column definitions, left to right. */
  columns: DataListColumn<T>[];
  /** Row data, in display order. Sorting is the parent's responsibility (see `sort`). */
  data: T[];
  /**
   * Extract a stable, unique id from a row. Used as the React key and as the
   * selection identity. Defaults to the row index — pass a real id whenever rows
   * can re-order or the dataset can change.
   * @default (_, index) => String(index)
   */
  getRowId?: (row: T, index: number) => string;
  /**
   * Render a leading checkbox column with per-row selection and a header
   * select-all checkbox (tri-state when partially selected).
   * @default false
   */
  selectable?: boolean;
  /**
   * Controlled set of selected row ids. Pair with `onSelectionChange`. Omit for
   * uncontrolled selection (the component tracks its own state).

   * @default undefined
   */
  selectedIds?: Set<string>;
  /**
   * Called whenever the selection changes, with the next set of selected row ids.

   * @default undefined
   */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /**
   * Controlled active sort. Pair with `onSortChange`. Omit for uncontrolled
   * sorting (the component tracks which header is active, but you must still
   * order `data` yourself in `onSortChange`).

   * @default undefined
   */
  sort?: SortState | null;
  /**
   * Called when a sortable header is activated, with the next {@link SortState}
   * (or `null` when sorting is cleared). Cycles asc → desc → none per column.

   * @default undefined
   */
  onSortChange?: (sort: SortState | null) => void;
  /**
   * Show skeleton placeholder rows instead of data — the loading state.
   * @default false
   */
  loading?: boolean;
  /**
   * Number of skeleton rows to render while `loading`.
   * @default 5
   */
  loadingRows?: number;
  /**
   * Content shown when `data` is empty and not `loading` and there is nothing at all yet (no
   * filters applied). Defaults to a built-in {@link Empty} ("No data", an Inbox icon). Pass an
   * `Empty` composition to customise it; never hand-roll empty markup.

   * @default undefined
   */
  emptyState?: React.ReactNode;
  /**
   * Make rows activatable. When set, the row gets `data-clickable` and a
   * `cursor-pointer`, and a real, keyboard-focusable `<button>` is injected into
   * the **first** body cell as the accessible activation control — so the `<tr>`
   * keeps its native `role="row"` and the cells stay valid (no `role="button"`
   * on the row, which would break table semantics for assistive tech). Mouse
   * users get a row-wide `onClick`; keyboard / AT users tab to the first-cell
   * button and press Enter/Space. Activating a nested control (the selection
   * checkbox, a link, a button, …) is excluded — it keeps its own behaviour
   * without firing this. If the first column is `interactive` (its `render`
   * already returns a focusable control), set `column.interactive` on it so the
   * injected button is skipped for that cell — keyboard activation then comes
   * from a consumer-provided in-cell control. Purely *presentational*: the host
   * decides what activating a row does (navigate, open a drawer, …); `DataList`
   * still owns no data behaviour.

   * @default undefined
   */
  onRowClick?: (row: T, index: number) => void;
  /**
   * Make rows real links. The first cell's content becomes the link (`<a>`, or
   * `rowLinkRender`), so Enter, a middle click and every modifier click are the browser's own;
   * a click anywhere else on the row follows the same link, modifiers kept. Interactive cells
   * keep their own behaviour. A row without an href falls back to `onRowClick`.
   * @default undefined
   */
  getRowHref?: (row: T) => string | undefined;
  /**
   * The element a row link renders — a router link such as `<Link />`. It receives the `href`
   * and the cell content.
   * @default <a />
   */
  rowLinkRender?: React.ReactElement;
  /**
   * Per-row passthrough: `data-*` attributes, a class, and `highlighted` (flash a new row). The
   * list's own `data-slot`, `data-selected` and `data-clickable` always win over a passed one.
   * @default undefined
   */
  rowProps?: (row: T, index: number) => DataListRowProps | undefined;
  /**
   * A row's name, for its selection checkbox ("Select {label}").
   * @default (row, index) => `row ${index + 1}`
   */
  getRowLabel?: (row: T) => string;
  /**
   * Slot rendered above the table — where the host drops its own search input,
   * filter bar, or bulk actions. Renders nothing when omitted (per the G7 split,
   * the search/filter *logic* lives in the host; this is just the mount point).

   * @default undefined
   */
  toolbar?: React.ReactNode;
  /**
   * Slot rendered below the table — where the host drops its own pagination,
   * load-more, or row-count footer (`DataListPager` is built for it). Renders
   * nothing when omitted (the paging *logic* lives in the host; this is just
   * the mount point).

   * @default undefined
   */
  footer?: React.ReactNode;
  /**
   * Keyset paging: renders the shared `LoadMore` footer below the table (above
   * `footer`). The table reports `aria-rowcount="-1"` while `hasMore`, because
   * the total is unknown. `loading` here is a next-batch fetch — the loaded
   * rows stay; the list-level `loading` prop is the first-load skeleton.
   * `endLabel` is shown once `hasMore` is false (nothing by default).
   * @default undefined
   */
  loadMore?: DataListLoadMoreProps;
  /**
   * Split the rows into collapsible sections, in this order, under the one header. Each
   * non-empty section is its own `<tbody>` headed by a `SectionRow`; empty sections are
   * omitted. Needs `getRowSection`.
   * @default undefined
   */
  sections?: DataListSection[];
  /**
   * The section id a row belongs to. Rows whose id is not in `sections` follow the listed
   * sections, without a header.
   * @default undefined
   */
  getRowSection?: (row: T) => string;
  /**
   * Controlled collapsed/expanded state per section id. Pair with `onGroupStateChange`.
   * @default undefined
   */
  groupState?: GroupState;
  /**
   * Initial collapsed/expanded state per section id, when uncontrolled. Sections are
   * expanded unless listed as `"collapsed"`.
   * @default {}
   */
  defaultGroupState?: GroupState;
  /**
   * Called with the next state when a section is collapsed or expanded.
   * @default undefined
   */
  onGroupStateChange?: (state: GroupState) => void;
  /**
   * How values folded into the first column are laid out on a narrow container: `stack`, one
   * value per line, or `line`, one compact meta line under the primary value with the values
   * joined by a dot ("Today · High · Arjun Mehta"). A `line` pairs well with `mergedRender`.
   * @default "stack"
   */
  mergedLayout?: "stack" | "line";
  /**
   * A section's count as a screen reader hears it.
   * @default (n) => `${n} rows`
   */
  sectionCountLabel?: (count: number) => string;
  /**
   * Who orders the rows. `"manual"` only signals (`onSortChange`) and the parent sorts `data`;
   * `"client"` sorts `data` in place with each column's `compare` (or the default comparator).
   * A column with its own `compare` always sorts client-side.
   * @default "manual"
   */
  sortMode?: "manual" | "client";
  /**
   * The "no matches for these filters" state, used instead of `emptyState` while `data` is empty
   * because of a search or filter. `true` shows the standard one (a SearchX icon, "No matches", a
   * short description); pass an object to relabel it and wire "Clear filters" to the
   * `FilterBar`'s `onClear`.
   * @default undefined
   */
  noResults?: boolean | DataListNoResults;
  /**
   * The standard row-actions column: when set, a trailing column (always last) renders a 32px
   * ghost ⋯ menu per row, end-aligned, never activating the row. Return `[]` for no menu.
   * @default undefined
   */
  rowActions?: (row: T) => RowAction[];
  /**
   * The ⋯ trigger's accessible name, from the row's label (`getRowLabel`).
   * @default (label) => `Actions for ${label}`
   */
  rowActionsLabel?: (label: string) => string;
  /**
   * Row ids to flash in the accent wash — rows that were just created or changed (the same
   * `highlighted` state `rowProps` sets). Clear an id after a moment to return its row to rest.
   * @default undefined
   */
  highlightedIds?: ReadonlySet<string>;
  /**
   * The layout: `"list"` (the table), `"grid"` (a card per row, groups as headings over a
   * responsive grid) or `"board"` (sections as `Board` lanes). Items, groups, sort, filters,
   * paging, loading, empty and no-results states are the same in each. Controlled with
   * `onViewChange`.
   * @default "list"
   */
  view?: DataListView;
  /**
   * The initial view when uncontrolled.
   * @default "list"
   */
  defaultView?: DataListView;
  /**
   * Called with the view the user picks. Setting it mounts a `ViewToggle` — in the toolbar's
   * `FilterBar` `view` slot when the toolbar is a `FilterBar` — and the chosen view is
   * remembered for the browser session.
   * @default undefined
   */
  onViewChange?: (view: DataListView) => void;
  /**
   * The views the toggle offers, in order.
   * @default ["grid", "list"]
   */
  views?: readonly DataListView[];
  /**
   * The session-storage key the chosen view is remembered under.
   * @default `data-list-view:` + the path + the list's aria-label
   */
  viewStorageKey?: string;
  /**
   * The grid's card size: `default` (48px thumbnail, three columns on a wide container) or `lg`
   * (a 16:9 image on top).
   * @default "default"
   */
  gridSize?: "default" | "lg";
  /**
   * Render a row as a card, for the grid and board views. Defaults to a `MediaCard`: the first
   * column is the title, the other columns join into its meta line, a `thumbnail` column is its
   * image, `getRowHref` its link and `rowActions` its ⋯ menu. On a board it is the card's
   * content only — the board owns the card surface and its link.
   * @default undefined
   */
  renderCard?: (row: T, index: number) => React.ReactNode;
  /**
   * What a `thumbnail` column or a card shows for a row with no image — the app's brand mark.
   * @default <ImageIcon />
   */
  thumbnailFallback?: React.ReactNode;
  /**
   * Board view: a card was dragged (or moved from its menu) from one lane to another. Return a
   * promise for a server-gated move; a rejection snaps the card back. Without it the board is
   * read-only (its menus still work).
   * @default undefined
   */
  onMove?: (
    row: T,
    fromSection: string,
    toSection: string,
    move: DragReorderMove,
  ) => void | Promise<void>;
}

/** The `noResults` state's copy and its "Clear filters" action. */
export interface DataListNoResults {
  /**
   * The title.
   * @default "No matches"
   */
  title?: React.ReactNode;
  /**
   * The short description.
   * @default "Nothing matches these filters. Try a different search or clear the filters."
   */
  description?: React.ReactNode;
  /**
   * Clears the search and filters — pass the `FilterBar`'s `onClear`. Omit for no button.
   * @default undefined
   */
  onClear?: () => void;
  /**
   * The button's label.
   * @default "Clear filters"
   */
  clearLabel?: string;
}

/**
 * `NoResultsEmpty` — the standard "no matches" empty state, also usable
 * outside a DataList (a Board, a card grid).
 *
 * @example
 * <NoResultsEmpty onClear={clearFilters} />
 */
export function NoResultsEmpty({
  title = "No matches",
  description = "Nothing matches these filters. Try a different search or clear the filters.",
  onClear,
  clearLabel = "Clear filters",
}: DataListNoResults) {
  return (
    <Empty icon={<SearchX aria-hidden />} data-slot="data-list-no-results">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onClear ? (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onClear}>
            {clearLabel}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

/** The default client comparator: numbers, dates, booleans, then numeric-aware strings. */
function defaultCompare(a: unknown, b: unknown): number {
  const empty = (v: unknown) => v == null || v === "";
  if (empty(a) || empty(b)) return empty(a) ? (empty(b) ? 0 : 1) : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "boolean" && typeof b === "boolean")
    return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/** Options accepted by `rowActionsColumn`. */
export interface RowActionsColumnOptions<T> {
  /** The row's name, for the menu trigger ("Actions for {label}"). */
  getRowLabel: (row: T) => string;
  /** The row's actions, in menu order. An empty list renders no menu. */
  actions: (row: T) => RowAction[];
  /**
   * The column key.
   * @default "actions"
   */
  key?: string;
  /**
   * The column's header, read by assistive tech only.
   * @default "Actions"
   */
  headerLabel?: string;
  /**
   * The trigger's accessible name, from the row's label.
   * @default (label) => `Actions for ${label}`
   */
  actionsLabel?: (label: string) => string;
}

/**
 * A trailing row-actions column for `DataList`: one `RowActionsMenu` per row, end-aligned,
 * always visible on narrow widths, and marked `interactive` so it never activates the row.
 *
 * @example
 * columns={[...columns, rowActionsColumn({ getRowLabel: (p) => p.name, actions: (p) => [...] })]}
 */
export function rowActionsColumn<T>({
  getRowLabel,
  actions,
  key = "actions",
  headerLabel = "Actions",
  actionsLabel,
}: RowActionsColumnOptions<T>): DataListColumn<T> {
  return {
    key,
    header: <span className="sr-only">{headerLabel}</span>,
    align: "end",
    minWidth: 48,
    mobile: "visible",
    interactive: true,
    render: (row) => (
      <RowActionsMenu
        label={getRowLabel(row)}
        actions={actions(row)}
        actionsLabel={actionsLabel}
      />
    ),
  };
}

/** One section of a sectioned `DataList`. */
export interface DataListSection {
  /** Matches what `getRowSection` returns for the section's rows. */
  id: string;
  /** The section header's text. */
  label: React.ReactNode;
  /**
   * The count shown in the header. Defaults to the rows loaded into the section; pass the
   * server's total when more exist than are loaded.
   * @default the loaded row count
   */
  count?: number;
  /**
   * Board view: this lane is loading its first batch (it shows skeleton cards).
   * @default the list's `loading`
   */
  loading?: boolean;
  /**
   * Board view: this lane's own keyset paging, a `LoadMore` at the lane's foot.
   * @default undefined
   */
  loadMore?: DataListLoadMoreProps;
  /**
   * Board view: what an empty lane shows.
   * @default a bordered "No items" Empty
   */
  emptyState?: React.ReactNode;
}

const EMPTY_GROUP_STATE: GroupState = {};

/** The `loadMore` prop: the paging state plus the footer's own labels. */
export type DataListLoadMoreProps = Omit<LoadMoreProps, "className" | "ref">;

/**
 * Interactive descendants that own their own click/keyboard activation. A click
 * or key press landing on one of these inside a clickable row must NOT also
 * activate the row (e.g. toggling the selection checkbox should not navigate).
 */
const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, label, [role="button"], [role="checkbox"], [role="menuitem"], [role="link"]';

/**
 * True when a click event originated from an interactive descendant of the row
 * (a checkbox, nested button/link, form control, …) rather than the row itself.
 * Used to gate row activation so those controls keep their own behaviour without
 * also firing `onRowClick`. Robust at the root — works for any interactive
 * descendant, not just the selection checkbox.
 */
function isFromInteractiveDescendant(
  event: React.MouseEvent<HTMLElement>,
): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  if (target === event.currentTarget) return false;
  return target.closest(INTERACTIVE_SELECTOR) != null;
}

/**
 * The first cell's link: `<a>` or the host's router link, carrying the row's href. Not
 * `useRender`: it lets the render element's own props win, and `rowLinkRender` is one template
 * shared by every row (`<Link href="" />` satisfies a router's required `href`), so the row's
 * href has to win over the template's instead.
 */
function RowLink({
  href,
  render,
  children,
}: {
  href: string;
  render?: React.ReactElement;
  children: React.ReactNode;
}) {
  const props = {
    href,
    "data-slot": "data-list-row-link",
    className:
      "-mx-1 -my-0.5 inline-flex max-w-full items-center rounded-sm px-1 py-0.5 text-start text-inherit no-underline hover:no-underline focus-visible:no-underline",
    children,
  };
  if (render) {
    return React.cloneElement(
      render,
      mergeProps(render.props as object, props) as object,
    );
  }
  return <a {...props} />;
}

/**
 * `DataList<T>` — a generic, typed data table with row selection, sortable
 * columns, a skeleton loading state, and an empty state. Built on
 * {@link Table} plus the shared `data-table-parts` chrome it has in common with
 * `DataGrid`; every visual value is a semantic token.
 *
 * Selection and sort are both controllable — pass `selectedIds`/`onSelectionChange`
 * and `sort`/`onSortChange` to lift the state, or omit them for the built-in
 * uncontrolled behaviour. Sorting only *signals* intent via `onSortChange`; the
 * parent re-orders `data` (so server-side and client-side sorting share one API).
 *
 * **It never forces horizontal scroll.** Every column carries a `minWidth`
 * budget (default 120) and a `mobile` posture (default `"merge"`), shared with
 * `DataGrid`: once the measured container is too narrow, overflow columns stack
 * into the primary (first) column's cell, `mobile: "hidden"` columns drop and
 * are counted in a visible hint the table is described by, and
 * `mobile: "visible"` columns never hide. If a value is still wider than its
 * column's budget once that has run (a long unbroken email, a one-line mono
 * id, several `visible` columns), the table is squeezed (`data-squeezed`):
 * every cell, and the text a custom `render` puts in it, may then break
 * anywhere rather than scroll — a `truncate` span wraps, a Badge grows taller.
 * Controls and fixed-size content (a Button or any native control, an Avatar, a
 * Kbd, an icon) are left whole, so they keep their label inside their box and
 * the row grows taller instead. A
 * merged value always wraps, whatever the primary column's own posture, so a
 * `mono` or end-aligned first column cannot pin the stack to one line. When the active sort's column is merged or
 * hidden, a "Sorted by …" line under the table (which describes it) keeps the
 * order discoverable. The server render shows every column (LAY-9's declared
 * answer); the client corrects the split before first paint.
 *
 * The table, those status lines and the optional `toolbar`/`footer` always
 * render inside one `data-slot="data-list-root"` stack, so nothing DataList
 * adds ever lands as a stray child of the host's own layout.
 *
 * For host composition it exposes presentational affordances — `onRowClick` (makes
 * rows activatable via click + Enter/Space), and the `toolbar` / `footer` slots
 * (mount points above/below the table for the host's own search bar / pagination).
 * These carry no data logic; the host still owns the query, filtering, and paging.
 *
 * **Scope (presentational core — G7 app-coupled split).** This is the *presentational*
 * data table: columns, render functions, row selection, sortable-header signalling,
 * skeleton loading, the empty state, activatable rows (`onRowClick`), and the
 * `toolbar`/`footer` composition slots. It deliberately does **not** own data-fetching
 * or app-coupled data-management behaviour. The platform's richer data surface is
 * either **composed by the host app** around this primitive (search/filtering,
 * pagination, view persistence — it owns the query, the URL/persisted view state, and
 * the filtered/paged `data` it passes in) or **shipped as sibling components**:
 * `SortableList` (reordering), `Board` (Kanban), and `DataGrid` (grouping, inline
 * editing, multi-key sort, virtualization). Drop the host's own search/filter controls into `toolbar`
 * and its pagination into `footer`; pass `DataList` the already-filtered, already-paged rows.
 *
 * @example
 * // Minimal, read-only
 * <DataList
 *   columns={[
 *     { key: 'name', header: 'Name' },
 *     { key: 'role', header: 'Role' },
 *   ]}
 *   data={users}
 *   getRowId={(u) => u.id}
 * />
 *
 * @example
 * // Selectable + sortable, controlled
 * const [selected, setSelected] = React.useState<Set<string>>(new Set());
 * const [sort, setSort] = React.useState<SortState | null>(null);
 * <DataList
 *   columns={[
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'email', header: 'Email' },
 *     { key: 'amount', header: 'Amount', align: 'end', sortable: true,
 *       className: 'tabular-nums' },
 *     { key: 'ref', header: 'Reference', mono: true },
 *   ]}
 *   data={sortRows(rows, sort)}
 *   getRowId={(r) => r.id}
 *   selectable
 *   selectedIds={selected}
 *   onSelectionChange={setSelected}
 *   sort={sort}
 *   onSortChange={setSort}
 * />
 *
 * @example
 * // Activatable rows + host-owned toolbar/footer slots
 * <DataList
 *   columns={columns}
 *   data={pageRows}
 *   getRowId={(r) => r.id}
 *   onRowClick={(row) => router.push(`/users/${row.id}`)}
 *   toolbar={<SearchInput value={q} onValueChange={setQ} />}
 *   footer={<DataListPager page={page} pageSize={25} total={total} onPageChange={setPage} />}
 * />
 */
export function DataList<T>({
  columns,
  data: rawData,
  getRowId = (_row, index) => String(index),
  selectable = false,
  selectedIds,
  onSelectionChange,
  sort,
  onSortChange,
  loading = false,
  loadingRows = 5,
  emptyState,
  onRowClick,
  getRowHref,
  rowLinkRender,
  rowProps,
  mergedLayout = "stack",
  getRowLabel,
  toolbar,
  footer,
  loadMore,
  sections,
  getRowSection,
  groupState,
  defaultGroupState,
  onGroupStateChange,
  sectionCountLabel,
  sortMode = "manual",
  noResults,
  highlightedIds,
  rowActions,
  rowActionsLabel,
  view,
  defaultView = "list",
  onViewChange,
  views = ["grid", "list"],
  viewStorageKey,
  gridSize = "default",
  renderCard,
  thumbnailFallback,
  onMove,
  className,
  "aria-busy": ariaBusy,
  "aria-describedby": ariaDescribedBy,
  ref,
  ...tableProps
}: DataListProps<T>) {
  const loadingStatusId = React.useId();
  const hiddenHintId = React.useId();
  const sortHintId = React.useId();

  // ---- responsive column revelation (shared with DataGrid) ----------------
  // Upstream's `Table` owns its `table-container` overflow div and forwards
  // nothing to it, so the table's ref reaches it through `parentElement`. That
  // div is `w-full` and clips its own overflow, so its width is the width the
  // columns must fit, independent of how wide the table currently renders.
  // The standard row-actions column, always last.
  const allColumns = React.useMemo(
    () =>
      rowActions
        ? [
            ...columns,
            rowActionsColumn<T>({
              getRowLabel: (row) => getRowLabel?.(row) ?? "row",
              actions: rowActions,
              actionsLabel: rowActionsLabel,
              key: "__row-actions",
            }),
          ]
        : columns,
    [columns, rowActions, rowActionsLabel, getRowLabel],
  );

  const [measureRef, containerWidth] = useContainerWidth();
  const tableNode = React.useRef<HTMLTableElement | null>(null);
  const measureContainer = React.useCallback(
    (node: HTMLTableElement | null) => {
      tableNode.current = node;
      measureRef(node?.parentElement ?? null);
    },
    [measureRef],
  );
  const tableRef = React.useMemo(
    () => mergeRefs(measureContainer, ref),
    [measureContainer, ref],
  );
  const { visibleColumns, mergedColumns, hiddenColumns } = React.useMemo(
    () =>
      revealColumns(
        allColumns,
        containerWidth,
        selectable ? SELECTION_COLUMN_WIDTH : 0,
      ),
    [allColumns, containerWidth, selectable],
  );
  // The last rung. Revelation budgets columns by `minWidth`, but a value can
  // still be wider than its budget — a long unbroken email, a one-line mono
  // identifier in the first column. If the table overflows its container once
  // revelation has run, the table is SQUEEZED: every cell (and sort label)
  // releases its one-line posture and may break anywhere, which an auto-layout
  // table can always fit. Measured in a layout effect, so it lands before
  // paint. The verdict is keyed to the layout inputs by identity and re-taken
  // only when one of them changes — never by re-measuring its own result — so
  // it cannot oscillate at a boundary width.
  const layoutKey = React.useMemo(
    () => ({}),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the identity IS the signal
    [
      containerWidth,
      visibleColumns,
      mergedColumns,
      rawData,
      loading,
      selectable,
    ],
  );
  const [squeezedFor, setSqueezedFor] = React.useState<object | null>(null);
  const squeezed = squeezedFor === layoutKey;
  React.useLayoutEffect(() => {
    if (squeezed || containerWidth == null) return;
    const container = tableNode.current?.parentElement;
    if (container && container.scrollWidth > container.clientWidth + 1)
      setSqueezedFor(layoutKey);
  }, [layoutKey, squeezed, containerWidth]);

  // Sort state — controlled when `sort` is provided (even as null), else internal.
  const [activeSort, commitSort] = useControlledState<SortState | null>(
    sort,
    null,
    onSortChange,
  );
  const handleSort = React.useCallback(
    (key: string) => {
      // One key at a time: DataList only SIGNALS intent, and a presentational
      // table that asked its host to honour a priority list would be pretending
      // to own ordering it does not own.
      const first =
        allColumns.find((col) => col.key === key)?.sortFirst ?? "asc";
      if (activeSort?.key !== key) {
        commitSort({ key, direction: first });
        return;
      }
      // first → the other → none
      commitSort(
        activeSort.direction === first
          ? { key, direction: first === "asc" ? "desc" : "asc" }
          : null,
      );
    },
    [activeSort, commitSort, allColumns],
  );

  // Client-side ordering: `sortMode="client"`, or a column that brings its own `compare`.
  const sortedData = React.useMemo(() => {
    if (!activeSort) return rawData;
    const col = allColumns.find((c) => c.key === activeSort.key);
    if (!col || (sortMode !== "client" && !col.compare)) return rawData;
    const cmp =
      col.compare ??
      ((a: T, b: T) =>
        defaultCompare(
          (a as Record<string, unknown>)[col.key],
          (b as Record<string, unknown>)[col.key],
        ));
    const sign = activeSort.direction === "desc" ? -1 : 1;
    return [...rawData].sort((a, b) => sign * cmp(a, b));
  }, [rawData, activeSort, allColumns, sortMode]);
  const data = sortedData;

  // ---- view (list | grid | board), remembered for the session ------------
  const [activeView, commitView] = useControlledState<DataListView>(
    view,
    defaultView,
    onViewChange,
  );
  const listLabel = (tableProps as { "aria-label"?: string })["aria-label"];
  const storageKeyFor = React.useCallback(
    () =>
      viewStorageKey ??
      `data-list-view:${typeof window === "undefined" ? "" : window.location.pathname}:${listLabel ?? ""}`,
    [viewStorageKey, listLabel],
  );
  const restoredView = React.useRef(false);
  React.useEffect(() => {
    if (!onViewChange || restoredView.current) return;
    restoredView.current = true;
    try {
      const stored = window.sessionStorage.getItem(storageKeyFor());
      if (
        stored &&
        stored !== activeView &&
        (views as readonly string[]).includes(stored)
      )
        commitView(stored as DataListView);
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the view just isn't remembered.
    }
  }, [onViewChange, storageKeyFor, activeView, views, commitView]);
  const changeView = React.useCallback(
    (next: DataListView) => {
      try {
        window.sessionStorage.setItem(storageKeyFor(), next);
      } catch {
        // See above.
      }
      commitView(next);
    },
    [commitView, storageKeyFor],
  );
  const viewToggle = onViewChange ? (
    <ViewToggle value={activeView} onValueChange={changeView} views={views} />
  ) : null;

  const rowIds = React.useMemo(
    () => data.map((row, i) => getRowId(row, i)),
    [data, getRowId],
  );

  const { selected, allSelected, indeterminate, toggleAll, toggleRow } =
    useRowSelection({ rowIds, selectedIds, onSelectionChange });

  // One cell's content: `column.render` invoked as a plain function (see its
  // JSDoc), or the raw `row[key]`. Shared by a column's own cell and by the
  // primary cell's merged stack, so a merged value reads exactly as it would
  // in its own column.
  const renderCell = (
    col: DataListColumn<T>,
    row: T,
    index: number,
    rowId: string,
    isSelected: boolean,
  ): React.ReactNode =>
    col.render
      ? col.render(row, index, {
          rowId,
          columnKey: col.key,
          selected: isSelected,
        })
      : ((row as Record<string, React.ReactNode>)[col.key] ?? null);

  // Mouse-pointer convenience: clicking anywhere in the row activates it. A
  // `<tr>` may carry an `onClick` without an ARIA role (it keeps `role="row"`),
  // so this does NOT break table semantics. Keyboard / AT activation comes from
  // the real `<button>` injected into the first cell (below), not from the row.
  // Guarded so a click that originated from an interactive descendant (the
  // selection checkbox, a nested button/link, a form control, AND the injected
  // first-cell button itself) does NOT *also* fire — that control owns its
  // behaviour, preventing double-activation. The checkbox cell's
  // stopPropagation below is kept as defence in depth.
  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>, row: T, index: number) => {
      if (isFromInteractiveDescendant(event)) return;
      const link = event.currentTarget.querySelector<HTMLElement>(
        '[data-slot="data-list-row-link"]',
      );
      if (link) {
        // Forward the click to the row's real link with its modifiers, so ⌘/Ctrl/Shift and the
        // middle button open it where the browser would.
        link.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            button: event.button,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
          }),
        );
        return;
      }
      onRowClick?.(row, index);
    },
    [onRowClick],
  );

  // The active sort's column may have been merged or hidden, taking its header
  // (arrow and `aria-sort`) with it. Say what the order is instead.
  const sortSummary = activeSort
    ? offscreenSortSummary([activeSort], allColumns, visibleColumns)
    : null;

  const colSpan = visibleColumns.length + (selectable ? 1 : 0);
  const tableDescribedBy =
    [
      ariaDescribedBy,
      loading ? loadingStatusId : null,
      hiddenColumns.length > 0 ? hiddenHintId : null,
      sortSummary ? sortHintId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const loadingStatus = loading ? (
    <div
      id={loadingStatusId}
      role="status"
      aria-live="polite"
      className="sr-only"
    >
      Loading rows
    </div>
  ) : null;

  // Revelation dropped something, or moved the sorted column out of the header
  // row. Saying so is the whole point: a column that vanishes with no
  // affordance is silent data loss, and a sort with no header is an order
  // nobody can read. The table is described by each line, so assistive
  // technology hears them with the table. They render AFTER the table inside
  // the root stack, so their appearing never moves the table in the tree (a
  // remount would drop focus inside it).
  const statusLines =
    hiddenColumns.length > 0 || sortSummary ? (
      <div
        data-slot="data-list-status"
        className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
      >
        {hiddenColumns.length > 0 ? (
          <p id={hiddenHintId} data-slot="data-list-hidden-hint">
            {hiddenColumns.length} column
            {hiddenColumns.length === 1 ? "" : "s"} hidden
          </p>
        ) : null}
        {sortSummary ? (
          <p id={sortHintId} data-slot="data-list-sort-hint">
            {sortSummary}
          </p>
        ) : null}
      </div>
    ) : null;

  const renderRow = (row: T, index: number) => {
    const id = rowIds[index]!;
    const isSelected = selected.has(id);
    const href = getRowHref?.(row);
    const clickable = !!onRowClick || href !== undefined;
    const linkFirstCell =
      href !== undefined && visibleColumns[0]?.interactive !== true;
    // Inject the accessible row-activation button into the first cell —
    // but never when that first column is `interactive` (it already
    // renders its own focusable control, so wrapping would nest one
    // interactive element inside another).
    const injectRowButton =
      !!onRowClick &&
      href === undefined &&
      visibleColumns[0]?.interactive !== true;
    const {
      highlighted = highlightedIds?.has(id) ?? false,
      className: rowClassName,
      ...rowAttributes
    } = rowProps?.(row, index) ?? {};
    return (
      <TableRow
        key={id}
        {...rowAttributes}
        data-highlighted={highlighted ? "" : undefined}
        data-slot="data-list-row"
        data-selected={isSelected ? "" : undefined}
        data-clickable={clickable ? "" : undefined}
        onClick={clickable ? (e) => handleRowClick(e, row, index) : undefined}
        onAuxClick={
          href !== undefined
            ? (e) => {
                if (e.button === 1) handleRowClick(e, row, index);
              }
            : undefined
        }
        className={cn(
          clickable &&
            "cursor-pointer [&_a]:no-underline [&_a:focus-visible]:no-underline [&_a:hover]:no-underline",
          // A highlighted row (`rowProps` → `highlighted`) eases into the accent wash over
          // `TableRow`'s own `transition-colors`; reduced motion drops the ease (global reset).
          highlighted && "bg-accent duration-slow",
          rowClassName,
          // A checked row keeps a persistent half-`muted` wash through hover and press
          // (SP-06), light enough that a `secondary` Badge in it stays visible — see
          // `SELECTED_ROW_CLASS`. The checkbox is the authoritative selection cue, and its wash
          // comes last so neither `highlighted` nor a `rowProps` class can remove it.
          isSelected && SELECTED_ROW_CLASS,
        )}
      >
        {selectable && (
          <SelectionCell
            checked={isSelected}
            onToggle={() => toggleRow(id)}
            label={
              getRowLabel
                ? `Select ${getRowLabel(row)}`
                : `Select row ${index + 1}`
            }
          />
        )}
        {visibleColumns.map((col, colIdx) => {
          const value = renderCell(col, row, index, id, isSelected);
          const content = col.thumbnail ? (
            <span
              data-slot="data-list-thumbnail-cell"
              className="flex min-w-0 items-center gap-3"
            >
              <Thumbnail
                size="sm"
                src={col.thumbnail(row)}
                alt=""
                fallback={thumbnailFallback}
              />
              <span className="min-w-0">{value}</span>
            </span>
          ) : (
            value
          );
          // First cell + activatable + not an interactive column → wrap
          // the content in a real <button>. It lives INSIDE the <td>, so
          // the cell keeps its `role="cell"` and the row its `role="row"`;
          // this is the focusable, Enter/Space-activatable control for
          // keyboard / AT users. The `data-list-row-action` button is
          // matched by INTERACTIVE_SELECTOR, so the row's mouse onClick
          // guard skips it — no double-activation.
          const isActionCell = injectRowButton && colIdx === 0;
          return (
            <TableCell
              key={col.key}
              className={cn(
                columnCellClass(col),
                col.className,
                col.cellClassName?.(row, index),
              )}
            >
              {colIdx === 0 && linkFirstCell ? (
                <RowLink href={href!} render={rowLinkRender}>
                  {content}
                </RowLink>
              ) : isActionCell ? (
                <button
                  type="button"
                  data-slot="data-list-row-action"
                  onClick={() => onRowClick?.(row, index)}
                  className="-mx-1 -my-0.5 inline-flex max-w-full appearance-none items-center rounded-sm bg-transparent px-1 py-0.5 text-start text-inherit"
                >
                  {content}
                </button>
              ) : (
                content
              )}
              {colIdx === 0 && mergedColumns.length > 0 ? (
                // Overflow columns stack under the primary value. Each keeps its header as
                // an sr-only prefix: a value lifted out of its column loses the header a
                // screen reader would otherwise announce with it.
                // `mt-1`, not `mt-0.5`: the injected row-action button is 24px tall inside a
                // 20px line box (`-my-0.5`), so it overhangs the line by 2px. Stacking the
                // merged block any closer would cover the bottom of its pointer target.
                <span
                  data-slot="data-list-merged"
                  data-layout={mergedLayout}
                  className={cn(
                    "mt-1 flex min-w-0 text-xs text-muted-foreground",
                    mergedLayout === "line"
                      ? "flex-row flex-wrap gap-x-1"
                      : "flex-col gap-0.5",
                  )}
                >
                  {mergedColumns.map((merged, mergedIdx) => (
                    // Each value wraps and wears its own column's face, whatever the
                    // primary cell's `nowrap`/mono posture is (`mergedValueClass`).
                    <span
                      key={merged.key}
                      data-sorted={
                        activeSort?.key === merged.key
                          ? activeSort.direction
                          : undefined
                      }
                      className={mergedValueClass(merged)}
                    >
                      {mergedLayout === "line" && mergedIdx > 0 ? (
                        // `line`: a decorative dot before every value but the first.
                        <span aria-hidden="true" className="me-1">
                          ·
                        </span>
                      ) : null}
                      {merged.mergedRender ? (
                        merged.mergedRender(row, index, {
                          rowId: id,
                          columnKey: merged.key,
                          selected: isSelected,
                        })
                      ) : (
                        <>
                          {typeof merged.header === "string" ? (
                            <span className="sr-only">{merged.header}: </span>
                          ) : null}
                          {renderCell(merged, row, index, id, isSelected)}
                        </>
                      )}
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

  // Sections: one <tbody> per non-empty section, in the order the host lists them; rows whose
  // section is not listed follow in a headerless body so nothing silently disappears.
  const [groups, commitGroups] = useControlledState<GroupState>(
    groupState,
    defaultGroupState ?? EMPTY_GROUP_STATE,
    onGroupStateChange,
  );
  const sectionGroups = React.useMemo(() => {
    if (!sections || !getRowSection) return null;
    const byId = new Map<string, number[]>();
    data.forEach((row, index) => {
      const key = getRowSection(row);
      const list = byId.get(key);
      if (list) list.push(index);
      else byId.set(key, [index]);
    });
    const out: {
      id: string;
      label: React.ReactNode | null;
      count?: number;
      indexes: number[];
    }[] = [];
    for (const section of sections) {
      const indexes = byId.get(section.id);
      byId.delete(section.id);
      if (!indexes || indexes.length === 0) continue;
      out.push({
        id: section.id,
        label: section.label,
        count: section.count ?? indexes.length,
        indexes,
      });
    }
    const rest = [...byId.values()].flat().sort((a, b) => a - b);
    if (rest.length > 0)
      out.push({ id: "__unsectioned", label: null, indexes: rest });
    return out;
  }, [data, getRowSection, sections]);

  const table = (
    // DS-68: a list owns its keyboard model — a row link or a row click, not one tab stop per
    // clipped value or timestamp — so truncated text and RelativeTime in the cells are not tab
    // stops. A cell can opt back in with its own `focusable`.
    <TruncationFocusProvider focusable={false}>
      {loadingStatus}
      <Table
        ref={tableRef}
        data-slot="data-list"
        className={className}
        aria-busy={loading ? true : ariaBusy}
        aria-describedby={tableDescribedBy}
        aria-rowcount={loadMore?.hasMore ? -1 : undefined}
        data-squeezed={squeezed ? "" : undefined}
        {...tableProps}
      >
        <TableHeader>
          <TableRow>
            {selectable && (
              <SelectAllHead
                checked={allSelected}
                indeterminate={indeterminate}
                onToggle={toggleAll}
                disabled={loading || rowIds.length === 0}
              />
            )}
            {visibleColumns.map((col) => (
              <SortableHead
                key={col.key}
                data-slot="data-list-head"
                column={col}
                direction={
                  activeSort?.key === col.key ? activeSort.direction : null
                }
                onSort={() => handleSort(col.key)}
              />
            ))}
          </TableRow>
        </TableHeader>

        {loading ? (
          <TableBody>
            <SkeletonRows
              columns={visibleColumns}
              rows={loadingRows}
              selectable={selectable}
              slot="data-list-skeleton-row"
            />
          </TableBody>
        ) : data.length === 0 ? (
          <TableBody>
            <EmptyRow colSpan={colSpan} slot="data-list-empty-row">
              {noResults ? (
                <NoResultsEmpty {...(noResults === true ? {} : noResults)} />
              ) : (
                emptyState
              )}
            </EmptyRow>
          </TableBody>
        ) : sectionGroups ? (
          sectionGroups.map((group) => {
            const expanded = groups[group.id] !== "collapsed";
            return (
              <TableBody
                key={group.id}
                data-slot="data-list-section"
                data-section={group.id}
                data-collapsed={expanded ? undefined : ""}
              >
                {group.label != null ? (
                  <SectionRow
                    id={group.id}
                    label={group.label}
                    count={group.count}
                    colSpan={colSpan}
                    expanded={expanded}
                    onExpandedChange={(next) =>
                      commitGroups({
                        ...groups,
                        [group.id]: next ? "expanded" : "collapsed",
                      })
                    }
                    countLabel={sectionCountLabel}
                  />
                ) : null}
                {expanded
                  ? group.indexes.map((index) => renderRow(data[index]!, index))
                  : null}
              </TableBody>
            );
          })
        ) : (
          <TableBody>
            {data.map((row, index) => renderRow(row, index))}
          </TableBody>
        )}
      </Table>
      {statusLines}
    </TruncationFocusProvider>
  );

  // ONE root in every configuration. The status lines (and the sr-only loading
  // status) are DataList's own nodes; returned as a fragment they became extra
  // children of the HOST's container — a stray item in its grid or flex row.
  // `w-full min-w-0` keeps the width the bare `table-container` had (it is
  // `w-full`), so a host layout sees one full-width block either way. `ref` and
  // `className` still reach the `<table>`.
  // ---- grid and board ------------------------------------------------------
  const thumbnailColumn = columns.find((col) => col.thumbnail);
  const metaColumns = columns.slice(1);
  const cardMeta = (row: T, index: number) => {
    const id = rowIds[index]!;
    const parts = metaColumns
      .map((col) =>
        col.mergedRender
          ? col.mergedRender(row, index, {
              rowId: id,
              columnKey: col.key,
              selected: false,
            })
          : renderCell(col, row, index, id, false),
      )
      .filter((part) => part != null && part !== "" && part !== false);
    if (parts.length === 0) return undefined;
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {i > 0 ? " · " : null}
        {part}
      </React.Fragment>
    ));
  };
  const defaultCard = (row: T, index: number, onBoard: boolean) => {
    const first = columns[0];
    const id = rowIds[index]!;
    return (
      <MediaCard
        size={onBoard ? "default" : gridSize}
        surface={!onBoard}
        href={onBoard ? undefined : getRowHref?.(row)}
        linkRender={rowLinkRender}
        image={
          thumbnailColumn
            ? (thumbnailColumn.thumbnail!(row) ?? null)
            : undefined
        }
        fallback={thumbnailColumn ? thumbnailFallback : undefined}
        title={first ? renderCell(first, row, index, id, false) : null}
        meta={cardMeta(row, index)}
        actions={
          !onBoard && rowActions ? (
            <RowActionsMenu
              label={getRowLabel?.(row) ?? "row"}
              actions={rowActions(row)}
              actionsLabel={rowActionsLabel}
            />
          ) : undefined
        }
      />
    );
  };
  const gridClass = cn(
    "grid grid-cols-1 gap-3",
    gridSize === "lg"
      ? "@xl/data-list:grid-cols-2 @5xl/data-list:grid-cols-3"
      : "@xl/data-list:grid-cols-2 @4xl/data-list:grid-cols-3",
  );
  const gridCards = (indexes: number[]) => (
    <div role="list" data-slot="data-list-grid" className={gridClass}>
      {indexes.map((index) => (
        <div role="listitem" key={rowIds[index]} className="min-w-0">
          {renderCard
            ? renderCard(data[index]!, index)
            : defaultCard(data[index]!, index, false)}
        </div>
      ))}
    </div>
  );
  const emptyContent = noResults ? (
    <NoResultsEmpty {...(noResults === true ? {} : noResults)} />
  ) : (
    (emptyState ?? (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No data</EmptyTitle>
          <EmptyDescription>There are no records to display.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  );
  const allIndexes = () => data.map((_, index) => index);
  const renderGrid = () => (
    <div
      data-slot="data-list-grid-root"
      aria-label={listLabel}
      aria-busy={loading || undefined}
      className="flex min-w-0 flex-col gap-6"
    >
      {loadingStatus}
      {loading ? (
        <div className={gridClass} data-slot="data-list-grid-skeleton">
          {Array.from({ length: loadingRows }, (_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "rounded-lg",
                gridSize === "lg" ? "aspect-[4/3]" : "h-16",
              )}
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        emptyContent
      ) : sectionGroups ? (
        sectionGroups.map((group) => (
          <section
            key={group.id}
            data-slot="data-list-grid-section"
            data-section={group.id}
            aria-label={
              typeof group.label === "string" ? group.label : undefined
            }
            className="flex min-w-0 flex-col gap-3"
          >
            {group.label != null ? (
              <h3 className="text-sm font-medium">
                {group.label}
                <span className="font-normal text-muted-foreground">
                  {" · "}
                  <span className="tabular-nums">
                    {group.count ?? group.indexes.length}
                  </span>
                </span>
              </h3>
            ) : null}
            {gridCards(group.indexes)}
          </section>
        ))
      ) : (
        gridCards(allIndexes())
      )}
    </div>
  );

  const rowIndex = new Map<T, number>();
  data.forEach((row, index) => rowIndex.set(row, index));
  const boardLanes: BoardColumn<T>[] = (
    sections && getRowSection ? sections : [{ id: "__all", label: "All" }]
  ).map((section) => ({
    id: section.id,
    title: section.label,
    label: typeof section.label === "string" ? section.label : undefined,
    items: getRowSection
      ? data.filter((row) => getRowSection(row) === section.id)
      : data,
    count: section.count,
    loading: section.loading ?? loading,
    loadMore: section.loadMore,
    emptyState: section.emptyState,
  }));
  const renderBoard = () =>
    !loading && data.length === 0 && noResults ? (
      emptyContent
    ) : (
      <Board<T>
        aria-label={listLabel}
        columns={boardLanes}
        getItemId={(row) => rowIds[rowIndex.get(row) ?? 0]!}
        getItemLabel={getRowLabel}
        getItemHref={getRowHref}
        itemLinkRender={rowLinkRender}
        getItemActions={rowActions}
        actionsLabel={rowActionsLabel}
        countLabel={sectionCountLabel}
        onCardActivate={
          onRowClick
            ? (row) => onRowClick(row, rowIndex.get(row) ?? 0)
            : undefined
        }
        dragDisabled={!onMove}
        onMove={(move) => {
          const index = rowIds.indexOf(move.id);
          if (index < 0 || !onMove) return;
          return onMove(
            data[index]!,
            move.from.container,
            move.to.container,
            move,
          );
        }}
        renderCard={(row) => {
          const index = rowIndex.get(row) ?? 0;
          return renderCard
            ? renderCard(row, index)
            : defaultCard(row, index, true);
        }}
      />
    );

  // The view toggle lands in the toolbar's FilterBar `view` slot, else beside the toolbar.
  const toolbarWithToggle =
    viewToggle &&
    React.isValidElement<{ view?: React.ReactNode }>(toolbar) &&
    toolbar.type === FilterBar &&
    toolbar.props.view == null ? (
      React.cloneElement(toolbar, { view: viewToggle })
    ) : viewToggle ? (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {toolbar != null ? (
          <div className="min-w-0 flex-1">{toolbar}</div>
        ) : null}
        <div className="ms-auto">{viewToggle}</div>
      </div>
    ) : (
      toolbar
    );

  return (
    <div
      data-slot="data-list-root"
      data-view={activeView}
      className="@container/data-list flex w-full min-w-0 flex-col gap-3"
    >
      {toolbarWithToggle != null ? (
        <div data-slot="data-list-toolbar">{toolbarWithToggle}</div>
      ) : null}
      {activeView === "grid"
        ? renderGrid()
        : activeView === "board"
          ? renderBoard()
          : table}
      {loadMore ? <LoadMore {...loadMore} /> : null}
      {footer != null ? <div data-slot="data-list-footer">{footer}</div> : null}
    </div>
  );
}

DataList.displayName = "DataList";

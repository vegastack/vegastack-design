// @vegastack display-menu@0.25.103 sha256-f9eHmbf2wRVeyDVLV71tsG/cVqG3z9Msqd6LrBDj0vg=

"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  ListToolbarButton,
  ListToolbarPopover,
  useListToolbar,
  type ListToolbarLayout,
  type ListToolbarLayoutValue,
} from "@/components/ui/list-toolbar";
import { SortableList } from "@/components/ui/sortable-list";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/* ---
`DisplayMenu` is the toolbar's Display tool: how the rows look, and which kinds of rows are
included. Its sections appear only when filled, always in this order — Layout, Sort by (once the
toolbar has folded them in), Rows (row height, group by, columns), Show (Show archived, Show
closed, Show subtasks…), and Reset. It is one surface: no filled rows and no control tracks inside
it, every row 32px tall from the same 8px inset. Columns drill in within the same surface, and
reorder where the page supports it; a long list (a table's 24 fields) scrolls inside the menu. On a
phone it is a bottom sheet.
--- */

const LAYOUT_META: Record<
  ListToolbarLayoutValue,
  { label: string; icon: React.ReactNode }
> = {
  list: { label: "List", icon: <List aria-hidden /> },
  board: { label: "Board", icon: <Columns3 aria-hidden /> },
  grid: { label: "Grid", icon: <LayoutGrid aria-hidden /> },
};

/** Row height: a choice of text-labelled heights. */
export interface DisplayMenuRowHeight<V extends string = string> {
  /** The current height. */
  value: V;
  /** The heights, in order (Compact · Comfortable; Short · Medium · Tall). */
  options: readonly { value: V; label: string }[];
  /** Called with the height picked. */
  onValueChange: (value: V) => void;
}

/** One column (or field) the list can show or hide. */
export interface DisplayMenuColumn {
  /** Stable id. */
  id: string;
  /** The column's name. */
  label: string;
  /** Whether it shows. */
  visible: boolean;
  /**
   * Always shown and not movable (the name column).
   * @default false
   */
  locked?: boolean;
}

/** Columns: which show, and (optionally) their order. */
export interface DisplayMenuColumns {
  /**
   * The row's and the drill-in's title.
   * @default "Columns"
   */
  title?: string;
  /** The columns, in order. */
  items: readonly DisplayMenuColumn[];
  /** Show or hide one. */
  onToggle: (id: string, visible: boolean) => void;
  /**
   * Move one (from index → to index). Omitted, the columns do not reorder.
   * @default undefined
   */
  onReorder?: (from: number, to: number) => void;
  /**
   * Show every column (the drill-in's "Show all").
   * @default undefined
   */
  onShowAll?: () => void;
}

/** One "Show …" switch. */
export interface DisplayMenuToggle {
  /** Stable id. */
  id: string;
  /** The switch's text ("Show archived"). */
  label: string;
  /** Whether it is on. */
  checked: boolean;
  /** Called with the next state. */
  onCheckedChange: (checked: boolean) => void;
  /**
   * Shown but not available.
   * @default false
   */
  disabled?: boolean;
}

/** The words `DisplayMenu` shows. */
export interface DisplayMenuLabels {
  /** The tool's name and the sheet's title. */
  display: string;
  /** The Layout section's heading. */
  layout: string;
  /** The folded Sort row's text. */
  sortBy: string;
  /** The row-height row's text. */
  rowHeight: string;
  /** The group-by block's heading. */
  groupBy: string;
  /** The back button of a drill-in. */
  back: string;
  /** The columns drill-in's "show every column" action. */
  showAll: string;
  /** "5 of 7" on the Columns row. */
  shownOf: (shown: number, total: number) => string;
}

const DEFAULT_LABELS: DisplayMenuLabels = {
  display: "Display",
  layout: "Layout",
  sortBy: "Sort by",
  rowHeight: "Row height",
  groupBy: "Group by",
  back: "Back",
  showAll: "Show all",
  shownOf: (shown, total) => `${shown} of ${total}`,
};

/** Props accepted by `DisplayMenu`. */
export interface DisplayMenuProps {
  /**
   * Layout, as a section with labelled options. The toolbar fills it once Layout folds into
   * Display; pass it yourself to always show it.
   * @default undefined
   */
  layout?: ListToolbarLayout;
  /**
   * Row height, as text-labelled options.
   * @default undefined
   */
  rowHeight?: DisplayMenuRowHeight;
  /**
   * Group by — a `GroupByPicker` (or a `Select`).
   * @default undefined
   */
  groupBy?: React.ReactNode;
  /**
   * The columns (or a table's fields): a row that drills into show/hide and order.
   * @default undefined
   */
  columns?: DisplayMenuColumns;
  /**
   * The "Show …" switches the page supports, in order.
   * @default []
   */
  toggles?: readonly DisplayMenuToggle[];
  /**
   * Put everything back. Shown only while `isDefault` is false.
   * @default undefined
   */
  onReset?: () => void;
  /**
   * The reset action's text ("Reset to saved view" on a table).
   * @default "Reset to default"
   */
  resetLabel?: string;
  /**
   * Whether the display is the page's default. `false` puts a dot on the tool and shows Reset.
   * @default true
   */
  isDefault?: boolean;
  /**
   * The component's words.
   * @default English
   */
  labels?: Partial<DisplayMenuLabels>;
}

/** A menu row: text at the menu's 6px inset, a control at the end (28px, 32px around a 28px control). */
function DisplayRow({
  label,
  labelId,
  children,
  className,
}: {
  label: React.ReactNode;
  labelId?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="display-menu-row"
      className={cn(
        "flex min-h-7 min-w-0 items-center justify-between gap-3 px-1.5 py-0.5 text-sm",
        className,
      )}
    >
      <span id={labelId} className="min-w-0 truncate">
        {label}
      </span>
      {children}
    </div>
  );
}

/** A section heading: muted, at the menu's 6px inset (the `DropdownMenuLabel`'s box). */
function DisplaySectionLabel({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      data-slot="display-menu-label"
      className="flex h-6 items-center px-1.5 text-xs text-muted-foreground"
    >
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div
      aria-hidden
      data-slot="display-menu-divider"
      className="-mx-1 my-1 h-px bg-border"
    />
  );
}

/** A row that opens a drill-in: label, a summary, and a chevron. */
function DrillRow({
  label,
  summary,
  onOpen,
  "data-slot": dataSlot,
}: {
  label: string;
  summary: React.ReactNode;
  onOpen: () => void;
  "data-slot": string;
}) {
  return (
    <Button
      variant="ghost"
      data-slot={dataSlot}
      onClick={onOpen}
      className="h-7 w-full justify-between gap-3 rounded-md px-1.5 font-normal"
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
        <span className="min-w-0 truncate">{summary}</span>
        <ChevronRight aria-hidden />
      </span>
    </Button>
  );
}

/** The header of a drill-in: back, the title, an optional action at the end. */
function DrillHeader({
  title,
  backLabel,
  onBack,
  action,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-slot="display-menu-drill-header"
      className="flex h-7 items-center gap-1"
    >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={backLabel}
        data-slot="display-menu-back"
        onClick={onBack}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {title}
      </span>
      {action}
    </div>
  );
}

/**
 * `DisplayMenu` — the toolbar's Display tool (sliders icon): Layout and Sort once the toolbar has
 * folded them in, then Rows (row height, group by, a Columns drill-in), the "Show …" switches, and
 * Reset. Sections show only when filled. A dot on the tool while the display is not the page's
 * default. Put it in `ListToolbar`'s `display`.
 *
 * @example
 * <DisplayMenu
 *   rowHeight={{ value: density, options: [{ value: "compact", label: "Compact" }, { value: "comfortable", label: "Comfortable" }], onValueChange: setDensity }}
 *   toggles={[{ id: "closed", label: "Show closed", checked: showClosed, onCheckedChange: setShowClosed }]}
 *   isDefault={!showClosed && density === "comfortable"}
 *   onReset={reset}
 * />
 */
export function DisplayMenu({
  layout: layoutProp,
  rowHeight,
  groupBy,
  columns,
  toggles = [],
  onReset,
  resetLabel = "Reset to default",
  isDefault = true,
  labels: labelsProp,
}: DisplayMenuProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const toolbar = useListToolbar();
  const layout = layoutProp ?? toolbar?.foldedLayout ?? null;
  const sort = toolbar?.foldedSort ?? null;
  const [page, setPage] = React.useState<"main" | "columns" | "sort">("main");
  const [open, setOpen] = React.useState(false);
  const rowHeightId = React.useId();
  const groupById = React.useId();
  const showId = React.useId();
  const layoutId = React.useId();

  const columnsTitle = columns?.title ?? "Columns";
  const shown = columns?.items.filter((c) => c.visible).length ?? 0;
  const sortChanged = sort != null && sort.isDefault === false;
  const dot = !isDefault || sortChanged;

  const sections: React.ReactNode[] = [];
  if (layout != null)
    sections.push(
      <div
        key="layout"
        role="group"
        aria-labelledby={layoutId}
        className="flex flex-col"
      >
        <DisplaySectionLabel id={layoutId}>{labels.layout}</DisplaySectionLabel>
        <ToggleGroup
          data-slot="display-menu-layout"
          variant="outline"
          size="sm"
          spacing={0}
          deselectable={false}
          value={[layout.value]}
          onValueChange={(next) => {
            const value = next[0] as ListToolbarLayoutValue | undefined;
            if (value && layout.options.includes(value))
              layout.onValueChange(value);
          }}
          className="w-full px-1.5"
        >
          {layout.options.map((option) => (
            <ToggleGroupItem key={option} value={option} className="flex-1">
              {LAYOUT_META[option].icon}
              {layout.labels?.[option] ?? LAYOUT_META[option].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>,
    );
  if (sort != null)
    sections.push(
      <DrillRow
        key="sort"
        data-slot="display-menu-sort"
        label={labels.sortBy}
        summary={sort.summary ?? null}
        onOpen={() => setPage("sort")}
      />,
    );
  const rows: React.ReactNode[] = [];
  if (rowHeight != null)
    rows.push(
      <DisplayRow
        key="row-height"
        label={labels.rowHeight}
        labelId={rowHeightId}
      >
        <ToggleGroup
          data-slot="display-menu-row-height"
          aria-labelledby={rowHeightId}
          variant="outline"
          size="sm"
          spacing={0}
          deselectable={false}
          value={[rowHeight.value]}
          onValueChange={(next) => {
            const value = next[0];
            if (typeof value === "string") rowHeight.onValueChange(value);
          }}
        >
          {rowHeight.options.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </DisplayRow>,
    );
  if (groupBy != null)
    rows.push(
      <div
        key="group-by"
        role="group"
        aria-labelledby={groupById}
        data-slot="display-menu-group-by"
        className="flex flex-col"
      >
        <DisplaySectionLabel id={groupById}>
          {labels.groupBy}
        </DisplaySectionLabel>
        {groupBy}
      </div>,
    );
  if (columns != null)
    rows.push(
      <DrillRow
        key="columns"
        data-slot="display-menu-columns"
        label={columnsTitle}
        summary={labels.shownOf(shown, columns.items.length)}
        onOpen={() => setPage("columns")}
      />,
    );
  if (rows.length > 0)
    sections.push(
      <div key="rows" data-slot="display-menu-rows" className="flex flex-col">
        {rows}
      </div>,
    );
  if (toggles.length > 0)
    sections.push(
      <div
        key="show"
        role="group"
        aria-labelledby={showId}
        data-slot="display-menu-show"
        className="flex flex-col"
      >
        <span id={showId} className="sr-only">
          {labels.display}
        </span>
        {toggles.map((toggle) => (
          <ToggleRow key={toggle.id} toggle={toggle} />
        ))}
      </div>,
    );
  const showReset = onReset != null && !isDefault;

  const main = (
    <>
      {sections.map((section, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <Divider /> : null}
          {section}
        </React.Fragment>
      ))}
      {showReset ? (
        <>
          {sections.length > 0 ? <Divider /> : null}
          <Button
            variant="ghost"
            data-slot="display-menu-reset"
            className="h-7 w-full justify-start rounded-md px-1.5 font-normal"
            onClick={onReset}
          >
            {resetLabel}
          </Button>
        </>
      ) : null}
    </>
  );

  let body: React.ReactNode = main;
  if (page === "sort" && sort != null)
    body = (
      <>
        <DrillHeader
          title={sort.label ?? "Sort"}
          backLabel={labels.back}
          onBack={() => setPage("main")}
        />
        {sort.content}
      </>
    );
  if (page === "columns" && columns != null)
    body = (
      <>
        <DrillHeader
          title={columnsTitle}
          backLabel={labels.back}
          onBack={() => setPage("main")}
          action={
            columns.onShowAll && shown < columns.items.length ? (
              <Button
                variant="ghost"
                size="sm"
                className="font-normal text-muted-foreground"
                onClick={columns.onShowAll}
              >
                {labels.showAll}
              </Button>
            ) : undefined
          }
        />
        {/* A long table's fields scroll inside the menu instead of running off the screen. */}
        <div
          data-slot="display-menu-columns-list"
          className="-me-1 max-h-72 min-h-0 overflow-y-auto overscroll-contain pe-1"
        >
          <ColumnsList columns={columns} />
        </div>
      </>
    );

  if (sections.length === 0 && !showReset) return null;

  return (
    <ListToolbarPopover
      title={labels.display}
      size="md"
      data-slot="display-menu-content"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Every opening starts on the main page.
        if (!next) setPage("main");
      }}
      trigger={
        <ListToolbarButton
          data-slot="display-menu-trigger"
          icon={<SlidersHorizontal aria-hidden />}
          label={labels.display}
          dot={dot}
        />
      }
    >
      {body}
    </ListToolbarPopover>
  );
}

/** One "Show …" row: the text, and the switch at the end. */
function ToggleRow({ toggle }: { toggle: DisplayMenuToggle }) {
  const id = React.useId();
  return (
    <DisplayRow label={toggle.label} labelId={id}>
      <Switch
        data-slot="display-menu-toggle"
        aria-labelledby={id}
        checked={toggle.checked}
        disabled={toggle.disabled}
        onCheckedChange={(checked) => toggle.onCheckedChange(checked)}
      />
    </DisplayRow>
  );
}

/** The Columns drill-in: an eye per column, a handle where the page reorders them. */
function ColumnsList({ columns }: { columns: DisplayMenuColumns }) {
  const eye = (column: DisplayMenuColumn) =>
    column.locked ? null : (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${column.visible ? "Hide" : "Show"} ${column.label}`}
        aria-pressed={column.visible}
        data-slot="display-menu-column-toggle"
        className={cn(!column.visible && "text-muted-foreground")}
        onClick={() => columns.onToggle(column.id, !column.visible)}
      >
        {column.visible ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
      </Button>
    );
  if (columns.onReorder == null)
    return (
      <div
        role="list"
        aria-label={columns.title ?? "Columns"}
        className="flex flex-col"
      >
        {columns.items.map((column) => (
          <div role="listitem" key={column.id}>
            <DisplayRow label={column.label}>{eye(column)}</DisplayRow>
          </div>
        ))}
      </div>
    );
  const onReorder = columns.onReorder;
  return (
    <SortableList
      aria-label={columns.title ?? "Columns"}
      flush
      handle="auto"
      items={columns.items.map((column) => ({
        ...column,
        disabled: column.locked,
      }))}
      onReorder={({ from, to }) => onReorder(from.index, to.index)}
      renderItem={(column) => (
        <span
          className={cn(
            "truncate text-sm",
            !column.visible && "text-muted-foreground",
          )}
        >
          {column.label}
        </span>
      )}
      renderActions={eye}
    />
  );
}

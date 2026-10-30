// @vegastack list-toolbar@0.26.0 sha256-G3KEkoh0cvB0QY7DOgYN4CzbHs07Vmc4zqpuNzXMhL8=

"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  Columns3,
  Ellipsis,
  LayoutGrid,
  List,
  ListFilter,
} from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchInput } from "@/components/ui/search-input";
import {
  SuggestionMenu,
  suggestionMenuOptionId,
} from "@/components/ui/suggestion-menu";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { layoutTierQuery } from "@/lib/page-layout";

/* ---
`ListToolbar` is the one header row of every list and table: the search on the LEFT, and on the
right a tight cluster of borderless icon tools — Filter, Sort, Layout, Display, ⋯. Scope tabs (or a
table's saved views) sit in their own row ABOVE it, and the filter row of chips opens UNDER it from
the Filter tool. A tool renders only when the page passes it something to do. The page's main
button is not part of it: it lives at the right end of the app's top bar on every page type.

The row never wraps. It measures its own width and gives way in a fixed order: the search
shrinks, Layout and then Sort move into Display, the search becomes an icon, and a table's
undo/redo move into ⋯. Filter, Display and ⋯ never go. On a phone every tool's popover is a bottom
sheet.
--- */

/** A layout a list can switch to. */
export type ListToolbarLayoutValue = "list" | "board" | "grid";

const LAYOUT_META: Record<
  ListToolbarLayoutValue,
  { label: string; icon: React.ReactNode }
> = {
  list: { label: "List", icon: <List aria-hidden /> },
  board: { label: "Board", icon: <Columns3 aria-hidden /> },
  grid: { label: "Grid", icon: <LayoutGrid aria-hidden /> },
};

/** The toolbar's search field. */
export interface ListToolbarSearch {
  /** The query. */
  value: string;
  /** Called on every keystroke. */
  onValueChange: (value: string) => void;
  /**
   * Called with the settled query (after the debounce, on Enter, on clear) — send the query here.
   * @default undefined
   */
  onValueCommitted?: (value: string) => void;
  /**
   * The field's placeholder ("Search tasks").
   * @default "Search"
   */
  placeholder?: string;
  /**
   * The field's accessible name.
   * @default placeholder
   */
  "aria-label"?: string;
  /**
   * Debounce for `onValueCommitted`, in ms.
   * @default 300
   */
  debounceMs?: number;
  /**
   * One action offered under the field while the query reads as a phrase — a page's "Filter with
   * AI". It shows once the query has `minWords` words, never runs while typing, and Enter alone
   * still searches; ↓ then Enter, or a click, picks it.
   * @default undefined
   */
  suggestion?: ListToolbarSearchSuggestion;
}

/** The action a toolbar search offers under its field (`ListToolbarSearch.suggestion`). */
export interface ListToolbarSearchSuggestion {
  /** The row's text. */
  label: string;
  /**
   * The row's leading glyph.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * How many words the query needs before the row shows.
   * @default 3
   */
  minWords?: number;
  /**
   * Picked, with the query as typed. Return a promise to open the filter row (`opensFilter`) once
   * it settles; resolving to `false` keeps the row as it is.
   */
  onSelect: (value: string) => void | Promise<unknown>;
  /**
   * Open the filter row once `onSelect` settles — the action sets filters.
   * @default false
   */
  opensFilter?: boolean;
}

/** Words in a query: runs of non-space characters. */
const wordCount = (value: string) =>
  value.trim() === "" ? 0 : value.trim().split(/\s+/u).length;

/** The Filter tool: it opens and closes the filter row. */
export interface ListToolbarFilter {
  /**
   * Whether the filter row is open (controlled).
   * @default undefined
   */
  open?: boolean;
  /**
   * Whether the row starts open (uncontrolled).
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called when the row opens or closes.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The number of filters applied. Omitted, the `FilterRow` counts its own chips and set facets.
   * @default undefined
   */
  count?: number;
  /**
   * Remember the open state for this page in `sessionStorage` under this key.
   * @default undefined
   */
  storageKey?: string;
  /**
   * The tool's name.
   * @default "Filter"
   */
  label?: string;
}

/** The Sort tool. */
export interface ListToolbarSort {
  /** The popover's body: a `SortMenu` (one key) or a `SortBuilder` (several). */
  content: React.ReactNode;
  /**
   * `single` (a `SortMenu`, default-width popover) or `multi` (a `SortBuilder`, wider).
   * @default "single"
   */
  variant?: "single" | "multi";
  /**
   * Whether the order is the page's default. `false` puts a dot on the tool.
   * @default true
   */
  isDefault?: boolean;
  /**
   * How many keys are set (multi): shown on the tool instead of the dot.
   * @default undefined
   */
  count?: number;
  /**
   * One line that says the order ("Due date, oldest first") — Display's row once Sort folds into it.
   * @default undefined
   */
  summary?: React.ReactNode;
  /**
   * The tool's name.
   * @default "Sort"
   */
  label?: string;
}

/**
 * The Layout tool: ONE icon button that switches the view — it shows the icon of the layout it
 * switches to. With three layouts it steps through them in order; Display's Layout section (once
 * Layout folds into it, or passed to `DisplayMenu`) picks any of them directly.
 */
export interface ListToolbarLayout<
  L extends ListToolbarLayoutValue = ListToolbarLayoutValue,
> {
  /** The current layout. */
  value: L;
  /** The layouts offered, in order (two or three). */
  options: readonly L[];
  /** Called with the layout picked. */
  onValueChange: (value: L) => void;
  /**
   * Relabel a layout ("Cards" for "Grid").
   * @default undefined
   */
  labels?: Partial<Record<ListToolbarLayoutValue, string>>;
}

/** One item of a toolbar menu (⋯, the edit group). */
export interface ListToolbarMenuItem {
  /** Stable key. */
  id: string;
  /** The item's text (and, in the edit group, the button's name and tooltip). */
  label: string;
  /**
   * Leading icon — required for an edit-group button.
   * @default undefined
   */
  icon?: React.ReactNode;
  /** Run the action. */
  onSelect: () => void;
  /**
   * A destructive action ("Empty trash"), drawn in the destructive ink.
   * @default false
   */
  destructive?: boolean;
  /**
   * Shown but not available (Undo with nothing to undo).
   * @default false
   */
  disabled?: boolean;
  /**
   * The keyboard shortcut shown in the tooltip ("⌘Z").
   * @default undefined
   */
  shortcut?: string;
}

/** Props accepted by `ListToolbar`. */
export interface ListToolbarProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /**
   * The row ABOVE the toolbar: scope `Tabs` (`TabsList overflow="menu"`), `RouteTabs`
   * (`overflow="menu"`) or a table's `ViewTabs`. At most one. It folds into a dropdown on its own
   * when it does not fit.
   * @default undefined
   */
  tabs?: React.ReactNode;
  /**
   * The search field, at the start (left) of the row.
   * @default undefined
   */
  search?: ListToolbarSearch;
  /**
   * The Filter tool. Shown when this or `filterRow` is given.
   * @default undefined
   */
  filter?: ListToolbarFilter;
  /**
   * The row under the toolbar that the Filter tool opens — a `FilterRow`.
   * @default undefined
   */
  filterRow?: React.ReactNode;
  /**
   * The Sort tool. Omit it where order is fixed (a board).
   * @default undefined
   */
  sort?: ListToolbarSort;
  /**
   * The Layout tool. Omit it where a page has one layout.
   * @default undefined
   */
  layout?: ListToolbarLayout;
  /**
   * The Display tool — a `DisplayMenu`.
   * @default undefined
   */
  display?: React.ReactNode;
  /**
   * The ⋯ tool — a `ListToolbarMenu` of actions on the view.
   * @default undefined
   */
  more?: React.ReactNode;
  /**
   * A state button before the edit group and the tools ("Save view" on a changed table view).
   * It leaves the row at the last collapse step, so keep its action in ⋯ too.
   * @default undefined
   */
  state?: React.ReactNode;
  /**
   * Edit tools (a table's Undo, Redo): icon buttons with a divider after them. They move into ⋯
   * last of all.
   * @default undefined
   */
  edit?: readonly ListToolbarMenuItem[];
  /**
   * `compact` is the toolbar of a short list inside a record tab: 28px tools, no shortcuts.
   * @default "default"
   */
  size?: "default" | "compact";
  /**
   * `/` focuses the search and `F` opens the filter row, unless focus is in a field.
   * @default true (false when `size="compact"`)
   */
  shortcuts?: boolean;
  /**
   * The toolbar's accessible name.
   * @default "List controls"
   */
  "aria-label"?: string;
}

/** What `ListToolbar` shares with the tools inside it. */
interface ListToolbarContextValue {
  /** Tools 28px instead of 32px. */
  compact: boolean;
  /** Below the tablet tier: toolbar popovers become bottom sheets. */
  phone: boolean;
  /** Sort, when it has folded into Display. */
  foldedSort: ListToolbarSort | null;
  /** Layout, when it has folded into Display. */
  foldedLayout: ListToolbarLayout | null;
  /** The edit group, when it has folded into ⋯. */
  foldedEdit: readonly ListToolbarMenuItem[] | null;
  /** A FilterRow reports how many filters are applied. */
  reportFilterCount: (count: number | null) => void;
  /** Bumped when the filter row opens with nothing applied: + Filter opens itself. */
  addFilterRequest: number;
}

const ListToolbarContext = React.createContext<ListToolbarContextValue | null>(
  null,
);

/**
 * `useListToolbar` — read the enclosing `ListToolbar`'s shared state (for the tools built on it:
 * `DisplayMenu`, `FilterRow`, `AddFilterMenu`). `null` outside a toolbar.
 *
 * @example
 * const toolbar = useListToolbar();
 * const phone = toolbar?.phone ?? false;
 */
export function useListToolbar() {
  return React.useContext(ListToolbarContext);
}

/* ------------------------------------------------------------------------------------------------
 * ListToolbarButton
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ListToolbarButton`. */
export interface ListToolbarButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children" | "size" | "variant"
> {
  /** The tool's icon (16px). */
  icon: React.ReactNode;
  /** The tool's name: its tooltip and the start of its accessible name. */
  label: string;
  /**
   * A count shown after the icon ("▽2") — filters applied, sort keys. Nothing at 0.
   * @default undefined
   */
  count?: number;
  /**
   * A 6px dot on the icon: the tool is not at the page's default.
   * @default false
   */
  dot?: boolean;
  /**
   * The keyboard shortcut shown in the tooltip ("F").
   * @default undefined
   */
  shortcut?: string;
}

/**
 * `ListToolbarButton` — one icon tool of a `ListToolbar`: a borderless 32px button (28px in a
 * compact toolbar), muted until hovered or open, with a tooltip naming it (and its shortcut), a
 * count or a dot for its state, and an accessible name that says both ("Filter, 2 active").
 * Pass it as a popover or menu trigger's `render`.
 *
 * @example
 * <PopoverTrigger render={<ListToolbarButton icon={<ArrowUpDown />} label="Sort" dot />} />
 */
export function ListToolbarButton({
  icon,
  label,
  count,
  dot = false,
  shortcut,
  className,
  "aria-label": ariaLabel,
  ...props
}: ListToolbarButtonProps) {
  const toolbar = React.useContext(ListToolbarContext);
  const compact = toolbar?.compact ?? false;
  const counted = count != null && count > 0;
  const name =
    ariaLabel ??
    [
      label,
      counted ? `${count} active` : null,
      dot && !counted ? "changed" : null,
    ]
      .filter(Boolean)
      .join(", ");
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={compact ? "icon-sm" : "icon"}
            aria-label={name}
            data-dot={dot && !counted ? "" : undefined}
            className={cn(
              "relative shrink-0 text-muted-foreground hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground",
              counted && "w-auto gap-1 px-2",
              className,
            )}
            {...props}
          >
            {icon}
            {counted ? (
              <span
                aria-hidden
                data-slot="list-toolbar-count"
                className="text-xs text-foreground tabular-nums"
              >
                {count}
              </span>
            ) : null}
            {dot && !counted ? (
              <span
                aria-hidden
                data-slot="list-toolbar-dot"
                className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-primary"
              />
            ) : null}
          </Button>
        }
      />
      <TooltipContent>
        {label}
        {shortcut ? (
          <span className="text-background/60">{shortcut}</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------------------------------------
 * ListToolbarPopover
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ListToolbarPopover`. */
export interface ListToolbarPopoverProps {
  /** The trigger — usually a `ListToolbarButton`. */
  trigger: React.ReactElement;
  /** The surface's name: the sheet's title on a phone, the popover's accessible name. */
  title: string;
  /** The body. */
  children: React.ReactNode;
  /**
   * `default` (288px), `md` (320px), or `lg` (576px — a condition builder) on a tablet or wider.
   * @default "default"
   */
  size?: "default" | "md" | "lg";
  /**
   * The popover's alignment to its trigger.
   * @default "end"
   */
  align?: "start" | "center" | "end";
  /**
   * Whether it is open (controlled).
   * @default undefined
   */
  open?: boolean;
  /**
   * Called when it opens or closes.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The surface's `data-slot`.
   * @default "list-toolbar-popover"
   */
  "data-slot"?: string;
  /**
   * Extra classes for the surface.
   * @default undefined
   */
  className?: string;
}

/**
 * `ListToolbarPopover` — the one surface every toolbar tool opens: on a tablet or wider a popover
 * with the `DropdownMenu`'s own rhythm — a 4px inset, 28px rows at a 6px inset, 24px section
 * labels, hairlines edge to edge — and on a phone a bottom sheet with the same rows: the title
 * at 16px, the rows' text on the title's edge, an 8px step from the title to the first row (no
 * empty band). One surface, no fills inside it.
 *
 * @example
 * <ListToolbarPopover title="Sort" trigger={<ListToolbarButton icon={<ArrowUpDown />} label="Sort" />}>
 *   <SortMenu … />
 * </ListToolbarPopover>
 */
export function ListToolbarPopover({
  trigger,
  title,
  children,
  size = "default",
  align = "end",
  open,
  onOpenChange,
  "data-slot": dataSlot = "list-toolbar-popover",
  className,
}: ListToolbarPopoverProps) {
  const toolbar = React.useContext(ListToolbarContext);
  const phoneWindow = useMediaQuery(layoutTierQuery(undefined, "tablet"));
  const phone = toolbar?.phone ?? phoneWindow;
  if (phone)
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger render={trigger} />
        <SheetContent side="bottom" data-slot={dataSlot} className="gap-0">
          <SheetHeader data-slot="list-toolbar-sheet-header" className="pb-2">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {/* 10px + a row's 6px inset puts every row's text on the title's 16px edge; hairlines
              reach the sheet's edges as they reach the popover's. */}
          <SheetBody
            data-slot="list-toolbar-sheet-body"
            className={cn(
              "flex flex-col px-2.5 pb-4 [&_[data-slot$=-divider]]:-mx-2.5",
              className,
            )}
          >
            {children}
          </SheetBody>
        </SheetContent>
      </Sheet>
    );
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        align={align}
        size={size === "lg" ? "default" : size}
        aria-label={title}
        data-slot={dataSlot}
        className={cn(
          "max-w-[calc(100vw-2rem)] gap-0 p-1",
          size === "lg" && "w-144",
          className,
        )}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** Props accepted by `ListToolbarDrillHeader`. */
export interface ListToolbarDrillHeaderProps {
  /** The drilled-in page's name ("Sort", "Columns", "Custom range"). */
  title: string;
  /** Back to the surface's first page. */
  onBack: () => void;
  /**
   * The back control's accessible name.
   * @default "Back"
   */
  backLabel?: string;
  /**
   * An action at the end ("Show all").
   * @default undefined
   */
  action?: React.ReactNode;
}

/**
 * `ListToolbarDrillHeader` — the head of a page drilled into inside a toolbar surface (Display ›
 * Sort, + Filter › a field, a date filter's custom range): one 28px row whose ‹ sits on the rows'
 * 6px inset, the title beside it in the rows' type, an optional action at the end.
 *
 * @example
 * <ListToolbarDrillHeader title="Columns" onBack={() => setPage("main")} />
 */
export function ListToolbarDrillHeader({
  title,
  onBack,
  backLabel = "Back",
  action,
}: ListToolbarDrillHeaderProps) {
  return (
    <div
      data-slot="list-toolbar-drill-header"
      className="flex h-7 min-w-0 items-center gap-1"
    >
      <Button
        variant="ghost"
        aria-label={backLabel}
        data-slot="list-toolbar-drill-back"
        onClick={onBack}
        className="h-7 min-w-0 flex-1 justify-start gap-1.5 rounded-md px-1.5 text-sm font-medium [&_svg]:text-muted-foreground"
      >
        <ChevronLeft aria-hidden />
        <span className="min-w-0 truncate">{title}</span>
      </Button>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * ListToolbarMenu
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ListToolbarMenu`. */
export interface ListToolbarMenuProps {
  /** The actions on the view, in order; `"separator"` draws a divider. */
  items: readonly (ListToolbarMenuItem | "separator")[];
  /**
   * The tool's name.
   * @default "More"
   */
  label?: string;
}

/**
 * `ListToolbarMenu` — the toolbar's ⋯: actions on the view (Save view, Reset to default, Copy link,
 * Export, Empty trash). It renders nothing when it has no items, and once a table's undo/redo
 * fold away they lead it.
 *
 * @example
 * <ListToolbarMenu items={[{ id: "export", label: "Export CSV", onSelect: exportCsv }]} />
 */
export function ListToolbarMenu({
  items,
  label = "More",
}: ListToolbarMenuProps) {
  const toolbar = React.useContext(ListToolbarContext);
  const folded = toolbar?.foldedEdit ?? null;
  const all: (ListToolbarMenuItem | "separator")[] = [
    ...(folded ?? []),
    ...(folded?.length && items.some((item) => item !== "separator")
      ? (["separator"] as const)
      : []),
    ...items,
  ];
  // No leading, trailing or doubled dividers.
  const clean = all.filter(
    (item, index) =>
      item !== "separator" ||
      (index > 0 && index < all.length - 1 && all[index - 1] !== "separator"),
  );
  if (!clean.some((item) => item !== "separator")) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <ListToolbarButton
            data-slot="list-toolbar-more"
            icon={<Ellipsis aria-hidden />}
            label={label}
          />
        }
      />
      <DropdownMenuContent align="end" className="min-w-48">
        {clean.map((item, index) =>
          item === "separator" ? (
            <DropdownMenuSeparator key={`separator-${index}`} />
          ) : (
            <DropdownMenuItem
              key={item.id}
              variant={item.destructive ? "destructive" : "default"}
              disabled={item.disabled}
              onClick={item.onSelect}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------------------------------------------------------------------------
 * ListToolbar
 * ----------------------------------------------------------------------------------------------*/

/** Fixed metrics the collapse arithmetic uses (px). */
const METRICS = {
  /** Between the search and the tools, and between the right zone's parts. */
  gap: 8,
  /** Between the icon tools. */
  toolGap: 4,
  /** The search's narrowest open width (`min-w-36`); it grows to 320px when there is room. */
  search: 144,
};

/**
 * The collapse steps, in order. Each level keeps everything the previous one did.
 * 0 all out (the search shrinks from 320px to 144px first) · 1 layout → Display ·
 * 2 sort → Display · 3 search → icon · 4 edit and state → ⋯.
 */
const MAX_LEVEL = 4;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true']") != null
  );
}

/**
 * `ListToolbar` — the one header row of every list and table. The search left; the icon tools
 * (Filter · Sort · Layout · Display · ⋯) right; scope tabs in their own row above; the filter row
 * under it when Filter is open. One look at every width: it measures its own width (not the
 * viewport) and gives way in a fixed order — the search shrinks, Layout then Sort move into
 * Display, the search becomes an icon, the edit tools move into ⋯. Filter, Display and ⋯ always
 * stay. No main button: that sits at the right end of the app's top bar. Presentational: the host
 * owns every value.
 *
 * @example
 * <ListToolbar
 *   tabs={<Tabs value={scope} onValueChange={setScope}><TabsList overflow="menu">…</TabsList></Tabs>}
 *   search={{ value: query, onValueChange: setQuery, placeholder: "Search tasks" }}
 *   filterRow={<FilterRow addFilter={<AddFilterMenu fields={fields} onPick={add} />} chips={chips} onClear={clear} />}
 *   sort={{ content: <SortMenu fields={sortFields} value={sort} onValueChange={setSort} />, isDefault }}
 *   layout={{ value: layout, options: ["list", "board"], onValueChange: setLayout }}
 *   display={<DisplayMenu toggles={[showClosed]} />}
 * />
 */
export function ListToolbar({
  tabs,
  search,
  filter,
  filterRow,
  sort,
  layout,
  display,
  more,
  state,
  edit,
  size = "default",
  shortcuts,
  className,
  "aria-label": ariaLabel = "List controls",
  ref,
  ...props
}: ListToolbarProps) {
  const compact = size === "compact";
  const phone = useMediaQuery(layoutTierQuery(undefined, "tablet"));
  const icon = compact ? 28 : 32;

  /* --- Filter row open state --------------------------------------------------------------- */
  const hasFilter = filter != null || filterRow != null;
  const [reportedCount, setReportedCount] = React.useState<number | null>(null);
  const reportFilterCount = React.useCallback(
    (count: number | null) => setReportedCount(count),
    [],
  );
  const filterCount = filter?.count ?? reportedCount ?? 0;
  const [openState, setOpenState] = React.useState(
    filter?.defaultOpen ?? false,
  );
  const filterOpen = filter?.open ?? openState;
  const storageKey = filter?.storageKey;
  React.useEffect(() => {
    if (filter?.open !== undefined || storageKey == null) return;
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored === "1" || stored === "0") setOpenState(stored === "1");
    } catch {
      // Storage can be unavailable; the row just isn't remembered.
    }
  }, [filter?.open, storageKey]);
  const [addFilterRequest, setAddFilterRequest] = React.useState(0);
  const setFilterOpen = (next: boolean) => {
    if (filter?.open === undefined) {
      setOpenState(next);
      if (storageKey != null) {
        try {
          window.sessionStorage.setItem(storageKey, next ? "1" : "0");
        } catch {
          // See above.
        }
      }
    }
    // Opened with nothing applied: + Filter opens with focus in its input.
    if (next && filterCount === 0) setAddFilterRequest((n) => n + 1);
    filter?.onOpenChange?.(next);
  };
  const filterRowId = React.useId();
  // Open the row without + Filter's focus request: what the search suggestion set is the content.
  const revealFilterRow = () => {
    if (openRef.current.filterOpen) return;
    if (filter?.open === undefined) {
      setOpenState(true);
      if (storageKey != null) {
        try {
          window.sessionStorage.setItem(storageKey, "1");
        } catch {
          // See above.
        }
      }
    }
    filter?.onOpenChange?.(true);
  };

  /* --- Measured collapse ------------------------------------------------------------------- */
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const mergedRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const widths = React.useRef<Record<string, number>>({});
  const [level, setLevel] = React.useState(0);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const frozen = React.useRef(false);
  const hasDisplay = display != null;
  const hasLayout = layout != null && layout.options.length > 1;
  const editCount = edit?.length ?? 0;

  const measure = React.useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const available = row.clientWidth;
    const cache = widths.current;
    const read = (slot: string, fallback: number) => {
      const node = row.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
      if (node && node.offsetWidth > 0) cache[slot] = node.offsetWidth;
      return cache[slot] ?? fallback;
    };
    const filterWidth = hasFilter ? read("list-toolbar-filter", icon) : 0;
    const stateWidth = state != null ? read("list-toolbar-state", 96) : 0;
    const editWidth =
      editCount > 0 ? editCount * icon + (editCount - 1) * METRICS.toolGap : 0;
    const need = (lvl: number) => {
      const tools: number[] = [];
      if (hasFilter) tools.push(filterWidth);
      if (sort != null && !(lvl >= 2 && hasDisplay)) tools.push(icon);
      if (hasLayout && !(lvl >= 1 && hasDisplay)) tools.push(icon);
      if (hasDisplay) tools.push(icon);
      if (more != null || (editCount > 0 && lvl >= 4)) tools.push(icon);
      const parts = [
        tools.reduce((sum, w) => sum + w, 0) +
          Math.max(0, tools.length - 1) * METRICS.toolGap,
      ];
      if (search != null) parts.push(lvl >= 3 ? icon : METRICS.search);
      if (editCount > 0 && lvl < 4) parts.push(editWidth + 1 + METRICS.gap);
      if (stateWidth && lvl < 4) parts.push(stateWidth);
      return (
        parts.reduce((sum, w) => sum + w, 0) +
        Math.max(0, parts.filter((w) => w > 0).length - 1) * METRICS.gap
      );
    };
    let next = MAX_LEVEL;
    for (let lvl = 0; lvl <= MAX_LEVEL; lvl++) {
      if (need(lvl) <= available + 0.5) {
        next = lvl;
        break;
      }
    }
    // While an icon search is open the level never drops below the icon step, so the field does
    // not flip back mid-edit; a narrowing row still collapses further.
    if (frozen.current) next = Math.max(next, 3);
    setLevel(next);
  }, [
    editCount,
    hasDisplay,
    hasFilter,
    hasLayout,
    icon,
    more,
    search,
    sort,
    state,
  ]);
  React.useLayoutEffect(() => {
    measure();
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [measure]);

  // Open while focused from the icon, or while it holds a query (a restored search included).
  const searchExpanded =
    search != null && level >= 3 && (searchOpen || search.value !== "");
  frozen.current = searchExpanded;
  const foldLayout = hasDisplay && hasLayout && level >= 1;
  const foldSort = hasDisplay && sort != null && level >= 2;
  const iconSearch = search != null && level >= 3;
  const foldEdit = editCount > 0 && level >= 4;

  /* --- Shortcuts --------------------------------------------------------------------------- */
  const shortcutsOn = shortcuts ?? !compact;
  const openRef = React.useRef({ filterOpen, setFilterOpen, hasFilter });
  React.useEffect(() => {
    openRef.current = { filterOpen, setFilterOpen, hasFilter };
  });
  React.useEffect(() => {
    if (!shortcutsOn) return;
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target) ||
        // Not while a dialog, sheet or menu has the keyboard.
        document.querySelector(
          "[role=dialog][data-open], [role=menu][data-open]",
        )
      )
        return;
      if (event.key === "/" && search != null) {
        const root = rootRef.current;
        const field = root?.querySelector<HTMLInputElement>(
          '[data-slot="list-toolbar-search"] input',
        );
        if (field) {
          event.preventDefault();
          field.focus();
          return;
        }
        const toggle = root?.querySelector<HTMLButtonElement>(
          '[data-slot="list-toolbar-search-toggle"]',
        );
        if (toggle) {
          event.preventDefault();
          toggle.click();
        }
      } else if (
        (event.key === "f" || event.key === "F") &&
        openRef.current.hasFilter
      ) {
        event.preventDefault();
        openRef.current.setFilterOpen(!openRef.current.filterOpen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcutsOn, search]);

  const context = React.useMemo<ListToolbarContextValue>(
    () => ({
      compact,
      phone,
      foldedSort: foldSort ? sort! : null,
      foldedLayout: foldLayout ? layout! : null,
      foldedEdit: foldEdit ? edit! : null,
      reportFilterCount,
      addFilterRequest,
    }),
    [
      compact,
      phone,
      foldSort,
      sort,
      foldLayout,
      layout,
      foldEdit,
      edit,
      reportFilterCount,
      addFilterRequest,
    ],
  );

  /* --- Tools ------------------------------------------------------------------------------- */
  const filterTool = hasFilter ? (
    <ListToolbarButton
      data-slot="list-toolbar-filter"
      icon={<ListFilter aria-hidden />}
      label={filter?.label ?? "Filter"}
      count={filterCount}
      shortcut={shortcutsOn ? "F" : undefined}
      aria-expanded={filterRow != null ? filterOpen : undefined}
      aria-controls={filterRow != null ? filterRowId : undefined}
      data-state={filterOpen ? "open" : "closed"}
      className={cn(filterOpen && "bg-muted text-foreground")}
      onClick={() => setFilterOpen(!filterOpen)}
    />
  ) : null;

  const sortTool =
    sort != null && !foldSort ? (
      <ListToolbarPopover
        title={sort.label ?? "Sort"}
        size={sort.variant === "multi" ? "md" : "default"}
        data-slot="list-toolbar-sort-content"
        trigger={
          <ListToolbarButton
            data-slot="list-toolbar-sort"
            icon={<ArrowUpDown aria-hidden />}
            label={sort.label ?? "Sort"}
            count={sort.variant === "multi" ? sort.count : undefined}
            dot={sort.isDefault === false}
          />
        }
      >
        {sort.content}
      </ListToolbarPopover>
    ) : null;

  // One button: it shows the layout it switches to (the next one, with three).
  const nextLayout = hasLayout
    ? layout!.options[
        (layout!.options.indexOf(layout!.value) + 1) % layout!.options.length
      ]!
    : null;
  const layoutTool =
    nextLayout != null && !foldLayout ? (
      <ListToolbarButton
        data-slot="list-toolbar-layout"
        data-layout={nextLayout}
        icon={LAYOUT_META[nextLayout].icon}
        label={`${layout!.labels?.[nextLayout] ?? LAYOUT_META[nextLayout].label} view`}
        onClick={() => layout!.onValueChange(nextLayout)}
      />
    ) : null;

  /* --- Search suggestion ------------------------------------------------------------------- */
  const suggestion = search?.suggestion;
  const suggestionId = React.useId();
  const [searchFocused, setSearchFocused] = React.useState(false);
  // Escape hides the row until the query changes.
  const [dismissedAt, setDismissedAt] = React.useState<string | null>(null);
  const [suggestionActive, setSuggestionActive] = React.useState(-1);
  const [suggestionAnchor, setSuggestionAnchor] =
    React.useState<DOMRect | null>(null);
  const searchValue = search?.value ?? "";
  const suggesting =
    suggestion != null &&
    searchFocused &&
    dismissedAt !== searchValue &&
    wordCount(searchValue) >= (suggestion.minWords ?? 3);
  React.useEffect(() => {
    setSuggestionActive(-1);
    // Any edit ends a dismissal, even one that comes back to the dismissed phrase.
    setDismissedAt((dismissed) =>
      dismissed === searchValue ? dismissed : null,
    );
  }, [searchValue]);
  React.useLayoutEffect(() => {
    if (!suggesting) {
      setSuggestionAnchor(null);
      return;
    }
    const measure = () => {
      const field = rootRef.current?.querySelector<HTMLElement>(
        '[data-slot="list-toolbar-search"]',
      );
      setSuggestionAnchor(field ? field.getBoundingClientRect() : null);
    };
    measure();
    // The field moves with the window, a scroll, and the toolbar's own size (a resized pane).
    const observer = new ResizeObserver(measure);
    if (rootRef.current) observer.observe(rootRef.current);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [suggesting, level]);
  const pickSuggestion = () => {
    if (suggestion == null) return;
    const value = searchValue;
    setDismissedAt(value);
    setSuggestionActive(-1);
    const done = suggestion.onSelect(value);
    if (!suggestion.opensFilter || !hasFilter) return;
    if (done instanceof Promise)
      void done.then(
        (result) => {
          if (result !== false) revealFilterRow();
        },
        () => {},
      );
    else revealFilterRow();
  };
  const suggestionShown = suggesting && suggestionAnchor != null;

  const searchField =
    search == null ? null : (
      <SearchInput
        data-slot="list-toolbar-search"
        value={search.value}
        onValueChange={search.onValueChange}
        onValueCommitted={search.onValueCommitted}
        debounceMs={search.debounceMs}
        placeholder={search.placeholder ?? "Search"}
        aria-label={search["aria-label"] ?? search.placeholder ?? "Search"}
        collapsible={iconSearch}
        onExpandedChange={setSearchOpen}
        {...(suggestion != null
          ? {
              role: "combobox",
              "aria-autocomplete": "list" as const,
              "aria-expanded": suggestionShown,
              "aria-controls": suggestionShown ? suggestionId : undefined,
              "aria-activedescendant":
                suggestionShown && suggestionActive >= 0
                  ? suggestionMenuOptionId(suggestionId, suggestionActive)
                  : undefined,
              onFocus: () => setSearchFocused(true),
              onBlur: () => {
                // Leaving the field forgets the reached row: Enter on return searches again.
                setSearchFocused(false);
                setSuggestionActive(-1);
              },
              onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
                if (!suggestionShown) return;
                // An input method's keys pick its candidate, never the row.
                if (event.nativeEvent.isComposing || event.keyCode === 229)
                  return;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  setSuggestionActive(event.key === "ArrowDown" ? 0 : -1);
                } else if (event.key === "Escape") {
                  // Hides the row; a second Escape clears the field.
                  event.preventDefault();
                  event.stopPropagation();
                  setDismissedAt(searchValue);
                } else if (event.key === "Enter" && suggestionActive >= 0) {
                  // Enter with the row reached picks it; otherwise it searches as always.
                  event.preventDefault();
                  pickSuggestion();
                }
              },
            }
          : {})}
        className={cn(
          compact ? "h-7" : "h-8",
          // 320px when there is room, down to 144px; open from an icon, it takes the row's free
          // room and the tools stay in view.
          iconSearch ? "w-auto min-w-0 flex-1" : "w-80 min-w-36 shrink",
        )}
      />
    );

  const editTools =
    editCount > 0 && !foldEdit ? (
      <div
        data-slot="list-toolbar-edit"
        className="flex shrink-0 items-center gap-1"
      >
        {edit!.map((item) => (
          <ListToolbarButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            shortcut={item.shortcut}
            disabled={item.disabled}
            onClick={item.onSelect}
          />
        ))}
        <span aria-hidden className="ms-1 h-4 w-px bg-border" />
      </div>
    ) : null;

  const moreTool = more ?? (foldEdit ? <ListToolbarMenu items={[]} /> : null);

  const filterRowNode =
    filterRow != null ? (
      <div
        id={filterRowId}
        data-slot="list-toolbar-filter-row"
        // Mounted while hidden, so its facets keep reporting whether they are set.
        hidden={!filterOpen}
      >
        {filterRow}
      </div>
    ) : null;

  return (
    <ListToolbarContext.Provider value={context}>
      <div
        ref={mergedRef}
        data-slot="list-toolbar"
        data-size={size}
        data-level={level}
        className={cn(
          "@container/list-toolbar flex w-full min-w-0 flex-col gap-2",
          className,
        )}
        {...props}
      >
        {tabs != null ? (
          <div
            data-slot="list-toolbar-tabs"
            // Its own row: the tab control (Tabs, RouteTabs, ViewTabs) fills it and folds into a
            // dropdown by itself when it does not fit. The page rhythm: 12px from the tabs (their
            // line indicator) to the toolbar row, 8px from the toolbar row to the filter row.
            className="flex w-full min-w-0 items-center pb-1 *:min-w-0 *:flex-1"
          >
            {tabs}
          </div>
        ) : null}
        <div
          ref={rowRef}
          role="toolbar"
          aria-label={ariaLabel}
          data-slot="list-toolbar-row"
          className={cn(
            "relative flex w-full min-w-0 items-center gap-2",
            compact ? "h-7" : "h-8",
          )}
        >
          {searchField}
          <div
            data-slot="list-toolbar-tools"
            className="ms-auto flex shrink-0 items-center gap-2"
          >
            {state != null && level < 4 ? (
              <div
                data-slot="list-toolbar-state"
                className="flex shrink-0 items-center"
              >
                {state}
              </div>
            ) : null}
            {editTools}
            <div
              data-slot="list-toolbar-cluster"
              className="flex shrink-0 items-center gap-1"
            >
              {filterTool}
              {sortTool}
              {layoutTool}
              {display}
              {moreTool}
            </div>
          </div>
        </div>
        {filterRowNode}
        {suggestion != null ? (
          <SuggestionMenu
            id={suggestionId}
            aria-label={suggestion.label}
            anchor={suggestionShown ? suggestionAnchor : null}
            options={[
              {
                key: "suggestion",
                label: suggestion.label,
                icon: suggestion.icon,
                shortcut: suggestionActive >= 0 ? "↵" : undefined,
              },
            ]}
            activeIndex={suggestionActive}
            onActiveIndexChange={setSuggestionActive}
            onSelect={pickSuggestion}
          />
        ) : null}
      </div>
    </ListToolbarContext.Provider>
  );
}

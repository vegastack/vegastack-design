// @vegastack list-toolbar@0.25.102 sha256-pTftDEvG+1uUnujv/wCcTdYC0AQvY7LlNkiO8BqP+AE=

"use client";

import * as React from "react";
import {
  ArrowUpDown,
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
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { layoutTierQuery } from "@/lib/page-layout";

/* ---
`ListToolbar` is the one header row of every list and table: scope tabs (or a table's saved views)
on the left; on the right the search, then a tight cluster of borderless icon tools — Filter, Sort,
Layout, Display, ⋯ — and the page's main button at the end. The filter row of chips opens under it
from the Filter tool. A tool renders only when the page passes it something to do.

The row never wraps. It measures its own width and gives way in a fixed order: the search shrinks,
the tabs fold into a dropdown, Layout and then Sort move into Display, the search becomes an icon,
and a table's undo/redo move into ⋯. Filter, Display, ⋯ and the main button never go. On a phone
every tool's popover is a bottom sheet.
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
   * Start as an icon at every width (a table, where the grid's own header is the focus).
   * @default false
   */
  collapsible?: boolean;
}

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

/** The Layout tool: List | Board | Grid as icons. */
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
   * The left zone: scope `Tabs` (`TabsList size="sm" overflow="menu"`), `RouteTabs` (`overflow="menu"`)
   * or a table's `ViewTabs`. At most one. Omitted, the tools sit right.
   * @default undefined
   */
  tabs?: React.ReactNode;
  /**
   * The search field, right of the tabs and before the tools.
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
   * A state button before the edit group and the search ("Save view" on a changed table view).
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
   * The page's main button, the last item of the row — a `ListToolbarAction`: filled, labelled
   * on a wide toolbar, an icon on a narrow one.
   * @default undefined
   */
  action?: React.ReactNode;
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
  /** Whether the toolbar's main button shows its label. */
  actionLabelled: boolean;
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
   * `default` (288px) or `md` (320px).
   * @default "default"
   */
  size?: "default" | "md";
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
 * `ListToolbarPopover` — the one surface every toolbar tool opens: a popover with an 8px inset
 * and an 8px rhythm on a tablet or wider, a bottom sheet (titled) on a phone. One surface, no
 * fills inside it.
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
        <SheetContent side="bottom" data-slot={dataSlot}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <SheetBody className={cn("flex flex-col gap-2 pb-4", className)}>
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
        size={size}
        aria-label={title}
        data-slot={dataSlot}
        className={cn("max-w-[calc(100vw-2rem)] gap-2 p-2", className)}
      >
        {children}
      </PopoverContent>
    </Popover>
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
 * ListToolbarAction
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ListToolbarAction`. */
export interface ListToolbarActionProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children" | "size"
> {
  /** The action's name ("New task"): the label on a wide toolbar, the tooltip and name on a narrow one. */
  label: string;
  /** The leading icon (a `+`). */
  icon: React.ReactNode;
  /**
   * A trailing chevron: the button opens a menu ("New ▾").
   * @default undefined
   */
  menuIndicator?: React.ReactNode;
}

/**
 * `ListToolbarAction` — the list page's main button, last in the `ListToolbar`: the one filled
 * button on the row, "+ New task" on a wide toolbar and an icon `+` (named, with a tooltip) on a
 * narrow one. Pass it as a menu trigger's `render` for a "New ▾".
 *
 * @example
 * <ListToolbar action={<ListToolbarAction icon={<Plus />} label="New task" onClick={create} />} />
 */
export function ListToolbarAction({
  label,
  icon,
  menuIndicator,
  className,
  ...props
}: ListToolbarActionProps) {
  const toolbar = React.useContext(ListToolbarContext);
  const labelled = toolbar?.actionLabelled ?? true;
  const compact = toolbar?.compact ?? false;
  const button = (
    <Button
      size={
        labelled ? (compact ? "sm" : "default") : compact ? "icon-sm" : "icon"
      }
      aria-label={labelled ? undefined : label}
      data-labelled={labelled ? "" : undefined}
      className={cn("shrink-0", className)}
      {...props}
    >
      {icon}
      {labelled ? label : null}
      {labelled ? menuIndicator : null}
    </Button>
  );
  if (labelled) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------------------------------------
 * ListToolbar
 * ----------------------------------------------------------------------------------------------*/

/** Fixed metrics the collapse arithmetic uses (px). */
const METRICS = {
  zoneGap: 12,
  searchGap: 8,
  toolGap: 4,
  search: [240, 144, 144, 96, 96] as const,
  foldedTabs: 136,
  /** The room a folded tab dropdown is given at the least, so its name stays readable. */
  minFoldedTabs: 112,
  /** The least room a folded tab dropdown keeps (`min-w-18`). */
  minTabs: 72,
};

/**
 * The collapse steps, in order. Each level keeps everything the previous one did.
 * 0 all out · 1 search 144 · 2 tabs folded · 3 layout → Display, search 96 · 4 sort → Display ·
 * 5 search → icon · 6 edit → ⋯.
 */
const MAX_LEVEL = 6;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true']") != null
  );
}

/**
 * `ListToolbar` — the one header row of every list and table. Tabs left; search, the icon tools
 * (Filter · Sort · Layout · Display · ⋯) and the main button right; the filter row under it when
 * Filter is open. One look at every width: it measures its own width (not the viewport) and gives
 * way in a fixed order — the search shrinks, the tabs fold to a dropdown, Layout then Sort move
 * into Display, the search becomes an icon, the edit tools move into ⋯. Filter, Display, ⋯ and
 * the main button always stay. Presentational: the host owns every value.
 *
 * @example
 * <ListToolbar
 *   tabs={<Tabs value={scope} onValueChange={setScope}><TabsList size="sm" overflow="menu">…</TabsList></Tabs>}
 *   search={{ value: query, onValueChange: setQuery, placeholder: "Search tasks" }}
 *   filterRow={<FilterRow addFilter={<AddFilterMenu fields={fields} onPick={add} />} chips={chips} onClear={clear} />}
 *   sort={{ content: <SortMenu fields={sortFields} value={sort} onValueChange={setSort} />, isDefault }}
 *   layout={{ value: layout, options: ["list", "board"], onValueChange: setLayout }}
 *   display={<DisplayMenu toggles={[showClosed]} />}
 *   action={<ListToolbarAction icon={<Plus />} label="New task" onClick={create} />}
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
  action,
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

  /* --- Measured collapse ------------------------------------------------------------------- */
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const mergedRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const tabsRef = React.useRef<HTMLDivElement | null>(null);
  const widths = React.useRef<Record<string, number>>({});
  const [level, setLevel] = React.useState(0);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const frozen = React.useRef(false);
  const hasDisplay = display != null;
  const layoutCount = layout?.options.length ?? 0;
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
    const tabsZone = tabsRef.current;
    let tabsNatural = 0;
    let tabsFolded = 0;
    if (tabsZone) {
      const content = tabsZone.querySelector<HTMLElement>(
        "[data-fold-content]",
      );
      // Hidden while an open icon search takes its room: use the last width it showed.
      const visible = tabsZone.offsetWidth > 0;
      if (visible)
        cache.tabsNatural = content
          ? content.scrollWidth
          : tabsZone.scrollWidth;
      // Buttons the tab control keeps beside its tabs (ViewTabs' `+` and ⋯) take room either way;
      // folded, ViewTabs merges them into one ⋯.
      if (visible) {
        let reserve = 0;
        let one = 0;
        for (const button of tabsZone.querySelectorAll<HTMLElement>(
          "[data-fold-reserve]",
        )) {
          const width = button.offsetWidth + METRICS.toolGap;
          one ||= width;
          reserve += width * (button.hasAttribute("data-merged") ? 2 : 1);
        }
        cache.tabsReserve = reserve;
        cache.tabsReserveFolded = one;
      }
      tabsNatural =
        Math.max(METRICS.minTabs, cache.tabsNatural ?? 0) +
        (cache.tabsReserve ?? 0);
      const trigger = tabsZone.querySelector<HTMLElement>(
        "[data-fold-trigger]",
      );
      // Read squeezed, the dropdown would keep the squeezed width; it keeps a readable name.
      if (trigger && trigger.offsetWidth > 0)
        cache.foldedTabs = Math.max(trigger.offsetWidth, METRICS.minFoldedTabs);
      tabsFolded = Math.max(
        METRICS.minTabs,
        Math.min(
          tabsNatural,
          (cache.foldedTabs ?? METRICS.foldedTabs) +
            (cache.tabsReserveFolded ?? 0),
        ),
      );
    }
    const filterWidth = hasFilter ? read("list-toolbar-filter", icon) : 0;
    const stateWidth = state != null ? read("list-toolbar-state", 96) : 0;
    const editWidth =
      editCount > 0 ? editCount * icon + (editCount - 1) * METRICS.toolGap : 0;
    // The action is labelled below level 3 and an icon from it: read the labelled width only
    // while it shows its label, and count an icon once the level drops it.
    const actionNode = row.querySelector<HTMLElement>(
      '[data-slot="list-toolbar-action"]',
    );
    if (
      actionNode?.querySelector("[data-labelled]") &&
      actionNode.offsetWidth > 0
    )
      cache.actionLabelled = actionNode.offsetWidth;
    const actionWidth = (lvl: number) =>
      action == null ? 0 : lvl >= 3 ? icon : (cache.actionLabelled ?? 120);
    const need = (lvl: number) => {
      const tools: number[] = [];
      if (hasFilter) tools.push(filterWidth);
      if (sort != null && !(lvl >= 4 && hasDisplay)) tools.push(icon);
      if (layoutCount > 0 && !(lvl >= 3 && hasDisplay))
        tools.push(layoutCount * icon + (layoutCount - 1) * METRICS.toolGap);
      if (hasDisplay) tools.push(icon);
      if (more != null || (editCount > 0 && lvl >= 6)) tools.push(icon);
      let right =
        tools.reduce((sum, w) => sum + w, 0) +
        Math.max(0, tools.length - 1) * METRICS.toolGap;
      const parts = [right];
      if (search != null)
        parts.push(
          search.collapsible || lvl >= 5
            ? icon
            : (METRICS.search[Math.min(lvl, 4)] ?? 96),
        );
      if (editCount > 0 && lvl < 6)
        parts.push(editWidth + 1 + METRICS.searchGap);
      if (stateWidth && lvl < 6) parts.push(stateWidth);
      if (action != null) parts.push(actionWidth(lvl));
      right =
        parts.reduce((sum, w) => sum + w, 0) +
        Math.max(0, parts.filter((w) => w > 0).length - 1) * METRICS.searchGap;
      const left = tabsZone ? (lvl >= 2 ? tabsFolded : tabsNatural) : 0;
      return left + (tabsZone ? METRICS.zoneGap : 0) + right;
    };
    let next = MAX_LEVEL;
    for (let lvl = 0; lvl <= MAX_LEVEL; lvl++) {
      if (need(lvl) <= available + 0.5) {
        next = lvl;
        break;
      }
    }
    // While an icon search is open (the tabs give it their room) the level never drops below the
    // icon step, so the field does not flip back mid-edit; a narrowing row still collapses further.
    // An always-collapsible search is an icon at every level, so it needs no floor.
    if (frozen.current && !search?.collapsible) next = Math.max(next, 5);
    setLevel(next);
  }, [
    action,
    editCount,
    hasDisplay,
    hasFilter,
    icon,
    layoutCount,
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
    if (tabsRef.current) {
      observer.observe(tabsRef.current);
      const content = tabsRef.current.querySelector("[data-fold-content]");
      if (content) observer.observe(content);
    }
    return () => observer.disconnect();
  }, [measure, tabs]);

  // Open while focused from the icon, or while it holds a query (a restored search included).
  const searchExpanded =
    search != null &&
    (search.collapsible || level >= 5) &&
    (searchOpen || search.value !== "");
  frozen.current = searchExpanded;
  const foldLayout = hasDisplay && layout != null && level >= 3;
  const foldSort = hasDisplay && sort != null && level >= 4;
  const iconSearch = search != null && (search.collapsible || level >= 5);
  const foldEdit = editCount > 0 && level >= 6;
  // The action's label goes once the tabs have folded and the search is at its narrowest.
  const actionLabelled = level < 3;

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
      actionLabelled,
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
      actionLabelled,
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

  const layoutTool =
    layout != null && !foldLayout ? (
      <ToggleGroup
        data-slot="list-toolbar-layout"
        aria-label="Layout"
        spacing={1}
        deselectable={false}
        value={[layout.value]}
        onValueChange={(next) => {
          const value = next[0] as ListToolbarLayoutValue | undefined;
          if (value && layout.options.includes(value))
            layout.onValueChange(value);
        }}
        className="shrink-0"
      >
        {layout.options.map((option) => {
          const name = layout.labels?.[option] ?? LAYOUT_META[option].label;
          return (
            <Tooltip key={option}>
              <TooltipTrigger
                render={
                  <ToggleGroupItem
                    value={option}
                    aria-label={name}
                    data-layout={option}
                    className={cn(
                      compact ? "size-7 min-w-7" : "size-8 min-w-8",
                      "px-0 text-muted-foreground hover:bg-muted hover:text-foreground data-[state=on]:bg-muted data-[state=on]:text-foreground data-[state=on]:hover:bg-muted aria-pressed:bg-muted aria-pressed:hover:bg-muted",
                    )}
                  >
                    {LAYOUT_META[option].icon}
                  </ToggleGroupItem>
                }
              />
              <TooltipContent>{name}</TooltipContent>
            </Tooltip>
          );
        })}
      </ToggleGroup>
    ) : null;

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
        className={cn(
          compact ? "h-7" : "h-8",
          // Open from an icon, it takes the tabs' room in the row; the tools stay in view.
          iconSearch
            ? "w-auto min-w-24 flex-1"
            : tabs != null
              ? level === 0
                ? "w-60 shrink-0"
                : level < 3
                  ? "w-36 shrink-0"
                  : "w-24 shrink-0"
              : "w-60 min-w-24 shrink",
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
        <div
          ref={rowRef}
          role="toolbar"
          aria-label={ariaLabel}
          data-slot="list-toolbar-row"
          className={cn(
            "relative flex w-full min-w-0 items-center gap-3",
            compact ? "h-7" : "h-8",
          )}
        >
          {tabs != null ? (
            <div
              ref={tabsRef}
              data-slot="list-toolbar-tabs"
              // Takes the room the right zone leaves; a folding tab row measures it.
              // Its child (a Tabs root, RouteTabs, ViewTabs) fills it and may shrink below its
              // tabs' natural width, so a folding row measures this zone and not its own content.
              className={cn(
                "flex min-w-18 flex-1 basis-0 items-center *:min-w-0 *:flex-1",
                // The row's one height: a small pill tab list is lifted to the 32px tier, so its
                // triggers keep a full pointer target.
                "[&_[data-slot=tabs-list][data-size=sm]]:h-8",
                // An open icon search takes this room while it is open.
                searchExpanded && "hidden",
              )}
            >
              {tabs}
            </div>
          ) : null}
          <div
            data-slot="list-toolbar-tools"
            className={cn(
              "flex min-w-0 items-center gap-2",
              tabs == null || searchExpanded
                ? "flex-1 justify-end"
                : "shrink-0",
            )}
          >
            {state != null && level < 6 ? (
              <div
                data-slot="list-toolbar-state"
                className="flex shrink-0 items-center"
              >
                {state}
              </div>
            ) : null}
            {editTools}
            {searchField}
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
            {action != null ? (
              <div
                data-slot="list-toolbar-action"
                className="flex shrink-0 items-center"
              >
                {action}
              </div>
            ) : null}
          </div>
        </div>
        {filterRowNode}
      </div>
    </ListToolbarContext.Provider>
  );
}

// @vegastack filter-bar@0.23.34 sha256-G71qK2BAZcpYs6RRNiFiE2mtrr+mV/H3iqCclNue6D8=

"use client";

import * as React from "react";
import { ChevronDown, CirclePlus, ListFilter, X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Chip } from "@/components/ui/chip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  SearchInput,
  type SearchInputProps,
} from "@/components/ui/search-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SearchableSelect,
  type SearchableSelectProps,
} from "@/components/ui/searchable-select";
import { formatDateRange } from "@/lib/date-time";

/* ------------------------------------------------------------------------------------------------
 * Types
 * ----------------------------------------------------------------------------------------------*/

/**
 * A single active filter shown as a removable chip in the {@link FilterBar}.
 * Purely descriptive — the bar renders it and reports removals; the host owns
 * the underlying filter state.
 */
export interface FilterBarFilter {
  /** Stable identity for the chip (used as the React key and `data-filter-id`). */
  id: string;
  /**
   * The filter's name in sentence case (e.g. `"Status"`). Rendered as the muted leading text
   * of the chip.
   */
  label: React.ReactNode;
  /**
   * Optional human-readable value summary (e.g. `"In Progress"` or
   * `"2 selected"`). Rendered after `label`, separated by a colon. Omit for a
   * presence-only filter.
   */
  value?: React.ReactNode;
  /** Optional leading icon — a single `lucide-react` / `@vegastack/design/icons` element. */
  icon?: React.ReactNode;
  /** Invoked when the chip's remove (`×`) control is activated. */
  onRemove: () => void;
  /**
   * Edit the filter in place: the chip's label and value become a button that opens this
   * content in a popover (a facet list, a date range, a number range). The remove control
   * stays its own target.
   * @default undefined
   */
  editor?: React.ReactNode;
  /**
   * Whether the chip reads as an active selection (the `accent` selected fill).
   * An applied filter is a selection, so this defaults to `true`; set `false`
   * for a presence-only chip on the rest fill.
   * @default true
   */
  active?: boolean;
}

/**
 * An entry in the declarative "More" menu of secondary filters. Provide these via
 * {@link FilterBarProps.addFilters}, or pass `addFilterMenu` for full control.
 */
export interface FilterBarAddOption {
  /** Stable identity for the option (used as the React key and passed to `onAddFilter`). */
  id: string;
  /** The option's label. */
  label: React.ReactNode;
  /** Optional leading icon — a single `lucide-react` / `@vegastack/design/icons` element. */
  icon?: React.ReactNode;
  /** Disables the option and removes it from keyboard navigation. @default false */
  disabled?: boolean;
  /**
   * The new filter's editor. Choosing the option opens it in a popover on the new chip — the
   * filter the host adds with the same `id` — and it stays that chip's editor unless the filter
   * brings its own.
   * @default undefined
   */
  editor?: React.ReactNode;
}

/** Controlled search/query input config for the {@link FilterBar}. */
export interface FilterBarSearch {
  /** The current query value. */
  value: string;
  /** Invoked with the next value on every keystroke. */
  onValueChange: (value: string) => void;
  /**
   * Invoked with the settled query — after `debounceMs` of quiet, and at once
   * on Enter and on clear. Send the query from here, not from `onValueChange`.
   * @default undefined
   */
  onValueCommitted?: (value: string) => void;
  /**
   * Quiet time before `onValueCommitted` fires.
   * @default TIMINGS.searchDebounceMs (300)
   */
  debounceMs?: number;
  /**
   * Placeholder text shown while the query is empty. Also used as the field's
   * accessible name when no `aria-label` is supplied.
   * @default 'Search…'
   */
  placeholder?: string;
  /**
   * Accessible name for the search field. Falls back to `placeholder`, then
   * `'Search'`.
   */
  "aria-label"?: string;
}

/** Props accepted by `FilterBar`. */
export interface FilterBarProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "onChange" | "children"
> {
  /**
   * Controlled search config. The field always leads the first row and takes the free space.
   * Omit to hide it.
   * @default undefined
   */
  search?: FilterBarSearch;
  /** Props forwarded to the underlying {@link SearchInput}.
   * @default undefined
   */
  searchInputProps?: Omit<
    SearchInputProps,
    "defaultValue" | "onChange" | "onValueChange" | "placeholder" | "value"
  >;
  /**
   * @deprecated The search field always leads the first row. Accepted and ignored.
   * @default "start"
   */
  searchPlacement?: "start" | "end";
  /**
   * Whose rows the list shows — views such as "My tasks | Team tasks". Use `Tabs` with the
   * default variant at `size="sm"` (optionally with leading icons). Sits right of the Filters
   * toggle, before `view`.
   * @default undefined
   */
  scope?: React.ReactNode;
  /**
   * How the rows are laid out, pinned furthest right — `ViewToggle`, or a default `Tabs`
   * (`TabsList size="sm"`) with icons such as "List | Board". On a narrow bar only the icons show: wrap each option's text in a
   * `<span>` and it stays as the option's accessible name.
   * @default undefined
   */
  view?: React.ReactNode;
  /**
   * Controls at the very end of the first row, after `view` — a "Select" button, an export menu.
   * @default undefined
   */
  actions?: React.ReactNode;
  /**
   * The primary {@link FilterBarFacet}s ("Status", "Due", "Assignee") and `DateRangeFilter`s,
   * on the filter row the Filters toggle shows. Unset and set share one compact rounded-md chip
   * shape; a set one is tinted and carries a clear control.
   * @default undefined
   */
  facets?: React.ReactNode;
  /**
   * Applied filters shown as removable chips after the facets.
   * @default []
   */
  filters?: FilterBarFilter[];
  /**
   * Called when a chip's editor opens or closes, with the filter's id.
   * @default undefined
   */
  onEditorOpenChange?: (id: string, open: boolean) => void;
  /**
   * The secondary filters offered from the "More" menu. The bar builds the menu and calls
   * `onAddFilter` with the chosen option's `id`. Ignored when `addFilterMenu` is provided.
   * @default undefined
   */
  addFilters?: FilterBarAddOption[];
  /**
   * Called with the chosen option's `id` when an `addFilters` item is selected.
   * @default undefined
   */
  onAddFilter?: (id: string) => void;
  /**
   * A custom "More" menu — the whole {@link DropdownMenu} tree, trigger included. Takes
   * precedence over `addFilters`.
   * @default undefined
   */
  addFilterMenu?: React.ReactNode;
  /**
   * The label of the built-in "More" trigger.
   * @default 'More'
   */
  addFilterLabel?: string;
  /** Alignment of the built-in "More" menu relative to its trigger. @default 'start' */
  addFilterMenuAlign?: React.ComponentProps<
    typeof DropdownMenuContent
  >["align"];
  /**
   * Clears every filter. When set, a "Clear" button sits at the end of the filter row while
   * anything is applied (`activeCount` above 0).
   * @default undefined
   */
  onClear?: () => void;
  /**
   * The label of the "Clear" button.
   * @default 'Clear'
   */
  clearLabel?: string;
  /**
   * How many filters are applied. Drives "Clear", the toggle's "Filters (n)" and its auto-open.
   * Defaults to
   * the facets holding a value plus the `filters` chips.
   * @default undefined
   */
  activeCount?: number;
  /**
   * The filter row's accessible name, and the Filters toggle's label ("Filters (n)").
   * @default 'Filters'
   */
  filtersLabel?: string;
  /**
   * @deprecated The phone bottom sheet is gone; the filter row scrolls sideways instead.
   * Accepted and ignored.
   * @default undefined
   */
  doneLabel?: string;
  /**
   * Whether the filter row is shown (controlled). The Filters toggle flips it.
   * @default undefined
   */
  filtersOpen?: boolean;
  /**
   * Whether the filter row starts shown, when uncontrolled.
   * @default activeCount > 0
   */
  defaultFiltersOpen?: boolean;
  /**
   * Called when the Filters toggle shows or hides the filter row — and when the row opens by
   * itself because a filter became set.
   * @default undefined
   */
  onFiltersOpenChange?: (open: boolean) => void;
  /**
   * Content at the end of the filter row, before "Clear" — e.g. a "Save view" button.
   * @default undefined
   */
  trailing?: React.ReactNode;
}

/* ------------------------------------------------------------------------------------------------
 * FilterChip — a removable filter pill (label + value + remove control)
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `FilterChip`. */
export interface FilterChipProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "onRemove" | "children"
> {
  /** The filter's name (muted leading text). */
  label: React.ReactNode;
  /** Optional value summary, rendered after `label` separated by a colon.
   * @default undefined
   */
  value?: React.ReactNode;
  /** Optional leading icon.
   * @default undefined
   */
  icon?: React.ReactNode;
  /** Invoked when the remove (`×`) control is activated. */
  onRemove: () => void;
  /**
   * Accessible name for the remove control. Defaults to `Clear <label>` when `label` is a
   * string.
   * @default undefined
   */
  removeLabel?: string;
  /**
   * Whether the chip reads as an active selection. An active chip takes
   * `accent`; an inactive chip keeps the rest fill (`muted`).
   * @default true
   */
  active?: boolean;
  /**
   * Content opened from the chip's label and value, which become a button (`FilterChipTrigger`).
   * @default undefined
   */
  editor?: React.ReactNode;
  /**
   * Called when the editor opens or closes.
   * @default undefined
   */
  onEditorOpenChange?: (open: boolean) => void;
  /**
   * Open the editor when the chip mounts — a filter just added from "More".
   * @default false
   */
  defaultEditorOpen?: boolean;
}

/** The chip's "Label: value" text, shared by the plain chip and its editor trigger. */
function FilterChipText({
  label,
  value,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
}) {
  return (
    <>
      {value != null ? (
        // "Label: value" — the colon joins the pair in the accessible name, and the trailing
        // space (collapsed at the end of the flex item) keeps the text reading "Status: Open".
        <span className="shrink-0 text-muted-foreground">
          <span className="text-muted-foreground">{label}</span>:{" "}
        </span>
      ) : (
        <span className="shrink-0 text-muted-foreground">{label}</span>
      )}
      {value != null ? <span className="min-w-0 truncate">{value}</span> : null}
    </>
  );
}

/**
 * `FilterChip` — a single removable filter pill: a `label`, an optional `value`
 * after a colon, and a trailing `×` control that fires `onRemove`. The {@link Chip}
 * primitive in the FilterBar's one chip shape — compact (h-7), rounded-md, quiet type — the
 * same shape as a {@link FilterBarFacet}. An applied filter is a selection, so it carries the
 * tinted fill by default; pass `active={false}` for a plain presence chip.
 * Purely presentational; the {@link FilterBar} renders one per active filter.
 *
 * @example
 * <FilterChip label="Status" value="Active" onRemove={clearStatus} />
 */
export function FilterChip({
  className,
  label,
  value,
  icon,
  onRemove,
  removeLabel,
  active = true,
  editor,
  onEditorOpenChange,
  defaultEditorOpen = false,
  ...props
}: FilterChipProps) {
  const computedRemoveLabel =
    removeLabel ??
    (typeof label === "string" ? `Clear ${label}` : "Clear filter");

  return (
    <Chip
      data-slot="filter-chip"
      size="sm"
      active={active}
      onRemove={onRemove}
      removeLabel={computedRemoveLabel}
      // The FilterBar's one chip shape: compact (h-7), rounded-md, quiet type — set or unset.
      className={cn(
        "max-w-xs rounded-md text-sm font-normal [&_[data-slot=chip-remove]]:rounded-sm",
        className,
      )}
      {...props}
    >
      {/* The icon + label stay muted in BOTH states so the label/value hierarchy
          (muted key, emphasized value) survives activation — the active state is
          carried by the chip's own fill, not by flattening the text tiers. */}
      {icon != null ? (
        <span className="shrink-0 text-muted-foreground">{icon}</span>
      ) : null}
      {editor != null ? (
        <Popover
          defaultOpen={defaultEditorOpen}
          onOpenChange={(open) => onEditorOpenChange?.(open)}
        >
          <PopoverTrigger
            data-slot="filter-chip-trigger"
            className="-my-0.5 -ms-1 inline-flex min-w-0 items-center rounded-sm px-1 py-0.5 text-start hover:bg-foreground/5"
          >
            <FilterChipText label={label} value={value} />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto min-w-56">
            {editor}
          </PopoverContent>
        </Popover>
      ) : (
        <FilterChipText label={label} value={value} />
      )}
    </Chip>
  );
}

/* ------------------------------------------------------------------------------------------------
 * FilterBar
 * ----------------------------------------------------------------------------------------------*/

/**
 * What the bar shares with the facets inside it: each facet reports whether it holds a value, so
 * the bar can count applied filters for "Clear" and "Filters (n)" without the host doing it. A
 * facet can render twice (the row, and the narrow bar's sheet), so reports are per instance and
 * the count is per label.
 */
interface FilterBarContextValue {
  report: (id: string, label: string, active: boolean | null) => void;
}

const FilterBarContext = React.createContext<FilterBarContextValue | null>(
  null,
);

/**
 * One height tier for the whole bar: every control is h-8, the default size. A `ToggleGroup`, `TabsList` or
 * `Select` passed in at `size="sm"` is lifted to h-8 so the rows stay level.
 */
const BAR_SIZE =
  "[&_[data-slot=toggle-group-item][data-size=sm]]:h-8 [&_[data-slot=toggle-group-item][data-size=sm]]:min-w-8 [&_[data-slot=toggle-group-item][data-size=sm]]:text-sm [&_[data-slot=select-trigger][data-size=sm]]:h-8 [&_[data-slot=tabs-list][data-size=sm]]:h-8";

/**
 * `FilterBar` — the toolbar above a list or table, in two rows.
 *
 * Row 1: `[Search ~320px] … [⚲ Filters (n)] [scope] [actions] [view]` — the view furthest right.
 * The Filters toggle shows or hides row 2, opens it by itself when anything becomes set, and
 * shows the applied count.
 * Row 2 (12px below): the `facets`, any applied `filters` chips, a "More" menu of secondary
 * filters, and "Clear" at the end while anything is applied.
 *
 * On a narrow bar (below its own `@3xl` container width) the search takes the full width, then
 * one row holds `[⚲ n] [scope] [view]` (the view icon-only), and the filter row scrolls sideways
 * by touch with a hidden scrollbar.
 *
 * Purely presentational: the host owns every value.
 *
 * @example
 * <FilterBar
 *   search={{ value: query, onValueChange: setQuery, placeholder: "Search tasks" }}
 *   scope={<Tabs value={scope} onValueChange={setScope}><TabsList size="sm"><TabsTrigger value="mine"><UserRound />My tasks</TabsTrigger><TabsTrigger value="team"><UsersRound />Team tasks</TabsTrigger></TabsList></Tabs>}
 *   view={<ViewToggle value={view} onValueChange={setView} views={["list", "board"]} />}
 *   facets={<><FilterBarFacet label="Status" … /><FilterBarFacet label="Due" … /></>}
 *   addFilters={[{ id: "priority", label: "Priority" }]}
 *   onAddFilter={showFacet}
 *   onClear={clearAll}
 * />
 */
export function FilterBar({
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  search,
  searchInputProps,
  searchPlacement: _searchPlacement,
  scope,
  view,
  actions,
  facets,
  filters = [],
  onEditorOpenChange,
  addFilters,
  onAddFilter,
  addFilterMenu,
  addFilterLabel = "More",
  addFilterMenuAlign = "start",
  onClear,
  clearLabel = "Clear",
  activeCount: activeCountProp,
  filtersLabel = "Filters",
  doneLabel: _doneLabel,
  filtersOpen: filtersOpenProp,
  defaultFiltersOpen,
  onFiltersOpenChange,
  trailing,
  ...props
}: FilterBarProps) {
  const hasDeclarativeMenu =
    addFilterMenu == null && addFilters != null && addFilters.length > 0;
  // An option with an `editor` opens it on the chip the host adds for it: the id is held until
  // that chip mounts (with its editor open), then dropped.
  const [editOnMount, setEditOnMount] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (editOnMount != null && filters.some((f) => f.id === editOnMount))
      setEditOnMount(null);
  }, [editOnMount, filters]);

  const [facetState, setFacetState] = React.useState<
    Record<string, { label: string; active: boolean }>
  >({});
  const report = React.useCallback(
    (id: string, label: string, active: boolean | null) =>
      setFacetState((prev) => {
        if (active == null) {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        }
        const current = prev[id];
        if (current?.label === label && current.active === active) return prev;
        return { ...prev, [id]: { label, active } };
      }),
    [],
  );
  const context = React.useMemo(() => ({ report }), [report]);
  const activeFacets = new Set(
    Object.values(facetState)
      .filter((entry) => entry.active)
      .map((entry) => entry.label),
  ).size;
  const activeCount = activeCountProp ?? activeFacets + filters.length;
  const showClear = onClear != null && activeCount > 0;

  const filterRowRef = React.useRef<HTMLDivElement>(null);
  const filterRowId = React.useId();
  const clear = () => {
    onClear?.();
    // "Clear" unmounts once nothing is applied; hand focus to the row's first control rather
    // than dropping it to <body>.
    filterRowRef.current
      ?.querySelector<HTMLElement>("button:not([disabled])")
      ?.focus();
  };

  // The Filters toggle: shows or hides the filter row, and opens it on its own the moment
  // anything is applied (a URL restore, a "Clear" undone), so a set filter is never hidden.
  const [filtersOpenState, setFiltersOpenState] = React.useState(
    defaultFiltersOpen ?? activeCount > 0,
  );
  const filtersOpen = filtersOpenProp ?? filtersOpenState;
  const setFiltersOpen = (next: boolean) => {
    if (filtersOpenProp === undefined) setFiltersOpenState(next);
    onFiltersOpenChange?.(next);
  };
  const hadActive = React.useRef(activeCount > 0);
  React.useEffect(() => {
    const active = activeCount > 0;
    if (active && !hadActive.current && !filtersOpen) {
      if (filtersOpenProp === undefined) setFiltersOpenState(true);
      onFiltersOpenChange?.(true);
    }
    hadActive.current = active;
  }, [activeCount, filtersOpen, filtersOpenProp, onFiltersOpenChange]);

  const searchField =
    search != null ? (
      <SearchInput
        {...searchInputProps}
        value={search.value}
        onValueChange={search.onValueChange}
        onValueCommitted={search.onValueCommitted}
        debounceMs={search.debounceMs}
        placeholder={search.placeholder ?? "Search…"}
        aria-label={search["aria-label"] ?? search.placeholder ?? "Search"}
        data-slot="filter-bar-search"
        className={cn(
          "h-8 w-full min-w-0 @3xl/filter-bar:w-80 @3xl/filter-bar:flex-none",
          searchInputProps?.className,
        )}
      />
    ) : null;

  const chips = filters.map((filter) => (
    <FilterChip
      key={filter.id}
      data-filter-id={filter.id}
      label={filter.label}
      value={filter.value}
      icon={filter.icon}
      active={filter.active}
      onRemove={filter.onRemove}
      editor={
        filter.editor ??
        addFilters?.find((option) => option.id === filter.id)?.editor
      }
      defaultEditorOpen={filter.id === editOnMount}
      onEditorOpenChange={
        onEditorOpenChange
          ? (open) => onEditorOpenChange(filter.id, open)
          : undefined
      }
    />
  ));

  // "More" — a custom menu wins, else the declarative one from `addFilters`.
  const moreMenu =
    addFilterMenu ??
    (hasDeclarativeMenu ? (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 font-normal text-muted-foreground"
              data-slot="filter-bar-add"
            >
              <CirclePlus aria-hidden />
              {addFilterLabel}
            </Button>
          }
        />
        <DropdownMenuContent align={addFilterMenuAlign}>
          {addFilters!.map((option) => (
            <DropdownMenuItem
              key={option.id}
              disabled={option.disabled}
              onClick={() => {
                if (option.editor != null) setEditOnMount(option.id);
                onAddFilter?.(option.id);
              }}
            >
              {option.icon}
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null);

  const hasFilters = facets != null || filters.length > 0 || moreMenu != null;
  // The row stays mounted while hidden, so each facet keeps reporting whether it is set.
  const showFilterRow = hasFilters || trailing != null;
  const filterRowVisible = (hasFilters && filtersOpen) || trailing != null;

  const filtersToggle = hasFilters ? (
    <Button
      variant="ghost"
      size="sm"
      data-slot="filter-bar-filters-toggle"
      aria-expanded={filtersOpen}
      aria-controls={filterRowId}
      aria-label={
        activeCount > 0 ? `${filtersLabel} (${activeCount})` : filtersLabel
      }
      data-state={filtersOpen ? "open" : "closed"}
      className="h-8 shrink-0 font-normal text-muted-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
      onClick={() => setFiltersOpen(!filtersOpen)}
    >
      <ListFilter aria-hidden />
      {/* The word hides on a narrow bar; the count stays. */}
      <span className="hidden @3xl/filter-bar:inline">{filtersLabel}</span>
      {activeCount > 0 ? (
        <span
          data-slot="filter-bar-filters-count"
          className="rounded-sm bg-foreground/10 px-1 text-xs text-foreground tabular-nums"
        >
          {activeCount}
        </span>
      ) : null}
    </Button>
  ) : null;

  const hasPrimaryRow =
    search != null ||
    scope != null ||
    view != null ||
    actions != null ||
    filtersToggle != null;

  return (
    <FilterBarContext.Provider value={context}>
      <div
        data-slot="filter-bar"
        role="toolbar"
        aria-label={
          ariaLabelledBy == null ? (ariaLabel ?? "List controls") : undefined
        }
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "@container/filter-bar flex w-full min-w-0 flex-col gap-3",
          BAR_SIZE,
          className,
        )}
        {...props}
      >
        {hasPrimaryRow ? (
          // [Search ~320px] … [Filters (n)] [scope/tabs] [actions] [view]. On a narrow bar the
          // search takes the full width and the controls wrap onto one row beneath it.
          <div
            data-slot="filter-bar-primary"
            className="flex w-full min-w-0 flex-wrap items-center gap-2 @3xl/filter-bar:flex-nowrap"
          >
            {searchField}
            <div
              data-slot="filter-bar-controls"
              className="flex min-w-0 flex-1 items-center gap-2 @3xl/filter-bar:flex-none @3xl/filter-bar:ms-auto"
            >
              {filtersToggle}
              {scope != null ? (
                <div
                  data-slot="filter-bar-scope"
                  // Clips and scrolls on a squeezed phone row rather than painting over the view.
                  className="flex min-w-0 shrink items-center overflow-x-auto scrollbar-none"
                >
                  {scope}
                </div>
              ) : null}
              {actions != null ? (
                <div
                  data-slot="filter-bar-actions"
                  className="flex shrink-0 items-center gap-2"
                >
                  {actions}
                </div>
              ) : null}
              {view != null ? (
                <div
                  data-slot="filter-bar-view"
                  className="ms-auto flex shrink-0 @max-3xl/filter-bar:[&_[data-slot=toggle-group-item]>span]:sr-only @max-3xl/filter-bar:[&_[data-slot=tabs-trigger]>span]:sr-only"
                >
                  {view}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {showFilterRow ? (
          <div
            ref={filterRowRef}
            id={filterRowId}
            data-slot="filter-bar-filters"
            role="group"
            aria-label={filtersLabel}
            // Wraps on a wide bar; on a narrow one it is one row that scrolls sideways by touch,
            // with the scrollbar hidden.
            className={cn(
              "flex w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain scrollbar-none @3xl/filter-bar:flex-wrap @3xl/filter-bar:overflow-visible",
              !filterRowVisible && "hidden",
            )}
          >
            {hasFilters ? (
              <div className={filtersOpen ? "contents" : "hidden"}>
                {facets}
                {chips}
                {moreMenu}
              </div>
            ) : null}
            {trailing != null || showClear ? (
              <div
                data-slot="filter-bar-trailing"
                className="ms-auto flex shrink-0 items-center gap-1.5"
              >
                {trailing}
                {showClear ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    data-slot="filter-bar-clear"
                    className="font-normal text-muted-foreground"
                    onClick={clear}
                  >
                    {clearLabel}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </FilterBarContext.Provider>
  );
}

/* ------------------------------------------------------------------------------------------------
 * FilterBarFacet
 * ----------------------------------------------------------------------------------------------*/

/** `FilterBarFacet`'s own props, on top of the `SearchableSelect` props it passes through. */
export interface FilterBarFacetOwnProps<Item> {
  /**
   * The facet's name, in sentence case ("Status", "Due date"). An unset facet reads just this;
   * a set one reads "{label}: {value}".
   */
  label: string;
  /**
   * Renders one option.
   * @default itemToStringLabel
   */
  renderItem?: (item: Item) => React.ReactNode;
  /**
   * A secondary facet added from "More": clearing it also calls `onRemove`, and while it is unset
   * a remove control sits beside it.
   * @default false
   */
  removable?: boolean;
  /**
   * Called when a `removable` facet is removed or cleared.
   * @default undefined
   */
  onRemove?: () => void;
  /**
   * Accessible name of the remove control beside an unset `removable` facet.
   * @default `Remove ${label} filter`
   */
  removeLabel?: string;
  /**
   * List the selected options first, under "Selected", above the rest under "More".
   * @default false
   */
  pinSelected?: boolean;
  /**
   * The heading of the pinned group.
   * @default "Selected"
   */
  selectedGroupLabel?: string;
  /**
   * The heading of the group under the pinned one.
   * @default "More"
   */
  moreGroupLabel?: string;
  /**
   * @deprecated An unset facet reads just its label. Accepted and ignored.
   * @default undefined
   */
  anyLabel?: string;
}

/** Props accepted by `FilterBarFacet`: `SearchableSelect`'s, minus the trigger face it owns. */
export type FilterBarFacetProps<
  Item,
  Multiple extends boolean | undefined = false,
> = Omit<
  SearchableSelectProps<Item, Multiple>,
  | "renderItem"
  | "renderValue"
  | "renderTriggerValue"
  | "placeholder"
  | "variant"
  | "size"
  | "aria-label"
  | "groupBy"
  | "groupOrder"
> &
  FilterBarFacetOwnProps<Item>;

/**
 * `FilterBarFacet` — one filter on `SearchableSelect`, as a compact rounded-md chip (h-7). Unset,
 * it is quiet and reads its label ("Status ▾"). Set, the same chip is tinted: "Status: Open", then
 * "Status: 2" from two values (the values on hover and ticked in the popover), with a × in the
 * chevron's fixed slot that clears it ("Clear Status"). Single or `multiple`, local or
 * server-searched (`remote` + `useAsyncSearch`; the tick matches by `itemToKey`), optionally pinned
 * and removable. For people, pass `itemToSecondaryLabel={(p) => p.email}`: each option reads the
 * name plus a smaller muted email, and search matches both. Put it in a
 * `FilterBar`'s `facets` slot.
 *
 * @example
 * <FilterBarFacet
 *   label="Status"
 *   multiple
 *   items={statuses}
 *   value={status}
 *   onValueChange={setStatus}
 *   itemToKey={(s) => s.id}
 *   itemToStringLabel={(s) => s.name}
 *   searchLabel="Search statuses"
 * />
 */
export function FilterBarFacet<
  Item,
  Multiple extends boolean | undefined = false,
>({
  label,
  renderItem,
  removable = false,
  onRemove,
  removeLabel = `Remove ${label} filter`,
  pinSelected = false,
  selectedGroupLabel = "Selected",
  moreGroupLabel = "More",
  anyLabel: _anyLabel,
  countLabel,
  clearable: _clearable,
  clearLabel = `Clear ${label}`,
  searchPlaceholder = `Search ${label.toLowerCase()}`,
  searchLabel = `Search ${label.toLowerCase()}`,
  emptyMessage = "No matches",
  ref,
  ...select
}: FilterBarFacetProps<Item, Multiple>) {
  const { itemToStringLabel, itemToKey, onOpenChange, onValueChange } = select;
  const current = select.value as Item | Item[] | null | undefined;
  const selectedKeys = new Set(
    (Array.isArray(current) ? current : current ? [current] : []).map(
      itemToKey,
    ),
  );
  const hasValue = selectedKeys.size > 0;

  const bar = React.useContext(FilterBarContext);
  const id = React.useId();
  React.useEffect(() => {
    bar?.report(id, label, hasValue);
  }, [bar, id, label, hasValue]);
  React.useEffect(() => () => bar?.report(id, label, null), [bar, id, label]);

  const [trigger, setTrigger] = React.useState<HTMLButtonElement | null>(null);
  const triggerRef = React.useMemo(() => mergeRefs(setTrigger, ref), [ref]);

  // The pinned split is taken when the list opens, so toggling a row does not move it between
  // "Selected" and "More" under the pointer; the next open re-pins.
  const [pinnedKeys, setPinnedKeys] = React.useState(selectedKeys);
  const pinned = (item: Item) => pinnedKeys.has(itemToKey(item));
  // One value reads "Status: Open"; several read "Status: 2", with the values on hover (the
  // chip's `title`) and ticked in the popover.
  const text = (list: Item[]) =>
    list.length === 0
      ? label
      : list.length > 1
        ? `${label}: ${countLabel ? countLabel(list.length) : list.length}`
        : `${label}: ${itemToStringLabel(list[0]!)}`;
  const selectedList = Array.isArray(current)
    ? current
    : current
      ? [current]
      : [];

  const clear = () => {
    // The × unmounts with the value; hand focus to the trigger first (DS-22).
    trigger?.focus();
    onValueChange?.(
      (select.multiple ? [] : null) as Parameters<
        NonNullable<typeof onValueChange>
      >[0],
    );
    if (removable) onRemove?.();
  };

  return (
    <span
      data-slot="filter-bar-facet"
      data-state={hasValue ? "set" : "unset"}
      title={
        selectedList.length > 1
          ? selectedList.map(itemToStringLabel).join(", ")
          : undefined
      }
      className="inline-flex min-w-0 shrink-0 items-center gap-0.5"
    >
      <span className="relative inline-flex min-w-0">
        <SearchableSelect<Item, Multiple>
          {...select}
          ref={triggerRef}
          onOpenChange={(open) => {
            if (open) setPinnedKeys(selectedKeys);
            onOpenChange?.(open);
          }}
          items={
            pinSelected
              ? [
                  ...select.items.filter(pinned),
                  ...select.items.filter((i) => !pinned(i)),
                ]
              : select.items
          }
          variant="ghost"
          // The filter row's compact chip tier (h-7).
          size="sm"
          countLabel={countLabel}
          placeholder={label}
          searchPlaceholder={searchPlaceholder}
          searchLabel={searchLabel}
          emptyMessage={emptyMessage}
          renderItem={renderItem ?? itemToStringLabel}
          renderTriggerValue={text}
          groupBy={
            pinSelected
              ? (item: Item) =>
                  pinned(item) ? selectedGroupLabel : moreGroupLabel
              : undefined
          }
          // A leading item outside the selection must not put "More" above "Selected".
          groupOrder={pinSelected ? [selectedGroupLabel] : undefined}
          // The select's own chevron gives way to the facet's ▾ or ×.
          containerClassName="w-fit [&>svg]:hidden"
          // ONE chip shape for unset and set (rounded-md, h-7, the same border box and the
          // same 28px trailing reserve); a set chip is tinted, never reshaped.
          className={cn(
            "h-7 w-auto max-w-64 rounded-md border-border ps-2 pe-7 text-sm font-normal hover:border-border focus:border-border aria-expanded:border-border",
            hasValue
              ? "bg-accent text-foreground hover:bg-accent/80 aria-expanded:bg-accent dark:bg-accent dark:hover:bg-accent/80"
              : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-transparent dark:hover:bg-muted",
          )}
          contentClassName="min-w-56"
          data-slot="filter-bar-facet-select"
        />
        {hasValue ? (
          // The × holds the chevron's exact box (24px, `end-0.5`), so nothing shifts when a
          // value is set; its 24px box is the whole hit area.
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={clearLabel}
            data-slot="filter-bar-facet-clear"
            className="absolute inset-y-0 end-0.5 my-auto size-6 rounded-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground active:not-aria-[haspopup]:translate-y-0"
            onClick={clear}
          >
            <X aria-hidden className="size-3.5" />
          </Button>
        ) : (
          <span
            aria-hidden
            className="pointer-events-none absolute end-0.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground"
          >
            <ChevronDown className="size-3.5" />
          </span>
        )}
      </span>
      {removable && !hasValue ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={removeLabel}
          data-slot="filter-bar-facet-remove"
          className="active:not-aria-[haspopup]:translate-y-0"
          onClick={onRemove}
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------
 * DateRangeFilter
 * ----------------------------------------------------------------------------------------------*/

/** The built-in presets of a {@link DateRangeFilter}, plus `"custom"` (the calendar). */
export type DateRangeFilterPreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

/** A {@link DateRangeFilter} value: whole days, `from` and `to` inclusive. */
export interface DateRangeFilterValue {
  /** The first day (local midnight). */
  from: Date;
  /** The last day, inclusive (local midnight). */
  to: Date;
  /**
   * The preset it came from; the chip reads the preset's name ("Last 7 days") while it is set,
   * and the dates ("Sep 1–25") for `"custom"` or when omitted.
   * @default undefined
   */
  preset?: DateRangeFilterPreset;
}

/** Props accepted by `DateRangeFilter`. */
export interface DateRangeFilterProps {
  /** The filter's name, in sentence case ("Due date", "Created"). */
  label: string;
  /** The applied range, or `null` when unset (controlled). */
  value: DateRangeFilterValue | null;
  /** Called with the new range, or `null` when cleared. */
  onValueChange: (value: DateRangeFilterValue | null) => void;
  /**
   * Which presets to offer, in order. `"custom"` opens the calendar.
   * @default ["today", "yesterday", "last7", "last30", "thisMonth", "lastMonth", "custom"]
   */
  presets?: DateRangeFilterPreset[];
  /**
   * Relabel presets — for another language.
   * @default English ("Today", "Yesterday", "Last 7 days", …, "Custom range")
   */
  presetLabels?: Partial<Record<DateRangeFilterPreset, string>>;
  /**
   * "Today", for the presets and the label's year rule.
   * @default new Date()
   */
  now?: Date;
  /**
   * The zone the range label's days are written in (the date-time helpers' `timeZone`).
   * @default the runtime's zone
   */
  timeZone?: string;
  /**
   * The locale of the range label.
   * @default "en-US"
   */
  locale?: string;
  /**
   * Accessible name of the clear control.
   * @default `Clear ${label}`
   */
  clearLabel?: string;
  /**
   * Disable the filter.
   * @default false
   */
  disabled?: boolean;
}

const DATE_RANGE_PRESET_LABELS: Record<DateRangeFilterPreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
  last30: "Last 30 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  custom: "Custom range",
};

const DEFAULT_DATE_RANGE_PRESETS: DateRangeFilterPreset[] = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "thisMonth",
  "lastMonth",
  "custom",
];

/**
 * The `{ from, to }` a preset covers on the day `now` falls on — whole local days, inclusive.
 *
 * @example
 * dateRangeForPreset("last7") // the last 7 days, today included
 */
export function dateRangeForPreset(
  preset: Exclude<DateRangeFilterPreset, "custom">,
  now: Date = new Date(),
): DateRangeFilterValue {
  const day = (offset: number, base = now) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "today":
      return { from: day(0), to: day(0), preset };
    case "yesterday":
      return { from: day(-1), to: day(-1), preset };
    case "last7":
      return { from: day(-6), to: day(0), preset };
    case "last30":
      return { from: day(-29), to: day(0), preset };
    case "thisMonth":
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0), preset };
    case "lastMonth":
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0), preset };
  }
}

/**
 * `DateRangeFilter` — a date-range chip for a `FilterBar`, in the same compact rounded-md shape as
 * `FilterBarFacet`. Unset it reads its label ("Due date ▾"); set it is tinted and reads the preset
 * ("Due date: Last 7 days") or the dates ("Due date: Sep 1–25", from the date-time helpers), with
 * a × in the chevron's fixed slot. Its popover lists Today · Yesterday · Last 7 days · Last 30
 * days · This month · Last month · Custom range, the last opening a two-month calendar.
 *
 * @example
 * <DateRangeFilter label="Created" value={created} onValueChange={setCreated} />
 */
export function DateRangeFilter({
  label,
  value,
  onValueChange,
  presets = DEFAULT_DATE_RANGE_PRESETS,
  presetLabels,
  now,
  timeZone,
  locale,
  clearLabel = `Clear ${label}`,
  disabled = false,
}: DateRangeFilterProps) {
  const labels = { ...DATE_RANGE_PRESET_LABELS, ...presetLabels };
  const hasValue = value != null;
  const bar = React.useContext(FilterBarContext);
  const id = React.useId();
  React.useEffect(() => {
    bar?.report(id, label, hasValue);
  }, [bar, id, label, hasValue]);
  React.useEffect(() => () => bar?.report(id, label, null), [bar, id, label]);

  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState(false);
  const [draft, setDraft] = React.useState<
    { from: Date | undefined; to?: Date } | undefined
  >(undefined);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const valueText = !value
    ? null
    : value.preset && value.preset !== "custom"
      ? labels[value.preset]
      : formatDateRange(value.from, value.to, {
          withTime: false,
          timeZone,
          locale,
          now,
        });

  const openChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setCustom(value?.preset === "custom" || (value != null && !value.preset));
      setDraft(value ? { from: value.from, to: value.to } : undefined);
    }
  };

  return (
    <span
      data-slot="date-range-filter"
      data-state={hasValue ? "set" : "unset"}
      className="relative inline-flex min-w-0 shrink-0"
    >
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger
          render={
            <Button
              ref={triggerRef}
              variant="ghost"
              size="sm"
              disabled={disabled}
              data-slot="date-range-filter-trigger"
              className={cn(
                "h-7 max-w-64 justify-start rounded-md border border-border ps-2 pe-7 text-sm font-normal",
                hasValue
                  ? "bg-accent text-foreground hover:bg-accent/80 aria-expanded:bg-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
              )}
            />
          }
        >
          <span className="min-w-0 truncate">
            {valueText ? `${label}: ${valueText}` : label}
          </span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          data-slot="date-range-filter-content"
          className="w-auto gap-0 p-0"
        >
          {custom ? (
            <div className="flex flex-col">
              <Calendar
                mode="range"
                numberOfMonths={2}
                className="bg-transparent"
                selected={draft}
                onSelect={setDraft}
                defaultMonth={draft?.from ?? now}
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5 border-t border-border p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustom(false)}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  disabled={!draft?.from}
                  onClick={() => {
                    if (!draft?.from) return;
                    onValueChange({
                      from: draft.from,
                      to: draft.to ?? draft.from,
                      preset: "custom",
                    });
                    setOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          ) : (
            <div
              role="group"
              aria-label={label}
              data-slot="date-range-filter-presets"
              className="flex min-w-44 flex-col p-1"
            >
              {presets.map((preset) => (
                <Button
                  key={preset}
                  variant="ghost"
                  size="sm"
                  aria-pressed={value?.preset === preset}
                  className="justify-start font-normal aria-pressed:bg-accent"
                  onClick={() => {
                    if (preset === "custom") {
                      setCustom(true);
                      return;
                    }
                    onValueChange(dateRangeForPreset(preset, now));
                    setOpen(false);
                  }}
                >
                  {labels[preset]}
                </Button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {hasValue ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={clearLabel}
          disabled={disabled}
          data-slot="date-range-filter-clear"
          className="absolute inset-y-0 end-0.5 my-auto size-6 rounded-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground active:not-aria-[haspopup]:translate-y-0"
          onClick={() => {
            triggerRef.current?.focus();
            onValueChange(null);
          }}
        >
          <X aria-hidden className="size-3.5" />
        </Button>
      ) : (
        <span
          aria-hidden
          className="pointer-events-none absolute end-0.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground"
        >
          <ChevronDown className="size-3.5" />
        </span>
      )}
    </span>
  );
}

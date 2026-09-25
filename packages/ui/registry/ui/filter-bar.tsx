// @vegastack filter-bar@0.23.8 sha256-zzLnTMM2gudQHiwJyqkw9wQdLaMUd95ArgagWQZjk5s=

"use client";

import * as React from "react";
import { ChevronDown, CirclePlus, ListFilter, X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
   * Whose rows the list shows, beside the search — a segmented `ToggleGroup` such as
   * "My tasks | Created by me | Team". Takes its own full-width row on a narrow bar.
   * @default undefined
   */
  scope?: React.ReactNode;
  /**
   * How the rows are laid out, pinned to the end of the first row — a segmented `ToggleGroup`
   * such as "List | Board". On a narrow bar only the icons show: wrap each option's text in a
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
   * The primary {@link FilterBarFacet}s ("Status", "Due", "Assignee"), always visible on the
   * second row. An unset facet is a quiet trigger that reads its label; a set facet is a filled
   * pill with a clear control.
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
   * How many filters are applied. Drives "Clear" and the narrow bar's "Filters (n)". Defaults to
   * the facets holding a value plus the `filters` chips.
   * @default undefined
   */
  activeCount?: number;
  /**
   * The filter row's accessible name, and the label of the narrow bar's filters button and sheet.
   * @default 'Filters'
   */
  filtersLabel?: string;
  /**
   * The button that closes the narrow bar's filters sheet.
   * @default 'Done'
   */
  doneLabel?: string;
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
 * primitive at the standalone (`md`, 32px) tier, so it lines up with the Buttons and
 * Inputs beside it in the bar. An applied filter is a selection, so it carries the
 * selected fill by default; pass `active={false}` for a plain presence chip.
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
      size="md"
      active={active}
      onRemove={onRemove}
      removeLabel={computedRemoveLabel}
      className={cn("max-w-xs", className)}
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
 * One height tier for the whole bar: every control is h-8, the default size. A `ToggleGroup` or
 * `Select` passed in at `size="sm"` is lifted to h-8 so the rows stay level.
 */
const BAR_SIZE =
  "[&_[data-slot=toggle-group-item][data-size=sm]]:h-8 [&_[data-slot=toggle-group-item][data-size=sm]]:min-w-8 [&_[data-slot=toggle-group-item][data-size=sm]]:text-sm [&_[data-slot=select-trigger][data-size=sm]]:h-8";

/**
 * `FilterBar` — the toolbar above a list or table, in two rows.
 *
 * Row 1: the search field (first, taking the free space), an optional `scope` segmented control,
 * an optional `view` segmented control pinned to the end, and optional `actions`.
 * Row 2 (only when there are filters to show): the primary `facets`, any applied `filters` chips,
 * a "More" menu of secondary filters, and "Clear" at the end while anything is applied.
 *
 * On a narrow bar (below its own `@3xl` container width) the scope takes its own full-width row,
 * the view shows icons only, and the filter row folds into one "Filters (n)" button that opens a
 * bottom sheet with the facets stacked, "Clear" and "Done".
 *
 * Purely presentational: the host owns every value.
 *
 * @example
 * <FilterBar
 *   search={{ value: query, onValueChange: setQuery, placeholder: "Search tasks" }}
 *   scope={<ToggleGroup aria-label="Scope" value={[scope]} onValueChange={([v]) => v && setScope(v)} deselectable={false} variant="outline" spacing={0}>…</ToggleGroup>}
 *   view={<ToggleGroup aria-label="View" value={[view]} onValueChange={([v]) => v && setView(v)} deselectable={false} variant="outline" spacing={0}>…</ToggleGroup>}
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
  doneLabel = "Done",
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
  const clear = () => {
    onClear?.();
    // "Clear" unmounts once nothing is applied; hand focus to the row's first control rather
    // than dropping it to <body>.
    filterRowRef.current
      ?.querySelector<HTMLElement>("button:not([disabled])")
      ?.focus();
  };

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
          "h-8 w-auto min-w-0 flex-1 basis-40 @3xl/filter-bar:max-w-sm",
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
              className="text-muted-foreground"
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
  const hasPrimaryRow =
    search != null || scope != null || view != null || actions != null;

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
          "@container/filter-bar flex w-full min-w-0 flex-col gap-1.5",
          BAR_SIZE,
          className,
        )}
        {...props}
      >
        {hasPrimaryRow ? (
          <div
            data-slot="filter-bar-primary"
            className="flex w-full min-w-0 items-center gap-1.5"
          >
            {searchField}
            {scope != null ? (
              <div
                data-slot="filter-bar-scope"
                className="hidden shrink-0 @3xl/filter-bar:flex"
              >
                {scope}
              </div>
            ) : null}
            {view != null ? (
              <div
                data-slot="filter-bar-view"
                className="ms-auto flex shrink-0 @max-3xl/filter-bar:[&_[data-slot=toggle-group-item]>span]:sr-only"
              >
                {view}
              </div>
            ) : null}
            {actions != null ? (
              <div
                data-slot="filter-bar-actions"
                className={cn(
                  "flex shrink-0 items-center gap-1.5",
                  view == null && "ms-auto",
                )}
              >
                {actions}
              </div>
            ) : null}
          </div>
        ) : null}

        {scope != null ? (
          // The narrow bar's scope row: the same control, full width, segments sharing the row.
          <div
            data-slot="filter-bar-scope-row"
            className="flex w-full @3xl/filter-bar:hidden [&_[data-slot=toggle-group-item]]:flex-1 [&_[data-slot=toggle-group]]:w-full"
          >
            {scope}
          </div>
        ) : null}

        {hasFilters || trailing != null ? (
          <div
            ref={filterRowRef}
            data-slot="filter-bar-filters"
            role="group"
            aria-label={filtersLabel}
            className="flex w-full min-w-0 flex-wrap items-center gap-1.5"
          >
            {hasFilters ? (
              <>
                <div className="hidden @3xl/filter-bar:contents">
                  {facets}
                  {chips}
                  {moreMenu}
                </div>
                <Sheet>
                  <SheetTrigger
                    render={
                      <Button
                        variant="outline"
                        data-slot="filter-bar-sheet-trigger"
                        className="@3xl/filter-bar:hidden"
                      >
                        <ListFilter aria-hidden />
                        {activeCount > 0
                          ? `${filtersLabel} (${activeCount})`
                          : filtersLabel}
                      </Button>
                    }
                  />
                  <SheetContent
                    side="bottom"
                    data-slot="filter-bar-sheet"
                    className="max-h-[85dvh]"
                  >
                    <SheetHeader>
                      <SheetTitle>{filtersLabel}</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                      <div className="flex flex-col items-start gap-1.5">
                        {facets}
                        {chips}
                        {moreMenu}
                      </div>
                    </SheetBody>
                    <SheetFooter className="flex-row justify-end">
                      {showClear ? (
                        <Button variant="ghost" onClick={onClear}>
                          {clearLabel}
                        </Button>
                      ) : null}
                      <SheetClose render={<Button />}>{doneLabel}</SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </>
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
                    data-slot="filter-bar-clear"
                    className="hidden @3xl/filter-bar:inline-flex"
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
 * `FilterBarFacet` — one filter on `SearchableSelect`. Unset, it is a quiet borderless trigger that
 * reads its label ("Status ▾"). Set, it becomes a filled pill: "Status: Open", "Status: Open, In
 * progress", then "Status (3)" from three values, with a × that clears it ("Clear Status"). Single
 * or `multiple`, local or server-searched (`remote` + `useAsyncSearch`), optionally pinned and
 * removable. Put it in a `FilterBar`'s `facets` slot; it takes the bar's h-8 height.
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
  const text = (list: Item[]) =>
    list.length === 0
      ? label
      : list.length > 2
        ? countLabel
          ? `${label}: ${countLabel(list.length)}`
          : `${label} (${list.length})`
        : `${label}: ${list.map(itemToStringLabel).join(", ")}`;

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
      className="inline-flex min-w-0 items-center gap-0.5"
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
          // The FilterBar's one height tier: every control in both rows is h-8.
          size="default"
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
          className={cn(
            "w-auto max-w-64",
            hasValue
              ? "rounded-full border-border bg-accent ps-2.5 pe-8 font-medium text-foreground hover:border-border hover:bg-accent aria-expanded:border-border dark:bg-accent dark:hover:bg-accent"
              : "ps-2.5 pe-7 text-muted-foreground hover:border-transparent hover:bg-muted hover:text-foreground aria-expanded:border-transparent aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted",
          )}
          contentClassName="min-w-56"
          data-slot="filter-bar-facet-select"
        />
        {hasValue ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={clearLabel}
            data-slot="filter-bar-facet-clear"
            className="absolute end-1 top-1/2 -translate-y-1/2 rounded-full"
            onClick={clear}
          >
            <X aria-hidden />
          </Button>
        ) : (
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute end-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        )}
      </span>
      {removable && !hasValue ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={removeLabel}
          data-slot="filter-bar-facet-remove"
          onClick={onRemove}
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </span>
  );
}

// @vegastack filter-bar@0.20.0 sha256-ufwrF6BkHgl3J5LOU59Y2ut5wjg7jbYP7sU4i2u1ldY=

"use client";

import * as React from "react";
import { ListFilterPlus, X } from "lucide-react";
import { cn } from "@vegastack/design";
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
   * The filter's name (e.g. `"Status"`). Rendered as the muted leading text of
   * the chip.
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
 * An entry in the declarative "Add filter" menu. Provide these via
 * {@link FilterBarProps.addFilters} as a shorthand for building the menu
 * yourself — or pass `addFilterMenu` for full control.
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
   * Where the search field sits: `"end"` pushes it to the trailing edge after
   * the chips; `"start"` puts it first, for lists where search is the primary
   * filter (the trailing slot then takes the end push).
   * @default "end"
   */
  searchPlacement?: "start" | "end";
  /**
   * Called when a chip's editor opens or closes, with the filter's id.
   * @default undefined
   */
  onEditorOpenChange?: (id: string, open: boolean) => void;
  /**
   * The active filters, rendered as removable chips at the start of the bar.
   * @default []
   */
  filters?: FilterBarFilter[];
  /**
   * Declarative "Add filter" menu options. The bar builds a {@link DropdownMenu}
   * from these and calls {@link FilterBarProps.onAddFilter} with the chosen
   * option's `id`. Ignored when `addFilterMenu` is provided.

   * @default undefined
   */
  addFilters?: FilterBarAddOption[];
  /**
   * Invoked with the chosen option's `id` when an item from the declarative
   * `addFilters` menu is selected.

   * @default undefined
   */
  onAddFilter?: (id: string) => void;
  /**
   * Fully custom "Add filter" menu content (e.g. a {@link DropdownMenu} with
   * submenus / checkbox items). Takes precedence over `addFilters` — supply the
   * whole {@link DropdownMenu} tree, including its trigger. When omitted and
   * `addFilters` is empty, no "Add filter" control is rendered.

   * @default undefined
   */
  addFilterMenu?: React.ReactNode;
  /**
   * Accessible name for the built-in "Add filter" trigger (icon + text button).
   * @default 'Add filter'
   */
  addFilterLabel?: string;
  /** Alignment of the built-in "Add filter" menu relative to its trigger. @default 'start' */
  addFilterMenuAlign?: React.ComponentProps<
    typeof DropdownMenuContent
  >["align"];
  /**
   * Controlled search/query input config. Omit to hide the search field.
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
   * Content rendered at the trailing (right) end of the bar — e.g. a
   * "Save view" or "Clear all" {@link Button}.

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
   * Accessible name for the remove control. Defaults to `Remove <label> filter`
   * when `label` is a string.

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
  ...props
}: FilterChipProps) {
  const computedRemoveLabel =
    removeLabel ??
    (typeof label === "string" ? `Remove ${label} filter` : "Remove filter");

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
        <Popover onOpenChange={(open) => onEditorOpenChange?.(open)}>
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
 * `FilterBar` — a horizontal row of active filter {@link FilterChip}s (each
 * removable), an "Add filter" {@link DropdownMenu}, and an optional controlled
 * search {@link Input}. Composes the VegaStack {@link Button}, {@link DropdownMenu},
 * and {@link Input}.
 *
 * Purely presentational: the host owns all filter state. The bar renders one chip
 * per `filters` entry and calls each filter's `onRemove` on dismiss; the "Add
 * filter" menu is either declarative (`addFilters` + `onAddFilter`) or fully
 * custom (`addFilterMenu`); `search` is a controlled value/onChange pair.
 *
 * @example
 * <FilterBar
 *   filters={[{ id: 'status', label: 'Status', value: 'In Progress', onRemove: removeStatus }]}
 *   addFilters={[{ id: 'priority', label: 'Priority', icon: <Flag /> }]}
 *   onAddFilter={(id) => openFilter(id)}
 *   search={{ value: query, onValueChange: setQuery }}
 *   trailing={<Button variant="ghost" onClick={clearAll}>Clear all</Button>}
 * />
 */
export function FilterBar({
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  filters = [],
  addFilters,
  onAddFilter,
  addFilterMenu,
  addFilterLabel = "Add filter",
  addFilterMenuAlign = "start",
  search,
  searchInputProps,
  searchPlacement = "end",
  onEditorOpenChange,
  trailing,
  ...props
}: FilterBarProps) {
  const hasDeclarativeMenu =
    addFilterMenu == null && addFilters != null && addFilters.length > 0;

  // Optional controlled search/query input — first, or pushed to the trailing edge.
  const searchStart = searchPlacement === "start";
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
          "h-8 w-auto min-w-0 basis-48",
          !searchStart && "ms-auto",
          searchInputProps?.className,
        )}
      />
    ) : null;

  return (
    <div
      data-slot="filter-bar"
      role="group"
      aria-label={ariaLabelledBy == null ? (ariaLabel ?? "Filters") : undefined}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center gap-1.5",
        className,
      )}
      {...props}
    >
      {searchStart ? searchField : null}

      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          data-filter-id={filter.id}
          label={filter.label}
          value={filter.value}
          icon={filter.icon}
          active={filter.active}
          onRemove={filter.onRemove}
          editor={filter.editor}
          onEditorOpenChange={
            onEditorOpenChange
              ? (open) => onEditorOpenChange(filter.id, open)
              : undefined
          }
        />
      ))}

      {/* Add filter — custom menu wins, else declarative menu from `addFilters`. */}
      {addFilterMenu ??
        (hasDeclarativeMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className="border-dashed text-muted-foreground"
                  data-slot="filter-bar-add"
                >
                  <ListFilterPlus aria-hidden />
                  {addFilterLabel}
                </Button>
              }
            />
            <DropdownMenuContent align={addFilterMenuAlign}>
              {addFilters!.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  disabled={option.disabled}
                  onClick={() => onAddFilter?.(option.id)}
                >
                  {option.icon}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null)}

      {searchStart ? null : searchField}

      {trailing != null ? (
        <div
          data-slot="filter-bar-trailing"
          className={cn(
            "shrink-0",
            (search == null || searchStart) && "ms-auto",
          )}
        >
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * FilterBarFacet
 * ----------------------------------------------------------------------------------------------*/

/** `FilterBarFacet`'s own props, on top of the `SearchableSelect` props it passes through. */
export interface FilterBarFacetOwnProps<Item> {
  /** The facet's name — the trigger reads "{label}: {value}". */
  label: string;
  /**
   * Renders one option.
   * @default itemToStringLabel
   */
  renderItem?: (item: Item) => React.ReactNode;
  /**
   * Show a remove control beside the facet (a facet added from "Add filter").
   * @default false
   */
  removable?: boolean;
  /**
   * Called when the remove control is used.
   * @default undefined
   */
  onRemove?: () => void;
  /**
   * Accessible name of the remove control.
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
   * What an empty facet reads.
   * @default "Any"
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
> &
  FilterBarFacetOwnProps<Item>;

/**
 * `FilterBarFacet` — a "Label: value" facet on `SearchableSelect`: "Status: Any", "Status:
 * Open", "Status: Open, In progress", "Status: 3 selected". Single or `multiple`, local or
 * server-searched (`remote` + `useAsyncSearch`), optionally pinned and removable. Put it in a
 * `FilterBar`'s `trailing` slot or anywhere in a toolbar; it takes the bar's height.
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
  anyLabel = "Any",
  countLabel = (n) => `${n} selected`,
  ...select
}: FilterBarFacetProps<Item, Multiple>) {
  const { itemToStringLabel, itemToKey, onOpenChange } = select;
  const current = select.value as Item | Item[] | null | undefined;
  const selectedKeys = new Set(
    (Array.isArray(current) ? current : current ? [current] : []).map(
      itemToKey,
    ),
  );
  // The pinned split is taken when the list opens, so toggling a row does not move it between
  // "Selected" and "More" under the pointer; the next open re-pins.
  const [pinnedKeys, setPinnedKeys] = React.useState(selectedKeys);
  const pinned = (item: Item) => pinnedKeys.has(itemToKey(item));
  const text = (list: Item[]) =>
    `${label}: ${
      list.length === 0
        ? anyLabel
        : list.length > 2
          ? countLabel(list.length)
          : list.map(itemToStringLabel).join(", ")
    }`;
  return (
    <span
      data-slot="filter-bar-facet"
      className="inline-flex min-w-0 items-center gap-0.5"
    >
      <SearchableSelect<Item, Multiple>
        {...select}
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
        variant="outline"
        // The FilterBar row's one height tier: the search, the chips and "Add filter" are h-8.
        size="default"
        countLabel={countLabel}
        placeholder={`${label}: ${anyLabel}`}
        renderItem={renderItem ?? itemToStringLabel}
        renderTriggerValue={text}
        groupBy={
          pinSelected
            ? (item: Item) =>
                pinned(item) ? selectedGroupLabel : moreGroupLabel
            : undefined
        }
        containerClassName="w-fit"
        className="w-auto max-w-64"
        contentClassName="min-w-56"
        data-slot="filter-bar-facet-select"
      />
      {removable ? (
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

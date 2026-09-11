// @vegastack filter-bar@0.7.4 sha256-Jzdq4ulWh6Fi58aEKjpXPGyp50G9/GzafEL6n97zQ7I=

"use client";

import * as React from "react";
import { ListFilterPlus } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  type DropdownMenuContentProps,
} from "@/components/ui/dropdown-menu";
import { Input, type InputProps } from "@/components/ui/input";

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
   * Whether the chip reads as an active selection (the `surface-2` selection
   * rung). An applied filter is a selection, so this defaults to `true`; set
   * `false` for a presence-only chip on the rest fill.
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
  "onChange"
> {
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
  addFilterMenuAlign?: DropdownMenuContentProps["align"];
  /**
   * Controlled search/query input config. Omit to hide the search field.
   * @default undefined
   */
  search?: FilterBarSearch;
  /** Props forwarded to the underlying search {@link Input}.
   * @default undefined
   */
  searchInputProps?: Omit<InputProps, "value" | "onChange" | "placeholder">;
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
   * Whether the chip reads as an active selection. An active chip takes the
   * selection rung (`surface-2`); an inactive chip keeps a filled control's rest
   * fill (`surface-1`).
   * @default true
   */
  active?: boolean;
}

/**
 * `FilterChip` — a single removable filter pill: a `label`, an optional `value`
 * after a colon, and a trailing `×` control that fires `onRemove`. The {@link Chip}
 * primitive at the standalone (`md`, 32px) tier, so it lines up with the Buttons and
 * Inputs beside it in the bar. An applied filter is a selection, so it carries the
 * selection rung by default; pass `active={false}` for a plain presence chip.
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
          carried by the chip's surface rung, not by flattening the text tiers. */}
      {icon != null ? (
        <span className="shrink-0 text-muted-foreground">{icon}</span>
      ) : null}
      <span className="shrink-0 text-muted-foreground">{label}</span>
      {value != null ? <span className="min-w-0 truncate">{value}</span> : null}
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
 *   trailing={<Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>}
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
  trailing,
  ...props
}: FilterBarProps) {
  const hasDeclarativeMenu =
    addFilterMenu == null && addFilters != null && addFilters.length > 0;

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
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          data-filter-id={filter.id}
          label={filter.label}
          value={filter.value}
          icon={filter.icon}
          active={filter.active}
          onRemove={filter.onRemove}
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

      {/* Optional controlled search/query input — pushed to the trailing edge. */}
      {search != null ? (
        <Input
          {...searchInputProps}
          type="search"
          value={search.value}
          onChange={(event) => search.onValueChange(event.target.value)}
          placeholder={search.placeholder ?? "Search…"}
          aria-label={search["aria-label"] ?? search.placeholder ?? "Search"}
          data-slot="filter-bar-search"
          className={cn(
            "ml-auto h-(--size-md) w-auto min-w-0 basis-48",
            searchInputProps?.className,
          )}
        />
      ) : null}

      {trailing != null ? (
        <div
          data-slot="filter-bar-trailing"
          className={cn("shrink-0", search == null && "ml-auto")}
        >
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

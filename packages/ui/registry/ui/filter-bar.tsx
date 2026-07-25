// @vegastack filter-bar@0.3.0 sha256-kfxADW1ewkXF1WJL5LaqPIzNdkbDNy0kdhuw51YYPZM=

"use client";

import * as React from "react";
import { ListFilterPlus, X } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
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
   * Whether the chip reads as an active selection (neutral `accent` tint). An
   * applied filter is a selection, so this defaults to `true`; set `false` for a
   * neutral presence-only chip.
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

   * @default = null && "ml-auto")
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
 * FilterChip — a removable Badge-like pill (label[: value] + × button)
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `FilterChip`. */
export interface FilterChipProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "onRemove"
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
   * neutral selection tint (`bg-accent` + `text-foreground`); an inactive chip
   * stays a plain surface.
   * @default true
   */
  active?: boolean;
}

/**
 * `FilterChip` — a single removable filter pill: a `label`, an optional `value`
 * after a colon, and a trailing `×` button that fires `onRemove`. An applied
 * filter is a selection, so it carries the neutral `accent` tint by default; pass
 * `active={false}` for a plain presence chip. Control-scale (`h-(--size-md) rounded-md`),
 * token-only styling. Purely presentational; the {@link FilterBar} renders one
 * per active filter.
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
    <div
      data-slot="filter-chip"
      data-active={active ? "" : undefined}
      className={cn(
        // 14px (`text-base`) — every 32px (h-(--size-md)) control shares the md type tier (register P2-19).
        "inline-flex h-(--size-md) max-w-xs shrink-0 items-center gap-1 rounded-md border pr-1 pl-2.5 text-base",
        // Active = a true selection → neutral accent tint; otherwise a plain surface.
        active
          ? "border-border bg-accent text-foreground"
          : "border-border bg-background text-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-compact)",
        className,
      )}
      {...props}
    >
      {/* The icon + label stay muted in BOTH states so the label/value hierarchy
          (muted key, emphasized value) survives activation — the active state is
          carried by the chip's accent surface, not by flattening the text tiers. */}
      {icon != null ? (
        <span className="shrink-0 text-muted-foreground">{icon}</span>
      ) : null}
      <span className="shrink-0 text-muted-foreground">{label}</span>
      {value != null ? (
        <span className="min-w-0 truncate font-medium">{value}</span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        aria-label={computedRemoveLabel}
        data-slot="filter-chip-remove"
        className={cn(
          // Grows the button's REAL border-box from size-5 (20px) to size-6 (24px) —
          // WCAG 2.5.8's 24×24 CSS px minimum — instead of an invisible `::before`
          // hit-area expansion. A pseudo-element was tried first, but native
          // `<button>` elements (Tailwind Preflight sets `appearance: button`) clip
          // overflowing generated content to their own border box once nested a
          // couple of levels deep (verified by hand: identical CSS on a `<span>` at
          // the same nesting depth is NOT clipped) — the pseudo computes correctly
          // via `getComputedStyle` but is never actually hit-testable beyond the
          // visible box, so it silently fails to expand anything. Growing the real
          // box sidesteps that bug entirely.
          //
          // `ml-0.5` (+2px) → dropped to 0, and `-mr-0.5` (-2px) → `-mr-1` (-4px): the
          // box grows 2px on each side (20→24), so the LEFT margin loses the 2px it
          // used to add (keeping the left edge fixed) and the RIGHT margin gains an
          // extra -2px (absorbing the 2px the right edge now extends further into the
          // chip's own `pr-1`), so the total space this control consumes end-to-end —
          // and therefore its visual footprint and the × glyph's centered position
          // inside it (`items-center justify-center`, unaffected by the bigger box) —
          // is byte-for-byte identical to before (both resolve to 28px total).
          "-mr-1 size-6 rounded-md",
          active
            ? "text-foreground hover:bg-foreground/(--alpha-ink-tint) hover:text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <X className="size-(--icon-compact)" aria-hidden />
      </Button>
    </div>
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

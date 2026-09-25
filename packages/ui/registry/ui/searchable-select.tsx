// @vegastack searchable-select@0.23.31 sha256-4g3JV7ArXIgTZ5q2g8+A1eHE/PCdkcuF34eEOQP8RoY=

"use client";

import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { ChevronsUpDown, X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import {
  Combobox,
  ComboboxValue,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxStatus,
} from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { LoadMore, type LoadMoreState } from "@/components/ui/load-more";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/* ------------------------------------------------------------------------------------------------
 * SearchableSelect — the ONE "Select-shaped Combobox" preset: a full-width trigger that reads like
 * a `Select`, a panel-search field inside the popup, a check on the selected row, and an optional
 * clear control. `CountrySelect` and `RegionSelect` are thin, data-fed wrappers over it (audit
 * B8-02); a third data-fed picker composes it rather than restating the recipe a third time.
 *
 * Three structural decisions worth knowing before changing anything here:
 *
 * 1. **Selection goes through Base UI's `value`/`onValueChange` and nothing else.** The previous
 *    RegionSelect computed a toggle inside each item's `onClick` and left the root's
 *    `onValueChange` unwired, so keyboard Enter (which the ROOT handles) and a pointer click
 *    followed two different code paths. One path, or the two silently diverge.
 * 2. **The trigger is composed from `@base-ui/react/combobox`'s own `Combobox.Trigger`**, not our
 *    `ComboboxTrigger` wrapper: that wrapper always wraps its children in Base UI's
 *    `Combobox.Icon`, which is unconditionally `aria-hidden` (correct for an icon-only trigger,
 *    silently fatal for a text label).
 * 3. **The chevron and the clear control are SIBLINGS of the trigger, absolutely positioned inside
 *    the wrapper.** An interactive control may not contain another (axe `nested-interactive`), so
 *    the clear `Button` can never live inside the trigger button. They share one 36px trailing
 *    reserve (`pe-9`) and swap in place, so the trigger's text box does not move when a value is
 *    set — no width jump, no second magic padding.
 * ----------------------------------------------------------------------------------------------*/

/** The selection type: one item (or `null`), or an array with `multiple`. */
export type SearchableSelectValue<
  Item,
  Multiple extends boolean | undefined,
> = Multiple extends true ? Item[] : Item | null;

/** Props accepted by `SearchableSelect`. */
export interface SearchableSelectProps<
  Item,
  Multiple extends boolean | undefined = false,
> {
  /** The full option list. Passed to the Combobox root so filtering, label resolution and the empty
   * state all work from one source.
   */
  items: readonly Item[];
  /**
   * Pick several items. `value` becomes an array, rows toggle, the panel stays open while you
   * pick, and the trigger reads "{a}, {b}" or "{n} selected".
   * @default false
   */
  multiple?: Multiple;
  /** The selected item — or items, with `multiple` — or `null` when nothing is selected
   * (controlled). An item missing from `items` still shows its label.
   * @default null
   */
  value?: SearchableSelectValue<Item, Multiple>;
  /** Called with the new selection (`null`, or `[]` with `multiple`, when cleared).
   * @default undefined
   */
  onValueChange?: (value: SearchableSelectValue<Item, Multiple>) => void;
  /**
   * A second line under an option, read as its description.
   * @default undefined
   */
  itemToDescription?: (item: Item) => string | undefined;
  /**
   * The standard person option: a second, smaller muted line beside the name — an email. The
   * local search matches it as well as `itemToStringLabel`.
   * @default undefined
   */
  itemToSecondaryLabel?: (item: Item) => string | undefined;
  /**
   * A small muted outline badge right after a person option's name, on the same line — e.g.
   * "Inactive" for someone who is no longer an active member. Needs `itemToSecondaryLabel`.
   * @default undefined
   */
  itemToBadge?: (item: Item) => React.ReactNode;
  /**
   * Why an option is unavailable. Returning a reason disables the option — it stays reachable
   * and reads the reason as its description.
   * @default undefined
   */
  itemToDisabledReason?: (item: Item) => string | undefined;
  /**
   * The server filters: the list shows `items` as given and never filters locally. Pair with
   * `onSearchChange`, `loading`, `error` and `loadMore` (or spread `useAsyncSearch`).
   * @default false
   */
  remote?: boolean;
  /**
   * Called with the search text as it is typed.
   * @default undefined
   */
  onSearchChange?: (query: string) => void;
  /**
   * A search is in flight: "Searching…" is announced, and the rows already shown stay.
   * @default false
   */
  loading?: boolean;
  /**
   * The last search failed: the message shows in the panel with a "Try again" button.
   * @default undefined
   */
  error?: React.ReactNode;
  /**
   * What "Try again" calls when there is no `loadMore`.
   * @default undefined
   */
  onRetry?: () => void;
  /**
   * Keyset paging inside the panel: the shared Load more footer under the rows.
   * @default undefined
   */
  loadMore?: LoadMoreState;
  /**
   * Items always listed first and never filtered out — "Me", "Unassigned", recent picks.
   * @default undefined
   */
  leadingItems?: readonly Item[];
  /**
   * Group the rows under headings, in first-seen order.
   * @default undefined
   */
  groupBy?: (item: Item) => string;
  /**
   * Headings listed first, in this order, ahead of the first-seen order of the rest — so a
   * pinned group stays on top even when a leading item belongs to another group.
   * @default undefined
   */
  groupOrder?: readonly string[];
  /**
   * What is announced while `loading`.
   * @default "Searching…"
   */
  loadingLabel?: string;
  /**
   * The retry button's label.
   * @default "Try again"
   */
  retryLabel?: string;
  /**
   * Replaces the trigger's text for every state, empty included — for a trigger that reads
   * "Status: Open" (FilterBarFacet). It also becomes the trigger's fallback accessible name.
   * @default undefined
   */
  renderTriggerValue?: (selected: Item[]) => string;
  /**
   * The trigger's text for a multiple selection of more than two.
   * @default (n) => `${n} selected`
   */
  countLabel?: (n: number) => string;
  /** Identity comparison between the `value` and an entry of `items`. Defaults to comparing
   * `itemToKey`, so the selected tick shows on async/dynamic options (fresh objects per fetch)
   * exactly as on static ones.
   * @default (a, b) => itemToKey(a) === itemToKey(b)
   */
  isItemEqualToValue?: (a: Item, b: Item) => boolean;
  /** The string the search query filters against (and the trigger's fallback accessible name). */
  itemToStringLabel: (item: Item) => string;
  /** A stable React key for an item. */
  itemToKey: (item: Item) => string;
  /** Renders one row of the list. */
  renderItem: (item: Item) => React.ReactNode;
  /** Renders the selected item on the trigger. Defaults to {@link SearchableSelectProps.renderItem}.
   * @default undefined
   */
  renderValue?: (item: Item) => React.ReactNode;
  /** Shown on the trigger when nothing is selected.
   * @default 'Select an option'
   */
  placeholder?: string;
  /** Placeholder text for the in-panel search field.
   * @default 'Search…'
   */
  searchPlaceholder?: string;
  /**
   * Accessible name for the in-panel search field (it has no visible label) — "Search people",
   * never the field's own label, which names the trigger. Inside a `Field` this name is kept
   * over the Field label.
   * @default "Search"
   */
  searchLabel?: string;
  /** Shown inside the panel when the query matches nothing.
   * @default 'No results found.'
   */
  emptyMessage?: string;
  /** Shows a clear control on the trigger while a value is set, which reports `null`.
   * @default false
   */
  clearable?: boolean;
  /** Accessible name for the clear control.
   * @default 'Clear selection'
   */
  clearLabel?: string;
  /** Disable the control entirely.
   * @default false
   */
  disabled?: boolean;
  /** `id` forwarded to the trigger for label association. Inside a `Field` it is not needed —
   * the trigger reads its id, label, description and invalid state from the Field.
   * @default undefined
   */
  id?: string;
  /**
   * Submits the selection with a surrounding `<form>` under this name. The submitted value is
   * the item's `itemToKey`.
   * @default undefined
   */
  name?: string;
  /**
   * Requires a selection before the surrounding `<form>` submits.
   * @default false
   */
  required?: boolean;
  /**
   * Trigger height: `sm` (28px) is the inline tier shared with `Select size="sm"` and
   * `DatePicker size="sm"`, for table rows and toolbars.
   * @default 'default'
   */
  size?: "sm" | "default";
  /**
   * `ghost` is the inline trigger: content width, no border at rest, the border on hover, on
   * focus and while the panel is open — the same tier as `Select variant="ghost"`.
   * @default 'outline'
   */
  variant?: "outline" | "ghost";
  /** Additional classes merged onto the popup panel — e.g. `min-w-64` when an inline trigger is
   * narrower than its options.
   * @default undefined
   */
  contentClassName?: string;
  /** Open state of the panel (controlled).
   * @default undefined
   */
  open?: boolean;
  /** Called when the panel opens or closes.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Accessible name for the trigger. Inside a `Field` the `FieldLabel` names it. Standalone,
   * `role="combobox"` prohibits name-from-content, so a trigger with no label falls back to the
   * selected item's label, then the placeholder.
   * @default undefined
   */
  "aria-label"?: string;
  /**
   * Marks the trigger invalid — for a control whose error lives outside a `Field` (inside a
   * `Field` the trigger reads its invalid state from the Field).
   * @default undefined
   */
  "aria-invalid"?: boolean;
  /**
   * Ids of the elements that describe the trigger — an error message outside a `Field`.
   * @default undefined
   */
  "aria-describedby"?: string;
  /** Additional classes merged onto the trigger button.
   * @default undefined
   */
  className?: string;
  /** Additional classes merged onto the wrapping `<div>`.
   * @default undefined
   */
  containerClassName?: string;
  /** `data-slot` for the wrapper, so a wrapper component can carry its own testing/styling hook.
   * @default 'searchable-select'
   */
  "data-slot"?: string;
  /** `data-slot` written onto each row.
   * @default 'searchable-select-item'
   */
  itemSlot?: string;
  /** Ref forwarded to the trigger button — the component's focusable host (the panel is portaled).
   * @default undefined
   */
  ref?: React.Ref<HTMLButtonElement>;
  /**
   * Ref forwarded to the wrapping `<div>`. The wrapper exists because the clear control cannot
   * live inside the trigger button, so a wrapper component whose own public ref is its root
   * (`RegionSelect`) forwards it here rather than adding a second nesting level.
   * @default undefined
   */
  rootRef?: React.Ref<HTMLDivElement>;
}

/**
 * `SearchableSelect` — a searchable, single-select picker that looks like a `Select` and behaves
 * like a `Combobox`: a full-width trigger showing the current selection, a panel with a search
 * field at its head, filtered rows with a check on the selected one, and an optional clear control.
 * Controlled through `value` + `onValueChange`.
 *
 * Width is the parent's business (`w-full`, like every other form control) — constrain it with a
 * wrapper, never with a fixed width here.
 *
 * @example
 * <SearchableSelect
 *   items={projects}
 *   value={project}
 *   onValueChange={setProject}
 *   itemToKey={(p) => p.id}
 *   itemToStringLabel={(p) => p.name}
 *   renderItem={(p) => p.name}
 *   searchLabel="Search projects"
 *   placeholder="Select project"
 *   clearable
 * />
 */
export function SearchableSelect<
  Item,
  Multiple extends boolean | undefined = false,
>({
  items,
  multiple,
  value: valueProp,
  onValueChange,
  itemToDescription,
  itemToSecondaryLabel,
  itemToBadge,
  itemToDisabledReason,
  remote = false,
  onSearchChange,
  loading = false,
  error,
  onRetry,
  loadMore,
  leadingItems,
  groupBy,
  groupOrder,
  loadingLabel = "Searching…",
  retryLabel = "Try again",
  countLabel = (n) => `${n} selected`,
  renderTriggerValue,
  isItemEqualToValue,
  itemToStringLabel,
  itemToKey,
  renderItem,
  renderValue,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  searchLabel = "Search",
  emptyMessage = "No results found.",
  clearable = false,
  clearLabel = "Clear selection",
  disabled = false,
  id,
  name,
  required = false,
  size = "default",
  variant = "outline",
  contentClassName,
  open,
  onOpenChange,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  className,
  containerClassName,
  "data-slot": slot = "searchable-select",
  itemSlot = "searchable-select-item",
  ref,
  rootRef,
}: SearchableSelectProps<Item, Multiple>) {
  const face = renderValue ?? renderItem;
  const isMultiple = multiple === true;
  const value = (valueProp ?? (isMultiple ? [] : null)) as Item | Item[] | null;
  const selectedList: Item[] = isMultiple
    ? (value as Item[])
    : value
      ? [value as Item]
      : [];
  const hasValue = selectedList.length > 0;
  const valueText = (list: Item[]) =>
    list.length > 2
      ? countLabel(list.length)
      : list.map(itemToStringLabel).join(", ");

  // Leading items come first and are never filtered; the rest follow without repeats.
  const leadingKeys = React.useMemo(
    () => new Set((leadingItems ?? []).map(itemToKey)),
    [leadingItems, itemToKey],
  );
  const allItems = React.useMemo(() => {
    const lead = leadingItems ?? [];
    return [...lead, ...items.filter((i) => !leadingKeys.has(itemToKey(i)))];
  }, [items, leadingItems, leadingKeys, itemToKey]);
  const grouped = React.useMemo(() => {
    if (!groupBy) return null;
    const order: string[] = [];
    const byGroup = new Map<string, Item[]>();
    for (const item of allItems) {
      const g = groupBy(item);
      if (!byGroup.has(g)) {
        byGroup.set(g, []);
        order.push(g);
      }
      byGroup.get(g)!.push(item);
    }
    const first = (groupOrder ?? []).filter((g) => byGroup.has(g));
    return [...first, ...order.filter((g) => !first.includes(g))].map((g) => ({
      value: g,
      items: byGroup.get(g)!,
    }));
  }, [allItems, groupBy, groupOrder]);
  const filter = React.useMemo(() => {
    if (remote) return null;
    if (leadingKeys.size === 0 && !itemToSecondaryLabel) return undefined;
    return (item: Item, query: string) => {
      const q = query.trim().toLowerCase();
      return (
        leadingKeys.has(itemToKey(item)) ||
        itemToStringLabel(item).toLowerCase().includes(q) ||
        (itemToSecondaryLabel?.(item) ?? "").toLowerCase().includes(q)
      );
    };
  }, [remote, leadingKeys, itemToKey, itemToStringLabel, itemToSecondaryLabel]);
  // Match by key, so a fresh object from a new fetch still reads as selected.
  const isEqual = React.useCallback(
    (a: Item, b: Item) =>
      isItemEqualToValue
        ? isItemEqualToValue(a, b)
        : a === b || itemToKey(a) === itemToKey(b),
    [isItemEqualToValue, itemToKey],
  );

  const renderOption = (item: Item) => {
    const reason = itemToDisabledReason?.(item);
    const description = reason ?? itemToDescription?.(item);
    const secondary = itemToSecondaryLabel?.(item);
    const main =
      secondary !== undefined ? (
        <PersonOption
          name={renderItem(item)}
          email={secondary}
          badge={itemToBadge?.(item)}
        />
      ) : (
        renderItem(item)
      );
    return (
      <ComboboxItem
        key={itemToKey(item)}
        value={item}
        data-slot={itemSlot}
        disabled={reason !== undefined}
      >
        {description !== undefined ? (
          <ItemContent>
            <ItemTitle>{main}</ItemTitle>
            <ItemDescription>{description}</ItemDescription>
          </ItemContent>
        ) : (
          main
        )}
      </ComboboxItem>
    );
  };
  const showFooter = error != null || (loadMore?.hasMore ?? false);
  // DS-22: the trigger is named by its label. Inside a `Field`, Base UI's Combobox gives the
  // trigger `aria-labelledby` (and the description ids and `aria-invalid`), and a `<label for>`
  // names it natively; an `aria-label` would override either, so only a trigger with neither
  // falls back to the value, then the placeholder.
  const [trigger, setTrigger] = React.useState<HTMLButtonElement | null>(null);
  const triggerRef = React.useMemo(() => mergeRefs(setTrigger, ref), [ref]);
  const [labelled, setLabelled] = React.useState(false);
  React.useLayoutEffect(() => {
    setLabelled(
      Boolean(
        trigger?.getAttribute("aria-labelledby") || trigger?.labels?.length,
      ),
    );
  });
  const triggerLabel =
    ariaLabel ??
    (labelled
      ? undefined
      : renderTriggerValue
        ? renderTriggerValue(selectedList)
        : hasValue
          ? valueText(selectedList)
          : placeholder);
  const showClear = clearable && hasValue;
  const ghost = variant === "ghost";

  return (
    <div
      ref={rootRef}
      data-slot={slot}
      data-size={size}
      data-variant={variant}
      className={cn(
        "relative min-w-0",
        ghost ? "w-fit" : "w-full",
        containerClassName,
      )}
    >
      <Combobox
        items={(grouped ?? allItems) as Item[]}
        multiple={isMultiple}
        value={value}
        onValueChange={(next: Item | Item[] | null) =>
          onValueChange?.(next as SearchableSelectValue<Item, Multiple>)
        }
        filter={filter}
        onInputValueChange={
          onSearchChange ? (query: string) => onSearchChange(query) : undefined
        }
        isItemEqualToValue={isEqual}
        itemToStringLabel={itemToStringLabel}
        open={open}
        onOpenChange={onOpenChange}
        autoHighlight
        disabled={disabled}
        name={name}
        required={required}
        // A form posts the item's key, not "[object Object]".
        itemToStringValue={itemToKey}
      >
        <BaseCombobox.Trigger
          id={id}
          ref={triggerRef}
          disabled={disabled}
          aria-label={triggerLabel}
          aria-invalid={ariaInvalid || undefined}
          aria-describedby={ariaDescribedBy}
          // The styling hook for "nothing selected yet", so a wrapper can tint the trigger from
          // the outside without reaching through to the value span.
          data-placeholder={hasValue ? undefined : ""}
          render={
            <Button
              variant="outline"
              size={size === "sm" ? "sm" : "default"}
              // `pe-9` is the trailing reserve the chevron AND the clear control share, so the
              // label's box is identical whether or not something is selected. The `sm` tier
              // keeps the 14px text of `Select size="sm"`, so an inline row reads as one type.
              className={cn(
                "w-full justify-start pe-9 font-normal",
                size === "sm" && "text-sm",
                ghost &&
                  "border-transparent bg-transparent shadow-none hover:border-input focus:border-ring/70 aria-expanded:border-input dark:bg-transparent",
                className,
              )}
              data-slot={`${slot}-trigger`}
            />
          }
        >
          <ComboboxValue>
            {(selected: Item | Item[] | null) => {
              const list = Array.isArray(selected)
                ? selected
                : selected
                  ? [selected]
                  : [];
              if (renderTriggerValue)
                return (
                  <span className="min-w-0 truncate">
                    {renderTriggerValue(list)}
                  </span>
                );
              if (list.length === 0)
                return (
                  <span className="min-w-0 truncate text-muted-foreground">
                    {placeholder}
                  </span>
                );
              // A flex child only truncates with `min-w-0` (LAY-11).
              return (
                <span className="min-w-0 truncate">
                  {isMultiple ? valueText(list) : face(list[0]!)}
                </span>
              );
            }}
          </ComboboxValue>
        </BaseCombobox.Trigger>
        <ComboboxContent
          align="start"
          className={cn(
            "w-(--anchor-width) p-0",
            // A person list (name over email) gets room so neither line truncates.
            itemToSecondaryLabel && "min-w-72",
            contentClassName,
          )}
        >
          <ComboboxInput
            showTrigger={false}
            aria-label={searchLabel}
            // Inside a `Field`, Base UI hands the Field label's id to the combobox input as
            // `aria-labelledby`, which outranks `aria-label`: the search box answered to the
            // trigger's name ("Assignee"). The trigger is the control the Field names; an
            // explicit `undefined` wins Base UI's prop merge (API-26's recipe on the toggle).
            aria-labelledby={undefined}
            placeholder={searchPlaceholder}
          />
          {/* The polite status region (API-27): mounted for the panel's life, only its text
              changes, and a sibling of the list (never inside the listbox). Screen-reader only: the
              skeleton rows below are the visible loading state. */}
          <ComboboxStatus data-slot={`${slot}-status`}>
            {loading ? loadingLabel : null}
          </ComboboxStatus>
          {loading ? null : <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>}
          <ComboboxList className="p-1">
            {grouped
              ? (group: { value: string; items: Item[] }) => (
                  <ComboboxGroup key={group.value} items={group.items}>
                    <ComboboxLabel>{group.value}</ComboboxLabel>
                    <ComboboxCollection>
                      {(item: Item) => renderOption(item)}
                    </ComboboxCollection>
                  </ComboboxGroup>
                )
              : (item: Item) => renderOption(item)}
          </ComboboxList>
          {/* Loading with no rows yet (first open, or a new query that cleared them): skeleton
              rows the height of real options (two lines with `itemToSecondaryLabel`), under any
              `leadingItems`, so the panel is never blank. With rows already on screen they stay
              and a small spinner at the search field's end marks the fetch. The status region
              above carries the announcement. */}
          {loading && items.length === 0 ? (
            <div
              aria-hidden
              data-slot={`${slot}-loading`}
              className={cn(
                "flex flex-col px-1 pb-1",
                !leadingItems?.length && "pt-1",
              )}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col justify-center gap-1.5 px-1.5",
                    itemToSecondaryLabel ? "h-11" : "h-7",
                  )}
                >
                  <Skeleton
                    className={cn("h-3.5", i % 2 === 0 ? "w-3/5" : "w-2/5")}
                  />
                  {itemToSecondaryLabel ? (
                    <Skeleton
                      className={cn("h-3", i % 2 === 0 ? "w-2/5" : "w-1/2")}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          {loading && items.length > 0 ? (
            <Spinner
              aria-hidden
              data-slot={`${slot}-searching`}
              className="pointer-events-none absolute end-3 top-3 size-3.5 text-muted-foreground"
            />
          ) : null}
          {showFooter ? (
            <LoadMore
              hasMore
              loading={loadMore?.loading}
              error={error}
              retryLabel={retryLabel}
              onLoadMore={loadMore?.onLoadMore ?? onRetry ?? (() => {})}
              className="border-t border-border p-1.5"
            />
          ) : null}
        </ComboboxContent>
      </Combobox>
      {showClear ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={clearLabel}
          disabled={disabled}
          data-slot={`${slot}-clear`}
          // Centred with auto margins, not `-translate-y-1/2`: Button's press nudge sets `translate-y`
          // and would replace the centring transform, dropping the × by half its height.
          className="absolute inset-y-0 end-1.5 my-auto active:not-aria-[haspopup]:translate-y-0"
          onClick={() => {
            // DS-22: this control unmounts the moment the value clears, which would drop focus
            // to <body>; hand it to the trigger first. No announcement — the change is visible.
            trigger?.focus();
            onValueChange?.(
              (isMultiple ? [] : null) as SearchableSelectValue<Item, Multiple>,
            );
          }}
        >
          <X />
        </Button>
      ) : (
        <ChevronsUpDown
          aria-hidden
          className={cn(
            "pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
            disabled && "opacity-50",
          )}
        />
      )}
    </div>
  );
}

/** Props accepted by `PersonOption`. */
export interface PersonOptionProps {
  /** The person's name. */
  name: React.ReactNode;
  /**
   * The smaller, muted second line — usually the email.
   * @default undefined
   */
  email?: React.ReactNode;
  /**
   * A leading avatar.
   * @default undefined
   */
  avatar?: React.ReactNode;
  /**
   * A status beside the name on the same line, such as "Inactive". A string renders as a small
   * muted outline `Badge`; pass any node for something else.
   * @default undefined
   */
  badge?: React.ReactNode;
}

/** `PersonBadge` — the small muted outline badge after a person's name ("Inactive"); a non-string passes through. @example <PersonBadge badge="Inactive" /> */
export function PersonBadge({ badge }: { badge?: React.ReactNode }) {
  if (badge == null || badge === false) return null;
  if (typeof badge !== "string") return <>{badge}</>;
  return (
    <Badge
      variant="outline"
      data-slot="person-badge"
      className="shrink-0 text-xs font-normal text-muted-foreground"
    >
      {badge}
    </Badge>
  );
}

/**
 * `PersonOption` — the standard person row wherever people are listed (pickers, menus, submenus
 * such as "Assign ›"): an avatar, then the name on the first line and a smaller muted email on
 * the second — stacked, never inline. `SearchableSelect` and `FilterBarFacet` draw it for you
 * from `itemToSecondaryLabel`; use it directly inside a custom `renderItem` or a
 * `DropdownMenuItem`. Give the popup that lists people at least `min-w-72` (a `RowActionItem`
 * `submenu` and a `SearchableSelect` with `itemToSecondaryLabel` do this themselves).
 *
 * `badge` adds a status after the name ("Inactive").
 *
 * @example
 * <PersonOption name="Arjun Mehta" email="arjun@acme.com" badge="Inactive" />
 */
export function PersonOption({
  name,
  email,
  avatar,
  badge,
}: PersonOptionProps) {
  return (
    <span data-slot="person-option" className="flex min-w-0 items-center gap-2">
      {avatar}
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{name}</span>
          <PersonBadge badge={badge} />
        </span>
        {email != null ? (
          <span className="truncate text-xs text-muted-foreground">
            {email}
          </span>
        ) : null}
      </span>
    </span>
  );
}

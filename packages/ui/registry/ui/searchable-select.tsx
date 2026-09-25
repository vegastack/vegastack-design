// @vegastack searchable-select@0.22.0 sha256-yjct5dWgpl9oc75VNIA7sOZSqIwcWJmcU6E6AnUaVck=

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
import { Button } from "@/components/ui/button";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { LoadMore, type LoadMoreState } from "@/components/ui/load-more";

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
  /** Identity comparison between the `value` and an entry of `items`. Defaults to reference equality.
   * @default undefined
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
    if (leadingKeys.size === 0) return undefined;
    return (item: Item, query: string) =>
      leadingKeys.has(itemToKey(item)) ||
      itemToStringLabel(item)
        .toLowerCase()
        .includes(query.trim().toLowerCase());
  }, [remote, leadingKeys, itemToKey, itemToStringLabel]);

  const renderOption = (item: Item) => {
    const reason = itemToDisabledReason?.(item);
    const description = reason ?? itemToDescription?.(item);
    return (
      <ComboboxItem
        key={itemToKey(item)}
        value={item}
        data-slot={itemSlot}
        disabled={reason !== undefined}
      >
        {description !== undefined ? (
          <ItemContent>
            <ItemTitle>{renderItem(item)}</ItemTitle>
            <ItemDescription>{description}</ItemDescription>
          </ItemContent>
        ) : (
          renderItem(item)
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
        isItemEqualToValue={isItemEqualToValue}
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
          className={cn("w-(--anchor-width) p-0", contentClassName)}
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
              changes, and a sibling of the list (never inside the listbox). It is visible while
              a search has no rows to show yet, so the panel is never blank, like Command's
              loading row. */}
          <ComboboxStatus
            data-slot={`${slot}-status`}
            visible={loading && allItems.length === 0}
          >
            {loading ? loadingLabel : null}
          </ComboboxStatus>
          <ComboboxEmpty>{loading ? null : emptyMessage}</ComboboxEmpty>
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
          className="absolute end-1.5 top-1/2 -translate-y-1/2"
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

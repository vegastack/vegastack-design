// @vegastack searchable-select@0.7.5 sha256-aoMysPqNQ4arCB3fDcphXKhdrS0IBcNbdPgUcWF9VdA=

"use client";

import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { ChevronsUpDown, X } from "lucide-react";
import { cn } from "@vegastack/design";
import {
  Combobox,
  ComboboxValue,
  ComboboxPopupInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

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
 *    the clear `IconButton` can never live inside the trigger button. They share one 36px trailing
 *    reserve (`pe-9`) and swap in place, so the trigger's text box does not move when a value is
 *    set — no width jump, no second magic padding.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `SearchableSelect`. */
export interface SearchableSelectProps<Item> {
  /** The full option list. Passed to the Combobox root so filtering, label resolution and the empty
   * state all work from one source.
   */
  items: readonly Item[];
  /** The selected item, or `null` when nothing is selected (controlled).
   * @default null
   */
  value?: Item | null;
  /** Called with the newly selected item, or `null` when the clear control is used.
   * @default undefined
   */
  onValueChange?: (value: Item | null) => void;
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
  /** Accessible name for the in-panel search field (it has no visible label). */
  searchLabel: string;
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
  /** `id` forwarded to the trigger for label association.
   * @default undefined
   */
  id?: string;
  /** Open state of the panel (controlled).
   * @default undefined
   */
  open?: boolean;
  /** Called when the panel opens or closes.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Accessible name for the trigger. `role="combobox"` prohibits name-from-content, so the control
   * always needs one; defaults to the selected item's label, falling back to the placeholder.
   * @default undefined
   */
  "aria-label"?: string;
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
export function SearchableSelect<Item>({
  items,
  value = null,
  onValueChange,
  isItemEqualToValue,
  itemToStringLabel,
  itemToKey,
  renderItem,
  renderValue,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  searchLabel,
  emptyMessage = "No results found.",
  clearable = false,
  clearLabel = "Clear selection",
  disabled = false,
  id,
  open,
  onOpenChange,
  "aria-label": ariaLabel,
  className,
  containerClassName,
  "data-slot": slot = "searchable-select",
  itemSlot = "searchable-select-item",
  ref,
  rootRef,
}: SearchableSelectProps<Item>) {
  const face = renderValue ?? renderItem;
  const triggerLabel =
    ariaLabel ?? (value ? itemToStringLabel(value) : placeholder);
  const showClear = clearable && value != null;

  return (
    <div
      ref={rootRef}
      data-slot={slot}
      className={cn("relative w-full min-w-0", containerClassName)}
    >
      <Combobox
        items={items as Item[]}
        value={value}
        onValueChange={(next: Item | null) => onValueChange?.(next)}
        isItemEqualToValue={isItemEqualToValue}
        itemToStringLabel={itemToStringLabel}
        open={open}
        onOpenChange={onOpenChange}
        autoHighlight
        disabled={disabled}
      >
        <BaseCombobox.Trigger
          id={id}
          ref={ref}
          disabled={disabled}
          aria-label={triggerLabel}
          // The styling hook for "nothing selected yet", so a wrapper can tint the trigger from
          // the outside without reaching through to the value span.
          data-placeholder={value ? undefined : ""}
          render={
            <Button
              variant="outline"
              // `pe-9` is the trailing reserve the chevron AND the clear control share, so the
              // label's box is identical whether or not something is selected.
              className={cn("w-full justify-start pe-9 font-normal", className)}
              data-slot={`${slot}-trigger`}
            />
          }
        >
          <ComboboxValue className="flex-1">
            {(selected: Item | null) =>
              selected ? (
                face(selected)
              ) : (
                <span className="truncate text-muted-foreground">
                  {placeholder}
                </span>
              )
            }
          </ComboboxValue>
        </BaseCombobox.Trigger>
        <ComboboxContent align="start" className="w-(--anchor-width) p-0">
          <ComboboxPopupInput
            aria-label={searchLabel}
            placeholder={searchPlaceholder}
          />
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList className="p-1">
            {(item: Item) => (
              <ComboboxItem
                key={itemToKey(item)}
                value={item}
                data-slot={itemSlot}
              >
                {renderItem(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {showClear ? (
        <IconButton
          variant="ghost"
          size="xs"
          aria-label={clearLabel}
          disabled={disabled}
          data-slot={`${slot}-clear`}
          className="absolute end-1.5 top-1/2 -translate-y-1/2"
          onClick={() => onValueChange?.(null)}
        >
          <X />
        </IconButton>
      ) : (
        <ChevronsUpDown
          aria-hidden
          className={cn(
            "pointer-events-none absolute end-3 top-1/2 size-(--icon-default) -translate-y-1/2 text-muted-foreground",
            disabled && "opacity-(--opacity-dim)",
          )}
        />
      )}
    </div>
  );
}

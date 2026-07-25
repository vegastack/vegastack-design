// @vegastack region-select@0.3.0 sha256-wa4KvTSl+kd16vnHbORAJJYmMp51dkZmUjC6dHufFVA=

"use client";

import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@vegastack/design";
import { REGIONS_BY_COUNTRY } from "@/components/ui/region-select-data";
import {
  Combobox,
  ComboboxPopupInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ------------------------------------------------------------------------------------------------
 * RegionSelect — a searchable combobox of states/provinces for a given country, a THIN data-fed
 * composition of our `Combobox` (search input living inside `ComboboxContent`, the "Select-style"
 * pattern — see combobox.tsx's own JSDoc and country-select.tsx's note on why `ComboboxTrigger`
 * itself isn't used for the label). Countries with a known administrative division set (see
 * {@link REGIONS_BY_COUNTRY}) render the searchable dropdown; countries without one fall back to a
 * plain text `Input` so the value is still captured. Pure presentational + controlled (`value` +
 * `onValueChange`) — the consuming app owns the selected code.
 *
 * Re-selecting the already-selected state clears it (a deliberate toggle UX kept from the prior
 * build) — Base UI's Combobox has no built-in "click again to deselect" for single-select, so each
 * item's `onClick` computes the toggle directly and drives `Combobox`'s `value` fully from this
 * component's own controlled `value` prop (the root's `onValueChange` is intentionally left
 * unwired, avoiding a second, conflicting change signal).
 * ----------------------------------------------------------------------------------------------*/

/** A single administrative division (state / province / region) with its ISO-ish code and label. */
export interface Region {
  /** The subdivision code, stored as the selected `value` (e.g. `"CA"`). */
  code: string;
  /** The human-readable subdivision name shown in the list (e.g. `"California"`). */
  name: string;
}

/**
 * Look up the states/provinces for a country code (case-insensitive). Returns an empty array when
 * the country has no predefined subdivisions in {@link REGIONS_BY_COUNTRY}.
 */
export function getRegionsByCountry(country: string): Region[] {
  return REGIONS_BY_COUNTRY[country.toUpperCase()] ?? [];
}

/** Whether a country has predefined subdivisions in {@link REGIONS_BY_COUNTRY} (case-insensitive). */
export function hasRegions(country: string): boolean {
  return country.toUpperCase() in REGIONS_BY_COUNTRY;
}

/** Props accepted by `RegionSelect`. */
export interface RegionSelectProps {
  /** ISO-3166-1 alpha-2 country code that determines the available states (e.g. `"US"`, `"CA"`). */
  country: string;
  /** The currently selected state code (controlled). Empty string when nothing is selected.
   * @default ""
   */
  value?: string;
  /** Called with the new state code when the selection changes (or the free-text value for fallback countries).
   * @default undefined
   */
  onValueChange?: (value: string) => void;
  /**
   * Placeholder shown in the trigger / input when nothing is selected.
   * @default "Select state"
   */
  placeholder?: string;
  /**
   * Disable the control entirely.
   * @default false
   */
  disabled?: boolean;
  /** `id` forwarded to the trigger / input for label association.
   * @default undefined
   */
  id?: string;
  /**
   * Accessible name for the trigger / input. `role="combobox"` prohibits name-from-content, so the
   * control always needs an explicit label; defaults to the selected state's name, falling back to
   * the `placeholder`.

   * @default undefined
   */
  "aria-label"?: string;
  /** Additional className for the trigger / input element.
   * @default undefined
   */
  className?: string;
  /** Additional className for the outer root wrapper.
   * @default undefined
   */
  containerClassName?: string;
  /** Ref forwarded to the component's root `<div>` (wraps either the combobox or the fallback input).
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * `RegionSelect` — a searchable state/province picker for a country. Renders a `Combobox`-powered
 * dropdown for countries with a known subdivision set, with live filtering and full keyboard
 * navigation; for countries without predefined states it falls back to a plain text `Input` so the
 * value is still captured. Controlled via `value` + `onValueChange`.
 *
 * @example
 * // Country with states → searchable dropdown
 * <RegionSelect country="US" value={state} onValueChange={setState} />
 *
 * @example
 * // Country without states → free-text fallback
 * <RegionSelect country="SG" value={state} onValueChange={setState} />
 */
export function RegionSelect({
  country,
  value = "",
  onValueChange,
  placeholder = "Select state",
  disabled = false,
  id,
  "aria-label": ariaLabel,
  className,
  containerClassName,
  ref,
}: RegionSelectProps) {
  const [open, setOpen] = React.useState(false);
  const states = getRegionsByCountry(country);
  const selected = states.find((state) => state.code === value);
  // `role="combobox"` prohibits name-from-content, so the trigger needs an explicit label —
  // reflect the current selection (or the placeholder) so the control is always discernible.
  const triggerLabel = ariaLabel ?? selected?.name ?? placeholder;

  // Country has no predefined subdivisions — fall back to a free-text input so the value is still
  // captured (e.g. Singapore, Hong Kong, monolithic territories).
  if (states.length === 0) {
    return (
      <div
        ref={ref}
        data-slot="region-select"
        data-fallback=""
        className={cn("relative", containerClassName)}
      >
        <Input
          id={id}
          value={value}
          onChange={(event) => onValueChange?.(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder}
          className={cn("pl-8", className)}
        />
        <MapPin
          aria-hidden
          className="pointer-events-none absolute top-1/2 start-3 size-(--icon-default) -translate-y-1/2 text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <div ref={ref} data-slot="region-select" className={containerClassName}>
      <Combobox
        items={states}
        value={selected ?? null}
        open={open}
        onOpenChange={setOpen}
        isItemEqualToValue={(a: Region, b: Region) => a.code === b.code}
        itemToStringLabel={(state: Region) => state.name}
        autoHighlight
        disabled={disabled}
      >
        <BaseCombobox.Trigger
          id={id}
          disabled={disabled}
          render={
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between font-normal data-[placeholder]:text-muted-foreground",
                className,
              )}
              data-placeholder={selected ? undefined : ""}
            />
          }
          aria-label={triggerLabel}
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin
              aria-hidden
              className="size-(--icon-default) shrink-0 text-muted-foreground"
            />
            <span className="truncate">
              {selected ? selected.name : placeholder}
            </span>
          </span>
          <ChevronsUpDown
            aria-hidden
            className="size-(--icon-default) shrink-0 text-muted-foreground"
          />
        </BaseCombobox.Trigger>
        <ComboboxContent align="start" className="w-(--anchor-width) p-0">
          <ComboboxPopupInput
            aria-label="Search states"
            placeholder="Search states…"
          />
          <ComboboxEmpty>No state found.</ComboboxEmpty>
          <ComboboxList className="p-1">
            {(state: Region) => (
              <ComboboxItem
                key={state.code}
                value={state}
                onClick={() => {
                  // Toggle: re-selecting the already-selected state clears it. Base UI's own
                  // click→select flow still runs (composed, not replaced) but has no observable
                  // effect on the PUBLIC value — the root's `onValueChange` is left unwired (see
                  // this file's header note), so this handler is the only source of truth. The
                  // leading checkmark is `ComboboxItem`'s own built-in trailing indicator (moved
                  // here via its logical end/start padding) — no separate manual `<Check>` needed.
                  onValueChange?.(state.code === value ? "" : state.code);
                  setOpen(false);
                }}
              >
                {state.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

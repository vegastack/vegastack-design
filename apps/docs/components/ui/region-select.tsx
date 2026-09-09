// @vegastack region-select@0.6.0 sha256-fGG+dByUxOdez0vdjfp88Yf022ffpUj4W3p8dT6+iKo=

"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { cn } from "@vegastack/design";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getRegions, type Region } from "@/lib/geo-data";
import { Input } from "@/components/ui/input";

/* ------------------------------------------------------------------------------------------------
 * RegionSelect — the subdivision dataset for one country fed into `SearchableSelect`. Countries
 * with a known administrative-division set (see `geo-data`'s `REGIONS`) get the searchable
 * dropdown; countries without one fall back to a plain text `Input` so the value is still captured.
 *
 * Selection runs through `SearchableSelect`'s single `value`/`onValueChange` path. The old
 * click-again-to-clear toggle is gone: it lived in each item's `onClick` with the Combobox root's
 * `onValueChange` deliberately unwired, so keyboard Enter and a pointer click reached the value by
 * two different routes (audit B8-02). Clearing is now the explicit `clearable` control on the
 * trigger — discoverable, and the same code path for both input modalities.
 * ----------------------------------------------------------------------------------------------*/

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
  /**
   * Shows a clear control on the trigger while a state is selected — the explicit replacement for
   * the old click-again-to-clear toggle. Has no effect on the free-text fallback.
   * @default true
   */
  clearable?: boolean;
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
 * `RegionSelect` — a searchable state/province picker for a country, with live filtering and full
 * keyboard navigation; for countries without predefined states it falls back to a plain text
 * `Input` so the value is still captured. Controlled via `value` + `onValueChange`.
 *
 * The dataset and its lookup (`REGIONS`, `getRegions`, `Region`) are the `geo-data` item's public
 * API — import them from `@/lib/geo-data`.
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
  clearable = true,
  id,
  "aria-label": ariaLabel,
  className,
  containerClassName,
  ref,
}: RegionSelectProps) {
  const states = getRegions(country);
  const selected = states.find((state) => state.code === value) ?? null;

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
    <SearchableSelect<Region>
      rootRef={ref}
      id={id}
      items={states}
      value={selected}
      onValueChange={(state) => onValueChange?.(state ? state.code : "")}
      isItemEqualToValue={(a, b) => a.code === b.code}
      itemToKey={(state) => state.code}
      itemToStringLabel={(state) => state.name}
      renderItem={(state) => state.name}
      renderValue={(state) => (
        <>
          <MapPin
            aria-hidden
            className="size-(--icon-default) shrink-0 text-muted-foreground"
          />
          <span className="truncate">{state.name}</span>
        </>
      )}
      placeholder={placeholder}
      searchLabel="Search states"
      searchPlaceholder="Search states…"
      emptyMessage="No state found."
      clearable={clearable}
      clearLabel="Clear state"
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      containerClassName={containerClassName}
      data-slot="region-select"
      itemSlot="region-select-item"
    />
  );
}

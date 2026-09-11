// @vegastack country-select@0.7.0 sha256-lZ48rmF85obRw66nrFbwIf4YM8ufyfVNYp9TxTJc1YI=

"use client";

import * as React from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { COUNTRIES, type Country } from "@/lib/geo-data";

/* ------------------------------------------------------------------------------------------------
 * CountrySelect — the country dataset fed into `SearchableSelect`, with the ISO 3166-1 alpha-2 code
 * as the public value. Everything structural (the Select-shaped trigger, the panel search, the
 * check on the selected row, the clear control, the `value`/`onValueChange` selection path) lives
 * in `searchable-select.tsx`; the dataset lives in the `geo-data` lib item so a consumer who also
 * installs `RegionSelect` copies the ISO data once (audit B8-02 / decision D27).
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `CountrySelect`. */
export interface CountrySelectProps {
  /** The selected country's ISO 3166-1 alpha-2 code (controlled).
   * @default undefined
   */
  value?: string;
  /** Fired with the selected ISO code when the user picks a country, or `""` when it is cleared.
   * @default undefined
   */
  onValueChange?: (code: string) => void;
  /** Placeholder shown on the trigger when nothing is selected. @default 'Select country' */
  placeholder?: string;
  /** Disable the control. @default false */
  disabled?: boolean;
  /** Override the country list. @default COUNTRIES */
  countries?: Country[];
  /** Shows a clear control on the trigger while a country is selected. @default false */
  clearable?: boolean;
  /** `id` forwarded to the trigger for label association.
   * @default undefined
   */
  id?: string;
  /** Accessible name for the trigger. Defaults to the selected country name or the placeholder.
   * @default undefined
   */
  "aria-label"?: string;
  /** Additional class names merged onto the trigger button.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the trigger button — the component's focusable root (the popover panel is
   * portaled, so the trigger is the stable host element to focus/measure).

   * @default undefined
   */
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * `CountrySelect` — a searchable country picker returning the ISO 3166-1 alpha-2 code. Full-width
 * like every other form control; constrain it with a parent, not a fixed width.
 *
 * The dataset and its lookup (`COUNTRIES`, `getCountryByCode`, `Country`) are the `geo-data` item's
 * public API — import them from `@/lib/geo-data`.
 *
 * @example
 * const [country, setCountry] = React.useState<string>();
 * <CountrySelect value={country} onValueChange={setCountry} />
 */
export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select country",
  disabled = false,
  countries = COUNTRIES,
  clearable = false,
  id,
  "aria-label": ariaLabel,
  className,
  ref,
}: CountrySelectProps) {
  const selectedCode = value?.toUpperCase();
  const selected = selectedCode
    ? (countries.find(
        (country) => country.code.toUpperCase() === selectedCode,
      ) ?? null)
    : null;

  return (
    <SearchableSelect<Country>
      ref={ref}
      id={id}
      items={countries}
      value={selected}
      onValueChange={(country) => onValueChange?.(country ? country.code : "")}
      isItemEqualToValue={(a, b) => a.code === b.code}
      itemToKey={(country) => country.code}
      itemToStringLabel={(country) => `${country.name} ${country.code}`}
      renderItem={(country) => (
        <>
          <span aria-hidden>{country.flag}</span>
          <span className="truncate">{country.name}</span>
        </>
      )}
      placeholder={placeholder}
      searchLabel="Search countries"
      searchPlaceholder="Search countries…"
      emptyMessage="No country found."
      clearable={clearable}
      clearLabel="Clear country"
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      data-slot="country-select"
      itemSlot="country-select-item"
    />
  );
}

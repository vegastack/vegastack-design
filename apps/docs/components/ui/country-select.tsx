// @vegastack country-select@0.2.0 sha256-82Sx3De5gW+Tg3oUIybA028a8FKuKGOJB5TGUcpK2bY=

"use client";

import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { ChevronsUpDown } from "lucide-react";
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

/* ------------------------------------------------------------------------------------------------
 * CountrySelect — a button-triggered searchable combobox of countries (flag + name), value = ISO
 * 3166-1 alpha-2 code. A THIN, data-fed composition of our `Combobox`: `items={countries}`, a
 * `BaseCombobox.Trigger` styled as a full-width `Button` (the "Select-style" pattern — see
 * combobox.tsx's own JSDoc), and the search `ComboboxPopupInput` living INSIDE `ComboboxContent`
 * (`inputInsidePopup`), which is what gives the trigger `role="combobox"` +
 * `aria-haspopup="dialog"` instead of a bare icon-only trigger. Pure presentational + controlled
 * (`value` + `onValueChange`); the consuming app owns the selected code.
 *
 * NOTE: `ComboboxTrigger` (combobox.tsx's own wrapper) always wraps its `children` in Base UI's
 * `Combobox.Icon`, which is unconditionally `aria-hidden` (verified: `ComboboxIcon.mjs` hard-codes
 * it) — correct for an icon-only trigger, but it would silently hide a text label. So the trigger
 * here is composed directly from `@base-ui/react/combobox`'s `Combobox.Trigger` instead, with
 * `ComboboxValue` (not aria-hidden) and the chevron as plain siblings.
 * ----------------------------------------------------------------------------------------------*/

/** A single country entry. */
export interface Country {
  /** ISO 3166-1 alpha-2 code, stored as the selected `value` (e.g. `"US"`). */
  code: string;
  /** The human-readable country name shown in the list (e.g. `"United States"`). */
  name: string;
  /** The flag emoji (regional indicator pair). */
  flag: string;
}

/**
 * A broad, embedded country dataset (ISO 3166-1 alpha-2 code + English name + flag emoji),
 * covering all regions. Extend it by editing this array — no code change required.
 */
export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "AL", name: "Albania", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿" },
  { code: "AD", name: "Andorra", flag: "🇦🇩" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", flag: "🇦🇲" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", flag: "🇧🇧" },
  { code: "BY", name: "Belarus", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BJ", name: "Benin", flag: "🇧🇯" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻" },
  { code: "CF", name: "Central African Republic", flag: "🇨🇫" },
  { code: "TD", name: "Chad", flag: "🇹🇩" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "KM", name: "Comoros", flag: "🇰🇲" },
  { code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "CD", name: "Congo (Democratic Republic)", flag: "🇨🇩" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czechia", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
  { code: "DM", name: "Dominica", flag: "🇩🇲" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", flag: "🇪🇷" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", flag: "🇬🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "GD", name: "Grenada", flag: "🇬🇩" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "GN", name: "Guinea", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "GY", name: "Guyana", flag: "🇬🇾" },
  { code: "HT", name: "Haiti", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", flag: "🇮🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", flag: "🇱🇷" },
  { code: "LY", name: "Libya", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MO", name: "Macau", flag: "🇲🇴" },
  { code: "MK", name: "Macedonia", flag: "🇲🇰" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "MH", name: "Marshall Islands", flag: "🇲🇭" },
  { code: "MR", name: "Mauritania", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "FM", name: "Micronesia", flag: "🇫🇲" },
  { code: "MD", name: "Moldova", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", flag: "🇲🇨" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "NA", name: "Namibia", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", flag: "🇳🇷" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KP", name: "North Korea", flag: "🇰🇵" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "PW", name: "Palau", flag: "🇵🇼" },
  { code: "PS", name: "Palestine", flag: "🇵🇸" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "KN", name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "LC", name: "Saint Lucia", flag: "🇱🇨" },
  { code: "VC", name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "WS", name: "Samoa", flag: "🇼🇸" },
  { code: "SM", name: "San Marino", flag: "🇸🇲" },
  { code: "ST", name: "Sao Tome and Principe", flag: "🇸🇹" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "SB", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "SO", name: "Somalia", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", flag: "🇸🇩" },
  { code: "SR", name: "Suriname", flag: "🇸🇷" },
  { code: "SZ", name: "Swaziland", flag: "🇸🇿" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SY", name: "Syria", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", flag: "🇹🇴" },
  { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "TR", name: "Türkiye", flag: "🇹🇷" },
  { code: "TM", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
  { code: "VA", name: "Vatican City", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
];

/** Look up a country by its ISO 3166-1 alpha-2 code (case-insensitive). */
export function getCountryByCode(
  code: string | undefined,
): Country | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return COUNTRIES.find((c) => c.code === upper);
}

/** Props accepted by `CountrySelect`. */
export interface CountrySelectProps {
  /** The selected country's ISO 3166-1 alpha-2 code (controlled).
   * @default ISO
   */
  value?: string;
  /** Fired with the selected ISO code when the user picks a country.
   * @default undefined
   */
  onValueChange?: (code: string) => void;
  /** Placeholder shown on the trigger when nothing is selected. @default 'Select country' */
  placeholder?: string;
  /** Disable the control. @default false */
  disabled?: boolean;
  /** Override the country list. @default COUNTRIES */
  countries?: Country[];
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
 * `CountrySelect` — a searchable country picker returning the ISO 3166-1 alpha-2 code.
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
  "aria-label": ariaLabel,
  className,
  ref,
}: CountrySelectProps) {
  const selectedCode = value?.toUpperCase();
  const selected = selectedCode
    ? countries.find((country) => country.code.toUpperCase() === selectedCode)
    : undefined;
  const triggerLabel = ariaLabel ?? (selected ? selected.name : placeholder);

  return (
    <Combobox
      items={countries}
      value={selected ?? null}
      onValueChange={(country) => {
        // Matches the prior behavior: picking a country always sets a code; there is no
        // "clear back to nothing selected" affordance on this control.
        if (country) onValueChange?.(country.code);
      }}
      isItemEqualToValue={(a: Country, b: Country) => a.code === b.code}
      itemToStringLabel={(country: Country) =>
        `${country.name} ${country.code}`
      }
      autoHighlight
      disabled={disabled}
    >
      <BaseCombobox.Trigger
        ref={ref}
        disabled={disabled}
        render={
          <Button
            variant="outline"
            aria-label={triggerLabel}
            className={cn("w-full justify-between font-normal", className)}
            data-slot="country-select"
          />
        }
      >
        <ComboboxValue className="flex-1">
          {(country: Country | null) =>
            country ? (
              <>
                <span aria-hidden>{country.flag}</span>
                <span className="truncate">{country.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )
          }
        </ComboboxValue>
        <ChevronsUpDown
          aria-hidden
          className="size-(--icon-default) shrink-0 opacity-(--opacity-dim)"
        />
      </BaseCombobox.Trigger>
      <ComboboxContent className="w-(--anchor-width) p-0">
        <ComboboxPopupInput
          aria-label="Search countries"
          placeholder="Search countries…"
        />
        <ComboboxEmpty>No country found.</ComboboxEmpty>
        <ComboboxList className="p-1">
          {(country: Country) => (
            <ComboboxItem
              key={country.code}
              value={country}
              data-slot="country-select-item"
            >
              <span aria-hidden>{country.flag}</span>
              <span className="truncate">{country.name}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

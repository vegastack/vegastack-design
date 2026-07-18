'use client';

import * as React from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/country-select` (dogfoods the registry).
import {
  CountrySelect,
  type Country,
} from '@/components/ui/country-select';

/**
 * Default example — a searchable country combobox pre-selected to the US (flag +
 * name on the trigger; the chosen row in the list carries a check),
 * alongside a disabled control to show the inert state.
 */
export function countrySelect() {
  const [value, setValue] = React.useState<string>('US');
  return (
    <Wrapper>
      <div className="w-64">
        <CountrySelect value={value} onValueChange={setValue} />
      </div>
      <div className="w-64">
        <CountrySelect value="FR" disabled />
      </div>
    </Wrapper>
  );
}

/** Empty state — nothing selected yet, so the trigger shows a muted placeholder. */
export function countrySelectEmpty() {
  const [value, setValue] = React.useState<string>();
  return (
    <Wrapper>
      <div className="w-64">
        <CountrySelect value={value} onValueChange={setValue} placeholder="Select your country" />
      </div>
    </Wrapper>
  );
}

/**
 * Selected vs. disabled — the same control with a chosen country (flag + name on the
 * trigger; the matching row carries a check) next to an inert, disabled instance.
 */
export function countrySelectVariants() {
  const [value, setValue] = React.useState<string>('US');
  return (
    <Wrapper>
      <div className="w-64">
        <CountrySelect value={value} onValueChange={setValue} />
      </div>
      <div className="w-64">
        <CountrySelect value="FR" disabled />
      </div>
    </Wrapper>
  );
}

/**
 * Custom dataset — pass a `countries` array to restrict (or extend) the offered list.
 * Here only the EU markets a billing flow supports are shown; the value is still the ISO code.
 */
export function countrySelectCustom() {
  const EU: Country[] = [
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  ];
  const [value, setValue] = React.useState<string>('DE');
  return (
    <Wrapper>
      <div className="w-64">
        <CountrySelect
          value={value}
          onValueChange={setValue}
          countries={EU}
          placeholder="Select EU country"
        />
      </div>
    </Wrapper>
  );
}

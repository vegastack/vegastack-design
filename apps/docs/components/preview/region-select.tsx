'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/region-select` (dogfoods the registry) → auto-scanned.
import {
  RegionSelect,
  getRegionsByCountry,
  hasRegions,
} from '@/components/ui/region-select';

/**
 * Default example — a searchable US-state combobox. Starts empty (placeholder);
 * picking a state shows its name on the trigger and a check beside
 * the chosen row in the list.
 */
export function regionSelect(): ReactNode {
  const [value, setValue] = React.useState('');
  return (
    <Wrapper>
      <div className="w-64">
        <RegionSelect country="US" value={value} onValueChange={setValue} />
      </div>
    </Wrapper>
  );
}

/** Different countries — US states, Canadian provinces, and Australian states/territories. */
export function regionSelectCountries(): ReactNode {
  return (
    <Wrapper>
      <CountryDemo country="US" placeholder="US state" initial="CA" />
      <CountryDemo country="CA" placeholder="Canadian province" initial="ON" />
      <CountryDemo country="AU" placeholder="Australian state" />
    </Wrapper>
  );
}

/**
 * States — a country without predefined subdivisions (`SG`) falls back to a
 * plain text input, and a pre-selected `disabled` control is inert.
 */
export function regionSelectStates(): ReactNode {
  const [fallback, setFallback] = React.useState('');
  return (
    <Wrapper>
      <div className="w-64">
        <RegionSelect
          country="SG"
          value={fallback}
          onValueChange={setFallback}
          placeholder="Enter region"
        />
      </div>
      <div className="w-64">
        <RegionSelect country="US" value="CA" disabled />
      </div>
    </Wrapper>
  );
}

/**
 * Toggle-to-clear — re-selecting the already-selected state fires
 * `onValueChange("")`, clearing the field back to its placeholder. The live
 * code badge echoes the current `value` so the empty-string reset is visible.
 */
export function regionSelectToggleClear(): ReactNode {
  const [value, setValue] = React.useState('CA');
  return (
    <Wrapper>
      <div className="flex w-64 flex-col gap-2">
        <RegionSelect
          country="US"
          value={value}
          onValueChange={setValue}
          aria-label="US state"
        />
        <p className="text-sm text-muted-foreground">
          value:{' '}
          <code className="font-mono text-foreground">
            {value === '' ? '"" (cleared)' : `"${value}"`}
          </code>
        </p>
      </div>
    </Wrapper>
  );
}

/**
 * Empty results — typing a query that matches no subdivision shows the
 * "No state found." message. Open the combobox and search e.g. "zzz".
 * The leading `MapPin` affordance marks the trigger as a location field.
 */
export function regionSelectEmptyResults(): ReactNode {
  const [value, setValue] = React.useState('');
  return (
    <Wrapper>
      <div className="w-64">
        <RegionSelect
          country="US"
          value={value}
          onValueChange={setValue}
          aria-label="US state"
        />
      </div>
    </Wrapper>
  );
}

/**
 * Data API — `hasRegions` / `getRegionsByCountry` drive the same dataset the
 * component reads. Here they decide the helper copy and a count, while the
 * live control consumes the looked-up subdivisions.
 */
export function regionSelectDataApi(): ReactNode {
  const [value, setValue] = React.useState('');
  const country = 'CA';
  const states = getRegionsByCountry(country);
  return (
    <Wrapper>
      <div className="flex w-64 flex-col gap-2">
        <RegionSelect
          country={country}
          value={value}
          onValueChange={setValue}
          aria-label="Canadian province"
          placeholder="Canadian province"
        />
        <p className="text-sm text-muted-foreground">
          {hasRegions(country)
            ? `getRegionsByCountry("${country}") → ${states.length} subdivisions`
            : `hasRegions("${country}") → free-text fallback`}
        </p>
      </div>
    </Wrapper>
  );
}

function CountryDemo({
  country,
  placeholder,
  initial = '',
}: {
  country: string;
  placeholder: string;
  initial?: string;
}): ReactNode {
  const [value, setValue] = React.useState(initial);
  return (
    <div className="w-56">
      <RegionSelect
        country={country}
        value={value}
        onValueChange={setValue}
        placeholder={placeholder}
      />
    </div>
  );
}

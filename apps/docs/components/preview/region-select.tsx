"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/region-select` (dogfoods the registry) → auto-scanned.
import { RegionSelect } from "@/components/ui/region-select";
// The dataset is its own registry item now (`shadcn add @vegastack/geo-data`), installed once and
// shared with CountrySelect (audit B8-02 / decision D27).
import { getRegions, REGIONS } from "@/lib/geo-data";

/*
 * The control is `w-full` like every other form field: these examples constrain it with a
 * `max-w-*` PARENT, which is how a consumer sizes it inside a form column.
 */

/**
 * Default example — a searchable US-state combobox. Starts empty (placeholder);
 * picking a state shows its name on the trigger and a check beside
 * the chosen row in the list.
 */
export function regionSelect(): ReactNode {
  const [value, setValue] = React.useState("");
  return (
    <Wrapper>
      <div className="w-full max-w-(--panel-width-sm)">
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
  const [fallback, setFallback] = React.useState("");
  return (
    <Wrapper>
      <div className="w-full max-w-(--panel-width-sm)">
        <RegionSelect
          country="SG"
          value={fallback}
          onValueChange={setFallback}
          placeholder="Enter region"
        />
      </div>
      <div className="w-full max-w-(--panel-width-sm)">
        <RegionSelect country="US" value="CA" disabled />
      </div>
    </Wrapper>
  );
}

/**
 * Clearing — while a state is selected the trigger carries an explicit clear
 * control, which fires `onValueChange("")`. It replaces the old
 * re-select-to-clear toggle, which was invisible and reached the value through
 * a second code path (audit B8-02). Pass `clearable={false}` to remove it.
 */
export function regionSelectClearable(): ReactNode {
  const [value, setValue] = React.useState("CA");
  return (
    <Wrapper>
      <div className="flex w-full max-w-(--panel-width-sm) flex-col gap-2">
        <RegionSelect
          country="US"
          value={value}
          onValueChange={setValue}
          aria-label="US state"
        />
        <p className="text-sm text-muted-foreground">
          value:{" "}
          <code className="font-mono text-foreground">
            {value === "" ? '"" (cleared)' : `"${value}"`}
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
  const [value, setValue] = React.useState("");
  return (
    <Wrapper>
      <div className="w-full max-w-(--panel-width-sm)">
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
 * Data API — `getRegions` and the `REGIONS` map are the `geo-data` item's exports,
 * the same dataset the component reads. Here they decide the helper copy and a
 * count, while the live control consumes the looked-up subdivisions.
 */
export function regionSelectDataApi(): ReactNode {
  const [value, setValue] = React.useState("");
  const country = "CA";
  const states = getRegions(country);
  return (
    <Wrapper>
      <div className="flex w-full max-w-(--panel-width-sm) flex-col gap-2">
        <RegionSelect
          country={country}
          value={value}
          onValueChange={setValue}
          aria-label="Canadian province"
          placeholder="Canadian province"
        />
        <p className="text-sm text-muted-foreground">
          {country in REGIONS
            ? `getRegions("${country}") → ${states.length} subdivisions`
            : `getRegions("${country}") → [] (free-text fallback)`}
        </p>
      </div>
    </Wrapper>
  );
}

function CountryDemo({
  country,
  placeholder,
  initial = "",
}: {
  country: string;
  placeholder: string;
  initial?: string;
}): ReactNode {
  const [value, setValue] = React.useState(initial);
  return (
    <div className="w-full max-w-(--panel-width-sm)">
      <RegionSelect
        country={country}
        value={value}
        onValueChange={setValue}
        placeholder={placeholder}
      />
    </div>
  );
}

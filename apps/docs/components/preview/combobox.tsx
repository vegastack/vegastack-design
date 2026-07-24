"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/combobox` (dogfoods the registry) → auto-scanned.
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxStatus,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxCollection,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxValue,
  useComboboxFilteredItems,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const FONTS = ["Sans-serif", "Serif", "Monospace", "Cursive", "Fantasy"];

/**
 * Basic — a flat, filterable list. Type to narrow; `ComboboxEmpty` announces a miss. Uses the
 * recommended function-child rendering on `ComboboxList` (Base UI implicitly wraps it in a
 * `Collection`) so typing actually filters — static `ComboboxItem` children are NOT auto-filtered.
 */
export function combobox(): ReactNode {
  return (
    <Wrapper>
      <Combobox items={FONTS}>
        <ComboboxInputGroup className="w-64">
          <ComboboxInput aria-label="Font family" placeholder="Search fonts…" />
          <ComboboxClear aria-label="Clear" />
          <ComboboxTrigger aria-label="Toggle fonts" />
        </ComboboxInputGroup>
        <ComboboxContent>
          <ComboboxEmpty>No fonts found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Wrapper>
  );
}

const TIMEZONE_GROUPS = [
  {
    label: "North America",
    items: ["Eastern (EST)", "Central (CST)", "Pacific (PST)"],
  },
  { label: "Europe", items: ["Greenwich (GMT)", "Central European (CET)"] },
  { label: "Asia", items: ["Japan (JST)", "India (IST)"] },
];

/**
 * Grouped items via `useComboboxFilteredItems` — each group's items come from the FILTERED hook
 * result (not the original static array), so typing narrows within and across groups. See the
 * hook's JSDoc in combobox.tsx for why `ComboboxGroup`'s own `items` prop can't do this alone.
 */
function GroupedTimezoneItems() {
  const groups = useComboboxFilteredItems<(typeof TIMEZONE_GROUPS)[number]>();
  return (
    <>
      {groups.map((group) => (
        <ComboboxGroup key={group.label} items={group.items}>
          <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
          <ComboboxCollection>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxGroup>
      ))}
    </>
  );
}

export function comboboxGroups(): ReactNode {
  return (
    <Wrapper>
      <Combobox items={TIMEZONE_GROUPS} defaultValue="Eastern (EST)">
        <ComboboxInputGroup className="w-64">
          <ComboboxInput
            aria-label="Timezone"
            placeholder="Search timezones…"
          />
          <ComboboxTrigger aria-label="Toggle timezones" />
        </ComboboxInputGroup>
        <ComboboxContent>
          <ComboboxEmpty>No timezones found.</ComboboxEmpty>
          <ComboboxList>
            <GroupedTimezoneItems />
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Wrapper>
  );
}

const FRUITS = [
  "Apple",
  "Apricot",
  "Banana",
  "Blueberry",
  "Cherry",
  "Cranberry",
  "Date",
  "Fig",
];

/**
 * Simulated async search — a controlled `inputValue` drives a fake network request
 * (`setTimeout`); `filteredItems` is Base UI's escape hatch for externally-controlled filtering
 * (bypasses the built-in `Intl.Collator` match), so the results shown always match what the
 * "server" returned. `ComboboxStatus` announces the in-flight state with our `Spinner`; the
 * "Reset" button clears the query and simulated results back to the initial list.
 */
function ComboboxAsyncDemo() {
  const [inputValue, setInputValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<string[]>(FRUITS);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  function search(query: string) {
    setLoading(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const normalized = query.trim().toLowerCase();
      setResults(
        normalized === ""
          ? FRUITS
          : FRUITS.filter((fruit) => fruit.toLowerCase().includes(normalized)),
      );
      setLoading(false);
    }, 600);
  }

  return (
    <div className="flex w-64 flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => {
          setInputValue("");
          search("");
        }}
      >
        <RefreshCw />
        Reset
      </Button>
      <Combobox
        items={FRUITS}
        filteredItems={results}
        inputValue={inputValue}
        onInputValueChange={(value) => {
          setInputValue(value);
          search(value);
        }}
      >
        <ComboboxInputGroup>
          <ComboboxInput
            aria-label="Search fruit"
            placeholder="Search fruit…"
          />
          <ComboboxClear aria-label="Clear" />
          <ComboboxTrigger aria-label="Toggle fruit" />
        </ComboboxInputGroup>
        <ComboboxContent>
          <ComboboxStatus>
            {loading ? (
              <>
                <Spinner size="inherit" label="" />
                Searching…
              </>
            ) : null}
          </ComboboxStatus>
          <ComboboxEmpty>{loading ? null : "No fruit found."}</ComboboxEmpty>
          <ComboboxList>
            {loading
              ? null
              : results.map((item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export function comboboxLoading(): ReactNode {
  return (
    <Wrapper>
      <ComboboxAsyncDemo />
    </Wrapper>
  );
}

const LABELS: Record<string, string> = {
  bug: "Bug",
  feature: "Feature",
  docs: "Documentation",
  design: "Design",
  urgent: "Urgent",
};
const LABEL_KEYS = Object.keys(LABELS);

/**
 * Multiple selection with chips — `multiple` collects several values into an array.
 * `ComboboxChips` wraps the selected-value chips AND the input together; `ComboboxValue`'s
 * function-child renders one `ComboboxChip` per selected value, each with a `ComboboxChipRemove`.
 * `ComboboxClear` clears the whole selection.
 */
export function comboboxMultiple(): ReactNode {
  return (
    <Wrapper>
      <Combobox multiple items={LABEL_KEYS} defaultValue={["bug", "docs"]}>
        <ComboboxInputGroup className="w-72">
          <ComboboxChips>
            <ComboboxValue>
              {(value: string[]) =>
                value.map((key) => (
                  <ComboboxChip key={key}>
                    {LABELS[key]}
                    <ComboboxChipRemove aria-label={`Remove ${LABELS[key]}`} />
                  </ComboboxChip>
                ))
              }
            </ComboboxValue>
            <ComboboxInput aria-label="Labels" placeholder="Add labels…" />
          </ComboboxChips>
          <ComboboxClear aria-label="Clear all labels" />
          <ComboboxTrigger aria-label="Toggle labels" />
        </ComboboxInputGroup>
        <ComboboxContent>
          <ComboboxEmpty>No labels found.</ComboboxEmpty>
          <ComboboxList>
            {(key: string) => (
              <ComboboxItem key={key} value={key}>
                {LABELS[key]}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Wrapper>
  );
}

/** A disabled root makes the whole field (input + trigger) inert. */
export function comboboxDisabled(): ReactNode {
  return (
    <Wrapper>
      <Combobox items={FONTS} disabled defaultValue="Serif">
        <ComboboxInputGroup className="w-64">
          <ComboboxInput aria-label="Font (disabled)" />
          <ComboboxTrigger aria-label="Toggle" />
        </ComboboxInputGroup>
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Wrapper>
  );
}

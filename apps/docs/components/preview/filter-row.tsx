"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { AddFilterMenu } from "@/components/ui/add-filter-menu";
import {
  DateRangeFilter,
  FilterBarFacet,
  type DateRangeFilterValue,
} from "@/components/ui/filter-bar";
import { FilterRow, type FilterRowChip } from "@/components/ui/filter-row";

type Opt = { id: string; name: string };
const optProps = {
  itemToKey: (o: Opt) => o.id,
  itemToStringLabel: (o: Opt) => o.name,
  isItemEqualToValue: (a: Opt, b: Opt) => a.id === b.id,
};

export function filterRow(): ReactNode {
  const [status, setStatus] = React.useState<Opt[]>([]);
  const [due, setDue] = React.useState<DateRangeFilterValue | null>(null);
  const [chips, setChips] = React.useState<FilterRowChip[]>(() => [
    {
      id: "category",
      label: "Category",
      value: "Downlights",
      onRemove: () => remove("category"),
    },
    {
      id: "ip",
      label: "IP rating",
      value: "IP65",
      source: "ai",
      onRemove: () => remove("ip"),
    },
    {
      id: "finish",
      label: "Finish",
      value: "Black",
      source: "ai",
      onRemove: () => remove("finish"),
    },
  ]);
  const [note, setNote] = React.useState(true);
  function remove(id: string) {
    setChips((all) => all.filter((chip) => chip.id !== id));
  }
  return (
    <Wrapper className="block p-4">
      <FilterRow
        addFilter={
          <AddFilterMenu fields={[{ key: "specs", label: "Specs" }]} />
        }
        facets={
          <>
            <FilterBarFacet<Opt, true>
              label="Status"
              multiple
              items={[
                { id: "draft", name: "Draft" },
                { id: "ready", name: "Ready" },
              ]}
              value={status}
              onValueChange={setStatus}
              {...optProps}
            />
            <DateRangeFilter
              label="Updated"
              value={due}
              onValueChange={setDue}
            />
          </>
        }
        chips={chips}
        aiNote={
          note
            ? {
                count: 2,
                unmatched: ["warehouse"],
                onUndo: () => {
                  setChips((all) => all.filter((chip) => chip.source !== "ai"));
                  setNote(false);
                },
                onDismiss: () => setNote(false),
              }
            : undefined
        }
        onClear={() => {
          setStatus([]);
          setDue(null);
          setChips([]);
          setNote(false);
        }}
      />
    </Wrapper>
  );
}

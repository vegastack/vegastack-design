"use client";

import { useState, type ReactNode } from "react";
import { CircleDot, Flag, ListFilterPlus, Tag, User } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
// Copied INTO apps/docs via `shadcn add @vegastack/filter-bar` (dogfoods the registry) → auto-scanned.
import {
  FilterBar,
  FilterBarFacet,
  FilterChip,
  type FilterBarFilter,
} from "@/components/ui/filter-bar";
import { NumberField } from "@/components/ui/number-field";

const ADD_OPTIONS = [
  { id: "status", label: "Status", icon: <CircleDot /> },
  { id: "priority", label: "Priority", icon: <Flag /> },
  { id: "assignee", label: "Assignee", icon: <User /> },
  { id: "label", label: "Label", icon: <Tag /> },
];

export function filterBar(): ReactNode {
  const [filters, setFilters] = useState<FilterBarFilter[]>([
    {
      id: "status",
      label: "Status",
      value: "In Progress",
      icon: <CircleDot />,
      // The one applied selection → neutral accent tint.
      active: true,
      onRemove: () => remove("status"),
    },
    {
      id: "priority",
      label: "Priority",
      value: "High",
      icon: <Flag />,
      // A staged, not-yet-applied filter → neutral.
      active: false,
      onRemove: () => remove("priority"),
    },
    {
      id: "assignee",
      label: "Assignee",
      value: "Any",
      icon: <User />,
      active: false,
      onRemove: () => remove("assignee"),
    },
  ]);

  function remove(id: string) {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }

  function add(id: string) {
    const option = ADD_OPTIONS.find((o) => o.id === id);
    if (!option || filters.some((f) => f.id === id)) return;
    setFilters((prev) => [
      ...prev,
      {
        id,
        label: option.label,
        value: "Any",
        icon: option.icon,
        active: false,
        onRemove: () => remove(id),
      },
    ]);
  }

  return (
    <Wrapper className="justify-start">
      <FilterBar
        aria-label="Task filters"
        className="max-w-2xl"
        filters={filters}
        addFilters={ADD_OPTIONS.filter(
          (o) => !filters.some((f) => f.id === o.id),
        )}
        onAddFilter={add}
        trailing={
          filters.length > 0 ? (
            <Button variant="ghost" onClick={() => setFilters([])}>
              Clear all
            </Button>
          ) : undefined
        }
      />
    </Wrapper>
  );
}

export function filterBarSearch(): ReactNode {
  const [query, setQuery] = useState("Regent");
  const [filters, setFilters] = useState<FilterBarFilter[]>([
    {
      id: "label",
      label: "Label",
      value: "bug",
      icon: <Tag />,
      active: true,
      onRemove: () =>
        setFilters((prev) => prev.filter((f) => f.id !== "label")),
    },
  ]);

  return (
    <Wrapper className="justify-start">
      <FilterBar
        aria-label="Task filters"
        className="max-w-2xl"
        filters={filters}
        addFilters={ADD_OPTIONS}
        onAddFilter={() => {}}
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search tasks…",
        }}
      />
    </Wrapper>
  );
}

export function filterBarSearchFirst(): ReactNode {
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const [filters, setFilters] = useState<FilterBarFilter[]>([
    {
      id: "label",
      label: "Label",
      value: "bug",
      icon: <Tag />,
      onRemove: () =>
        setFilters((prev) => prev.filter((f) => f.id !== "label")),
    },
  ]);

  return (
    <Wrapper className="flex-col items-stretch">
      <FilterBar
        aria-label="Task filters"
        className="max-w-2xl"
        searchPlacement="start"
        filters={filters}
        addFilters={ADD_OPTIONS}
        onAddFilter={() => {}}
        search={{
          value: query,
          onValueChange: setQuery,
          onValueCommitted: setCommitted,
          placeholder: "Search tasks…",
        }}
      />
      <p className="text-sm text-muted-foreground">
        Searching for: {committed === "" ? "everything" : `“${committed}”`}
      </p>
    </Wrapper>
  );
}

export function filterBarEmpty(): ReactNode {
  return (
    <Wrapper className="justify-start">
      <FilterBar
        aria-label="Task filters"
        className="max-w-2xl"
        filters={[]}
        addFilters={ADD_OPTIONS}
        onAddFilter={() => {}}
        search={{ value: "", onValueChange: () => {}, placeholder: "Search…" }}
      />
    </Wrapper>
  );
}

// Disabled add-option — the option stays visible but is removed from keyboard nav.
const ADD_OPTIONS_WITH_DISABLED = [
  { id: "status", label: "Status", icon: <CircleDot /> },
  { id: "priority", label: "Priority", icon: <Flag /> },
  // Only available on a higher plan → disabled, skipped by arrow-key navigation.
  { id: "assignee", label: "Assignee", icon: <User />, disabled: true },
];

/**
 * A presence-only (value-less) chip sits next to a regular label:value chip, and
 * the "Add filter" menu carries a disabled option that arrow keys skip.
 */
export function filterBarPresenceChip(): ReactNode {
  const [filters, setFilters] = useState<FilterBarFilter[]>([
    {
      id: "starred",
      // No `value` → a presence-only chip (the filter is either on or off).
      label: "Starred",
      icon: <Flag />,
      active: true,
      onRemove: () =>
        setFilters((prev) => prev.filter((f) => f.id !== "starred")),
    },
    {
      id: "status",
      label: "Status",
      value: "In Progress",
      icon: <CircleDot />,
      active: true,
      onRemove: () =>
        setFilters((prev) => prev.filter((f) => f.id !== "status")),
    },
  ]);

  return (
    <Wrapper className="justify-start">
      <FilterBar
        aria-label="Task filters"
        className="max-w-2xl"
        filters={filters}
        addFilters={ADD_OPTIONS_WITH_DISABLED}
        onAddFilter={() => {}}
      />
    </Wrapper>
  );
}

/**
 * The fully-custom `addFilterMenu` slot replaces the declarative menu with any
 * `DropdownMenu` tree — here a multi-select checkbox group with a label and
 * separator. The chip mirrors how many are selected.
 */
export function filterBarCustomMenu(): ReactNode {
  const LABELS = ["bug", "docs", "enhancement"];
  const [selected, setSelected] = useState<string[]>(["bug"]);

  function toggle(label: string) {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }

  const filters: FilterBarFilter[] =
    selected.length > 0
      ? [
          {
            id: "labels",
            label: "Labels",
            value:
              selected.length === 1
                ? selected[0]
                : `${selected.length} selected`,
            icon: <Tag />,
            active: true,
            onRemove: () => setSelected([]),
          },
        ]
      : [];

  return (
    <Wrapper className="justify-start">
      <FilterBar
        aria-label="Issue filters"
        className="max-w-2xl"
        filters={filters}
        addFilterMenu={
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className="border-dashed text-muted-foreground"
                >
                  <ListFilterPlus aria-hidden />
                  Labels
                </Button>
              }
            />
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by label</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LABELS.map((label) => (
                <DropdownMenuCheckboxItem
                  key={label}
                  checked={selected.includes(label)}
                  onCheckedChange={() => toggle(label)}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    </Wrapper>
  );
}

/**
 * Standalone {@link FilterChip}s outside a `FilterBar`: an active (neutral
 * `accent` selection tint) chip, a neutral inactive chip, and a presence-only chip with
 * no `value`. Useful for custom toolbars that lay chips out themselves.
 */
export function filterBarStandaloneChips(): ReactNode {
  return (
    <Wrapper className="flex-wrap justify-start gap-1.5">
      <FilterChip
        label="Status"
        value="In Progress"
        icon={<CircleDot />}
        active
        onRemove={() => {}}
      />
      <FilterChip
        label="Priority"
        value="High"
        icon={<Flag />}
        active={false}
        onRemove={() => {}}
      />
      <FilterChip
        label="Starred"
        icon={<Flag />}
        active
        removeLabel="Remove starred filter"
        onRemove={() => {}}
      />
    </Wrapper>
  );
}

const STATUS_OPTIONS = [
  { id: "open", name: "Open" },
  { id: "progress", name: "In progress" },
  { id: "review", name: "In review" },
  { id: "done", name: "Done" },
];

export function filterBarFacets(): ReactNode {
  const [status, setStatus] = useState([STATUS_OPTIONS[0]!]);
  const [owner, setOwner] = useState<{ id: string; name: string } | null>(null);
  return (
    <Wrapper className="justify-start">
      <FilterBar
        aria-label="Task filters"
        facets={
          <>
            <FilterBarFacet<{ id: string; name: string }, true>
              label="Status"
              multiple
              pinSelected
              items={STATUS_OPTIONS}
              value={status}
              onValueChange={setStatus}
              itemToKey={(s) => s.id}
              itemToStringLabel={(s) => s.name}
              isItemEqualToValue={(a, b) => a.id === b.id}
              searchLabel="Search statuses"
            />
            <FilterBarFacet
              label="Owner"
              removable
              onRemove={() => setOwner(null)}
              items={[
                { id: "ada", name: "Ada Lovelace" },
                { id: "grace", name: "Grace Hopper" },
              ]}
              value={owner}
              onValueChange={setOwner}
              itemToKey={(o) => o.id}
              itemToStringLabel={(o) => o.name}
              isItemEqualToValue={(a, b) => a.id === b.id}
              searchLabel="Search people"
            />
          </>
        }
      />
    </Wrapper>
  );
}

export function filterBarEditing(): ReactNode {
  const [active, setActive] = useState(true);
  const [range, setRange] = useState<{
    min: number | null;
    max: number | null;
  }>({
    min: 10,
    max: 40,
  });
  const text =
    range.min != null && range.max != null
      ? `${range.min}–${range.max} W`
      : range.min != null
        ? `≥ ${range.min} W`
        : range.max != null
          ? `≤ ${range.max} W`
          : "Any";
  // The same editor edits the chip and opens on it when "Wattage" is added back.
  const editor = (
    <div className="flex items-center gap-2 p-1">
      <NumberField
        aria-label="Minimum"
        className="w-24"
        value={range.min}
        onValueChange={(min) => setRange((r) => ({ ...r, min }))}
      />
      <span aria-hidden="true">–</span>
      <NumberField
        aria-label="Maximum"
        className="w-24"
        value={range.max}
        onValueChange={(max) => setRange((r) => ({ ...r, max }))}
      />
    </div>
  );
  return (
    <Wrapper className="justify-start">
      <FilterBar
        aria-label="Product filters"
        filters={
          active
            ? [
                {
                  id: "wattage",
                  label: "Wattage",
                  value: text,
                  onRemove: () => {
                    setActive(false);
                    setRange({ min: null, max: null });
                  },
                  editor,
                },
              ]
            : []
        }
        addFilters={active ? [] : [{ id: "wattage", label: "Wattage", editor }]}
        onAddFilter={() => setActive(true)}
      />
    </Wrapper>
  );
}

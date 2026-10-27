"use client";

import { useState, type ReactNode } from "react";
import {
  CircleDot,
  Columns3,
  Flag,
  List,
  ListFilterPlus,
  Tag,
  UserRound,
} from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
// Copied INTO apps/docs via `shadcn add @vegastack/filter-bar` (dogfoods the registry) → auto-scanned.
import {
  FilterBar,
  FilterBarFacet,
  FilterChip,
  type FilterBarFilter,
} from "@/components/ui/filter-bar";
import {
  FilterBuilder,
  GroupByPicker,
  SortBuilder,
  type FilterField,
  type FilterNode,
  type SortBuilderEntry,
} from "@/components/ui/filter-bar-managed";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberField } from "@/components/ui/number-field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ViewTabs, type ViewTabsView } from "@/components/ui/view-tabs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewToggle, type ListView } from "@/components/ui/view-toggle";

const ADD_OPTIONS = [
  { id: "status", label: "Status", icon: <CircleDot /> },
  { id: "priority", label: "Priority", icon: <Flag /> },
  { id: "assignee", label: "Assignee", icon: <UserRound /> },
  { id: "label", label: "Label", icon: <Tag /> },
];

type Option = { id: string; name: string };

const TOOLBAR_STATUSES: Option[] = [
  { id: "open", name: "Open" },
  { id: "progress", name: "In progress" },
  { id: "review", name: "In review" },
  { id: "done", name: "Done" },
];
const TOOLBAR_DUE: Option[] = [
  { id: "overdue", name: "Overdue" },
  { id: "today", name: "Today" },
  { id: "week", name: "This week" },
];
const TOOLBAR_PEOPLE: Option[] = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
];
const TOOLBAR_PRIORITIES: Option[] = [
  { id: "high", name: "High" },
  { id: "medium", name: "Medium" },
  { id: "low", name: "Low" },
];
const optionProps = {
  itemToKey: (o: Option) => o.id,
  itemToStringLabel: (o: Option) => o.name,
  isItemEqualToValue: (a: Option, b: Option) => a.id === b.id,
};

/**
 * The list toolbar: search (~320px), the Filters toggle, the view switch at the end;
 * the facets, "More" and "Clear" on the filter row the toggle shows (hidden until then — the toggle
 * carries the count). Scope tabs ("My tasks | Team") belong in the `PageHeader`'s `tabs`.
 */
export function filterBar(): ReactNode {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ListView>("list");
  const [status, setStatus] = useState<Option[]>([TOOLBAR_STATUSES[0]!]);
  const [due, setDue] = useState<Option | null>(null);
  const [assignee, setAssignee] = useState<Option | null>(null);
  const [priority, setPriority] = useState<Option[] | null>(null);

  return (
    <Wrapper className="flex-col items-stretch">
      <FilterBar
        aria-label="Task toolbar"
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search tasks",
        }}
        view={
          <ViewToggle
            value={view}
            onValueChange={setView}
            views={["list", "board"]}
          />
        }
        facets={
          <>
            <FilterBarFacet<Option, true>
              label="Status"
              multiple
              items={TOOLBAR_STATUSES}
              value={status}
              onValueChange={setStatus}
              {...optionProps}
            />
            <FilterBarFacet<Option>
              label="Due"
              items={TOOLBAR_DUE}
              value={due}
              onValueChange={setDue}
              {...optionProps}
            />
            <FilterBarFacet<Option>
              label="Assignee"
              items={TOOLBAR_PEOPLE}
              value={assignee}
              onValueChange={setAssignee}
              {...optionProps}
            />
            {priority != null ? (
              <FilterBarFacet<Option, true>
                label="Priority"
                multiple
                removable
                onRemove={() => setPriority(null)}
                items={TOOLBAR_PRIORITIES}
                value={priority}
                onValueChange={setPriority}
                {...optionProps}
              />
            ) : null}
          </>
        }
        addFilters={
          priority == null ? [{ id: "priority", label: "Priority" }] : []
        }
        onAddFilter={() => setPriority([])}
        onClear={() => {
          setStatus([]);
          setDue(null);
          setAssignee(null);
          setPriority(null);
        }}
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
        defaultFiltersOpen
        aria-label="Task filters"
        className="max-w-2xl"
        filters={filters}
        addFilters={ADD_OPTIONS}
        onAddFilter={() => {}}
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search tasks",
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
        defaultFiltersOpen
        aria-label="Task filters"
        className="max-w-2xl"
        filters={filters}
        addFilters={ADD_OPTIONS}
        onAddFilter={() => {}}
        search={{
          value: query,
          onValueChange: setQuery,
          onValueCommitted: setCommitted,
          placeholder: "Search tasks",
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
        defaultFiltersOpen
        aria-label="Task filters"
        className="max-w-2xl"
        filters={[]}
        addFilters={ADD_OPTIONS}
        onAddFilter={() => {}}
        search={{
          value: "",
          onValueChange: () => {},
          placeholder: "Search tasks",
        }}
      />
    </Wrapper>
  );
}

// Disabled add-option — the option stays visible but is removed from keyboard nav.
const ADD_OPTIONS_WITH_DISABLED = [
  { id: "status", label: "Status", icon: <CircleDot /> },
  { id: "priority", label: "Priority", icon: <Flag /> },
  // Only available on a higher plan → disabled, skipped by arrow-key navigation.
  { id: "assignee", label: "Assignee", icon: <UserRound />, disabled: true },
];

/**
 * A presence-only (value-less) chip sits next to a regular label:value chip, and
 * the "More" menu carries a disabled option that arrow keys skip.
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
      value: "In progress",
      icon: <CircleDot />,
      active: true,
      onRemove: () =>
        setFilters((prev) => prev.filter((f) => f.id !== "status")),
    },
  ]);

  return (
    <Wrapper className="justify-start">
      <FilterBar
        defaultFiltersOpen
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
        defaultFiltersOpen
        aria-label="Issue filters"
        className="max-w-2xl"
        filters={filters}
        addFilterMenu={
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="text-muted-foreground">
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
        value="In progress"
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
        defaultFiltersOpen
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
          : "Not set";
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
        defaultFiltersOpen
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

/** The same toolbar in a wide, a tablet and a phone column — it responds to its own width. */
export function filterBarBreakpoints(): ReactNode {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ListView>("list");
  const [status, setStatus] = useState<Option[]>([TOOLBAR_STATUSES[0]!]);
  const bar = (
    <FilterBar
      aria-label="Task toolbar"
      search={{
        value: query,
        onValueChange: setQuery,
        placeholder: "Search tasks",
      }}
      view={
        <ViewToggle
          value={view}
          onValueChange={setView}
          views={["list", "board"]}
        />
      }
      facets={
        <>
          <FilterBarFacet<Option, true>
            label="Status"
            multiple
            items={TOOLBAR_STATUSES}
            value={status}
            onValueChange={setStatus}
            {...optionProps}
          />
          <FilterBarFacet<Option>
            label="Assignee"
            items={TOOLBAR_PEOPLE}
            value={null}
            onValueChange={() => {}}
            {...optionProps}
          />
        </>
      }
      onClear={() => setStatus([])}
    />
  );
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      {[
        { label: "Desktop", width: "100%" },
        { label: "Tablet — icon-only Filters and view", width: 600 },
        { label: "Phone — search on its own row", width: 360 },
      ].map(({ label, width }) => (
        <div
          key={label}
          className="flex flex-col gap-2"
          style={{ maxWidth: width }}
        >
          <span className="text-xs text-muted-foreground">{label}</span>
          {bar}
        </div>
      ))}
    </Wrapper>
  );
}

/* ── A grid list: Filters (a builder), Sort and the View menu ───────────────────────────────── */

type GridGroup = Extract<FilterNode<string>, { type: "group" }>;

const GRID_FIELDS: FilterField<string>[] = [
  {
    key: "status",
    label: "Status",
    type: "text",
    operators: [
      { value: "is", label: "is" },
      { value: "is-not", label: "is not" },
    ],
  },
  {
    key: "owner",
    label: "Owner",
    type: "text",
    operators: [
      { value: "is", label: "is" },
      { value: "is-empty", label: "is empty", requiresValue: false },
    ],
  },
];
const GRID_SORTABLE = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "due", label: "Due" },
];
const GRID_COLUMNS = ["Name", "Status", "Owner", "Due", "Amount"];
const EMPTY_TREE: GridGroup = { type: "group", op: "and", children: [] };

/**
 * A grid list's toolbar: search, then Filters (a `FilterBuilder` in a popover), Sort (a
 * `SortBuilder`) and the View menu (Group, Fields, Row height, the view's own actions), with the
 * page's primary action in `actions`. Any change from the saved view shows "View changed · Save ·
 * Reset" in the chip row (`trailing`).
 */
export function filterBarGridToolbar(): ReactNode {
  const [query, setQuery] = useState("");
  const [tree, setTree] = useState<GridGroup>(EMPTY_TREE);
  const [sort, setSort] = useState<SortBuilderEntry[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [height, setHeight] = useState("short");
  const conditions = tree.children.length;
  const changed =
    conditions > 0 ||
    sort.length > 0 ||
    groups.length > 0 ||
    hidden.length > 0 ||
    height !== "short";
  const reset = () => {
    setTree(EMPTY_TREE);
    setSort([]);
    setGroups([]);
    setHidden([]);
    setHeight("short");
  };
  return (
    <Wrapper className="flex-col items-stretch">
      <FilterBar
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search records",
        }}
        filterBuilder={
          <FilterBuilder<string>
            vocabulary={GRID_FIELDS}
            value={tree}
            onValueChange={setTree}
          />
        }
        activeCount={conditions}
        sort={
          <SortBuilder
            vocabulary={GRID_SORTABLE}
            value={sort}
            onChange={setSort}
          />
        }
        sortCount={sort.length}
        group={
          <GroupByPicker
            vocabulary={GRID_SORTABLE}
            value={groups}
            onChange={setGroups}
          />
        }
        fields={
          <div className="flex flex-col gap-1">
            {GRID_COLUMNS.map((name) => (
              <label key={name} className="flex items-center gap-2 px-0.5 py-1">
                <Checkbox
                  checked={!hidden.includes(name)}
                  onCheckedChange={(checked) =>
                    setHidden((current) =>
                      checked
                        ? current.filter((entry) => entry !== name)
                        : [...current, name],
                    )
                  }
                />
                {name}
              </label>
            ))}
          </div>
        }
        density={
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[height]}
            onValueChange={(next) => {
              if (next[0]) setHeight(next[0]);
            }}
          >
            <ToggleGroupItem value="short">Short</ToggleGroupItem>
            <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
            <ToggleGroupItem value="tall">Tall</ToggleGroupItem>
          </ToggleGroup>
        }
        viewActions={
          <>
            <Button variant="ghost" size="sm" className="justify-start">
              Rename view
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Lock view
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Delete view
            </Button>
          </>
        }
        trailing={changed ? <ViewChanged onReset={reset} /> : undefined}
        actions={<Button size="sm">New record</Button>}
      />
    </Wrapper>
  );
}

/** "View changed · Save ▾ · Reset" — a saved view's unsaved changes, in the chip row. */
function ViewChanged({ onReset }: { onReset: () => void }) {
  return (
    <>
      <span className="text-sm text-muted-foreground">View changed</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm">
              Save
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Save for everyone</DropdownMenuItem>
          <DropdownMenuItem>Save as a new view</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" size="sm" onClick={onReset}>
        Reset
      </Button>
    </>
  );
}

/**
 * A saved view someone changed: the applied filter's chip and "View changed · Save ▾ · Reset" share
 * the one chip row under the toolbar — never a row of their own.
 */
export function filterBarViewChanged(): ReactNode {
  const [filters, setFilters] = useState<FilterBarFilter[]>([
    {
      id: "status",
      label: "Status",
      value: "Open",
      onRemove: () => setFilters([]),
    },
  ]);
  return (
    <Wrapper className="flex-col items-stretch">
      <FilterBar
        search={{
          value: "",
          onValueChange: () => {},
          placeholder: "Search records",
        }}
        filterBuilder={<p className="text-sm">Filter conditions</p>}
        filters={filters}
        trailing={<ViewChanged onReset={() => setFilters([])} />}
      />
    </Wrapper>
  );
}

const TABLE_VIEWS: ViewTabsView[] = [
  { id: "all", name: "All records", kind: "grid", scope: "shared" },
  { id: "status", name: "By status", kind: "board", scope: "shared" },
  { id: "mine", name: "My follow-ups", kind: "grid", scope: "personal" },
];

/**
 * A table's one-row chrome: the view tabs lead (`leading`), then an icon search that expands
 * into the field (`searchMode="icon"`), Filters, Sort, the View menu and the primary action. On a
 * phone-width window the View menu opens as a bottom sheet.
 */
export function filterBarTableChrome(): ReactNode {
  const [view, setView] = useState("all");
  const [query, setQuery] = useState("");
  const [tree, setTree] = useState<GridGroup>(EMPTY_TREE);
  const [sort, setSort] = useState<SortBuilderEntry[]>([]);
  const [height, setHeight] = useState("short");
  return (
    <Wrapper className="flex-col items-stretch">
      <FilterBar
        leading={
          <ViewTabs views={TABLE_VIEWS} value={view} onValueChange={setView} />
        }
        searchMode="icon"
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search records",
        }}
        filterBuilder={
          <FilterBuilder<string>
            vocabulary={GRID_FIELDS}
            value={tree}
            onValueChange={setTree}
          />
        }
        activeCount={tree.children.length}
        sort={
          <SortBuilder
            vocabulary={GRID_SORTABLE}
            value={sort}
            onChange={setSort}
          />
        }
        sortCount={sort.length}
        density={
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[height]}
            onValueChange={(next) => {
              if (next[0]) setHeight(next[0]);
            }}
          >
            <ToggleGroupItem value="short">Short</ToggleGroupItem>
            <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
            <ToggleGroupItem value="tall">Tall</ToggleGroupItem>
          </ToggleGroup>
        }
        viewActions={
          <Button variant="ghost" size="sm" className="justify-start">
            Rename view
          </Button>
        }
        actions={<Button size="sm">New record</Button>}
      />
    </Wrapper>
  );
}

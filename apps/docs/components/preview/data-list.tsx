"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/data-list` (dogfoods the registry) → auto-scanned.
import { Lamp, Search, TriangleAlert } from "lucide-react";
import {
  DataList,
  rowActionsColumn,
  type DataListColumn,
  type DataListSection,
  type DataListView,
  type RowAction,
  type SortState,
} from "@/components/ui/data-list";
import { FilterBar } from "@/components/ui/filter-bar";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { PanelSearch, PanelSearchField } from "@/components/ui/panel-search";
import { MediaCard } from "@/components/ui/media-card";
import { DataListPager } from "@/components/ui/data-list-pager";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type Status = "active" | "invited" | "suspended";

interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  status: Status;
  amount: number;
}

const STATUS: Record<
  Status,
  { label: string; color: "success" | "info" | "destructive" }
> = {
  active: { label: "Active", color: "success" },
  invited: { label: "Invited", color: "info" },
  suspended: { label: "Suspended", color: "destructive" },
};

const people: Person[] = [
  {
    id: "1",
    name: "Ada Lovelace",
    email: "ada@vega.dev",
    role: "Engineer",
    status: "active",
    amount: 1280,
  },
  {
    id: "2",
    name: "Bea Arthur",
    email: "bea@vega.dev",
    role: "Designer",
    status: "invited",
    amount: 940,
  },
  {
    id: "3",
    name: "Cole Train",
    email: "cole@vega.dev",
    role: "Manager",
    status: "active",
    amount: 2150,
  },
  {
    id: "4",
    name: "Dax Shepard",
    email: "dax@vega.dev",
    role: "Engineer",
    status: "suspended",
    amount: 760,
  },
  {
    id: "5",
    name: "Eve Polastri",
    email: "eve@vega.dev",
    role: "Analyst",
    status: "active",
    amount: 1530,
  },
];

const columns: DataListColumn<Person>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    render: (p) => <span className="font-medium">{p.name}</span>,
  },
  {
    key: "email",
    header: "Email",
    render: (p) => <span className="text-muted-foreground">{p.email}</span>,
  },
  { key: "role", header: "Role", sortable: true },
  {
    key: "status",
    header: "Status",
    render: (p) => <Badge variant="secondary">{STATUS[p.status].label}</Badge>,
  },
  {
    key: "amount",
    header: "Amount",
    align: "end",
    sortable: true,
    render: (p) => (
      <span className="font-mono tabular-nums">
        ${p.amount.toLocaleString()}
      </span>
    ),
  },
];

function sortPeople(rows: Person[], sort: SortState | null): Person[] {
  if (!sort) return rows;
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[sort.key as keyof Person];
    const bv = b[sort.key as keyof Person];
    if (typeof av === "number" && typeof bv === "number")
      return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

export function dataList(): ReactNode {
  const [sort, setSort] = React.useState<SortState | null>({
    key: "name",
    direction: "asc",
  });
  return (
    <Wrapper className="block">
      <DataList
        columns={columns}
        data={sortPeople(people, sort)}
        getRowId={(p) => p.id}
        sort={sort}
        onSortChange={setSort}
      />
    </Wrapper>
  );
}

export function dataListFitting(): ReactNode {
  // A 320px pane. Name and Email keep their own columns; Role, Status and
  // Amount no longer fit, so they STACK into the Name cell (`mobile: "merge"`,
  // the default) instead of scrolling the table sideways. A column that opts
  // into `mobile: "hidden"` is dropped and counted instead — see
  // `dataListHiddenColumns`.
  const fitting: DataListColumn<Person>[] = columns.map((column) =>
    column.key === "name" ? { ...column, minWidth: 160 } : column,
  );
  return (
    <Wrapper className="justify-stretch">
      <div className="w-full max-w-80">
        <DataList
          aria-label="People at 320px"
          columns={fitting}
          data={people.slice(0, 3)}
          getRowId={(p) => p.id}
        />
      </div>
    </Wrapper>
  );
}

interface Invoice {
  id: string;
  ref: string;
  customer: string;
  email: string;
  status: Status;
  amount: number;
}

const invoices: Invoice[] = [
  {
    id: "1",
    ref: "INV-2026-00481",
    customer: "Northwind Traders",
    email: "accounts.payable@northwind-traders.example",
    status: "active",
    amount: 12_480,
  },
  {
    id: "2",
    ref: "INV-2026-00482",
    customer: "Contoso Pharmaceuticals",
    email: "billing@contoso-pharmaceuticals.example",
    status: "invited",
    amount: 940,
  },
  {
    id: "3",
    ref: "INV-2026-00483",
    customer: "Fabrikam",
    email: "finance@fabrikam.example",
    status: "suspended",
    amount: 2_150,
  },
];

export function dataListMonoFirst(): ReactNode {
  // A mono first column is one line in the mono face (`mono` implies
  // `nowrap`). The values merged under it do NOT inherit that: each wraps and
  // wears its own column's face, so a long email under an invoice number
  // breaks inside the cell instead of scrolling the table sideways.
  const invoiceColumns: DataListColumn<Invoice>[] = [
    { key: "ref", header: "Invoice", mono: true, minWidth: 150 },
    { key: "customer", header: "Customer" },
    { key: "email", header: "Billing email" },
    {
      key: "status",
      header: "Status",
      render: (i) => (
        <Badge variant="secondary">{STATUS[i.status].label}</Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "end",
      mono: true,
      render: (i) => `$${i.amount.toLocaleString("en-US")}`,
    },
  ];
  return (
    <Wrapper className="justify-stretch">
      <div className="w-full max-w-80">
        <DataList
          aria-label="Invoices at 320px"
          columns={invoiceColumns}
          data={invoices}
          getRowId={(i) => i.id}
        />
      </div>
    </Wrapper>
  );
}

export function dataListHiddenColumns(): ReactNode {
  // `mobile: "hidden"` drops a column that no longer fits instead of merging
  // it, and COUNTS it: "2 columns hidden" appears under the table, which is
  // described by that line. The table is sorted by Amount, one of the hidden
  // columns, so a second line states the order its header can no longer show.
  const hiddenColumns: DataListColumn<Person>[] = columns.map((column) =>
    column.key === "name"
      ? { ...column, minWidth: 160 }
      : column.key === "role" || column.key === "amount"
        ? { ...column, mobile: "hidden" }
        : column,
  );
  const [sort, setSort] = React.useState<SortState | null>({
    key: "amount",
    direction: "desc",
  });
  return (
    <Wrapper className="justify-stretch">
      <div className="w-full max-w-80">
        <DataList
          aria-label="People with hidden columns"
          columns={hiddenColumns}
          data={sortPeople(people, sort).slice(0, 3)}
          getRowId={(p) => p.id}
          sort={sort}
          onSortChange={setSort}
        />
      </div>
    </Wrapper>
  );
}

export function dataListSelectable(): ReactNode {
  const [selected, setSelected] = React.useState<Set<string>>(
    new Set(["1", "3"]),
  );
  const [sort, setSort] = React.useState<SortState | null>(null);
  return (
    <Wrapper className="block">
      <DataList
        columns={columns}
        data={sortPeople(people, sort)}
        getRowId={(p) => p.id}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        sort={sort}
        onSortChange={setSort}
      />
    </Wrapper>
  );
}

export function dataListClickable(): ReactNode {
  const [sort, setSort] = React.useState<SortState | null>({
    key: "name",
    direction: "asc",
  });
  const [lastActivated, setLastActivated] = React.useState<string | null>(null);
  return (
    <Wrapper className="block">
      <DataList
        columns={columns}
        data={sortPeople(people, sort)}
        getRowId={(p) => p.id}
        sort={sort}
        onSortChange={setSort}
        onRowClick={(person) => setLastActivated(person.name)}
        footer={
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {lastActivated
              ? `Activated: ${lastActivated}`
              : "Click a row, or Tab to its first cell and press Enter."}
          </p>
        }
      />
    </Wrapper>
  );
}

export function dataListLoading(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList
        columns={columns}
        data={[]}
        getRowId={(p) => p.id}
        loading
        loadingRows={4}
      />
    </Wrapper>
  );
}

export function dataListLoadMore(): ReactNode {
  const [count, setCount] = React.useState(3);
  const [loading, setLoading] = React.useState(false);
  return (
    <Wrapper className="block">
      <DataList
        columns={columns}
        data={people.slice(0, count)}
        getRowId={(p) => p.id}
        loadMore={{
          hasMore: count < people.length,
          loading,
          endLabel: "End of list",
          onLoadMore: () => {
            setLoading(true);
            setTimeout(() => {
              setCount((n) => n + 2);
              setLoading(false);
            }, 600);
          },
        }}
      />
    </Wrapper>
  );
}

export function dataListRowActions(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList
        columns={[
          ...columns,
          rowActionsColumn<Person>({
            getRowLabel: (p) => p.name,
            actions: (p) => [
              { label: "Edit", onSelect: () => {} },
              { label: "Open profile", render: <a href={`#${p.id}`} /> },
              { type: "separator" },
              {
                label: "Remove",
                destructive: true,
                disabled: p.status === "active",
                disabledReason: "Active members can't be removed",
                onSelect: () => {},
              },
            ],
          }),
        ]}
        data={people.slice(0, 4)}
        getRowId={(p) => p.id}
      />
    </Wrapper>
  );
}

export function dataListSections(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList
        columns={columns}
        data={people}
        getRowId={(p) => p.id}
        sections={[
          { id: "active", label: "Active" },
          { id: "invited", label: "Invited" },
          { id: "suspended", label: "Suspended" },
        ]}
        getRowSection={(p) => p.status}
        defaultGroupState={{ suspended: "collapsed" }}
      />
    </Wrapper>
  );
}

export function dataListRowLinks(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList
        columns={columns}
        data={people.slice(0, 4)}
        getRowId={(p) => p.id}
        getRowHref={(p) => `#person-${p.id}`}
        getRowLabel={(p) => p.name}
        selectable
      />
    </Wrapper>
  );
}

export function dataListEmpty(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList columns={columns} data={[]} getRowId={(p) => p.id} />
    </Wrapper>
  );
}

// First column renders its OWN focusable control (a link). Marking it
// `interactive` tells DataList NOT to inject its first-cell action button —
// keyboard activation comes from the in-cell link instead of a nested button.
const interactiveColumns: DataListColumn<Person>[] = [
  {
    key: "name",
    header: "Name",
    interactive: true,
    render: (p) => (
      <a
        href={`#person-${p.id}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {p.name}
      </a>
    ),
  },
  {
    key: "email",
    header: "Email",
    render: (p) => <span className="text-muted-foreground">{p.email}</span>,
  },
  { key: "role", header: "Role" },
];

export function dataListInteractiveColumn(): ReactNode {
  const [lastActivated, setLastActivated] = React.useState<string | null>(null);
  return (
    <Wrapper className="block">
      <DataList
        columns={interactiveColumns}
        data={people.slice(0, 4)}
        getRowId={(p) => p.id}
        onRowClick={(person) => setLastActivated(person.name)}
        footer={
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {lastActivated
              ? `Row activated: ${lastActivated}`
              : "Tab to the name link to activate by keyboard; click elsewhere on the row for mouse."}
          </p>
        }
      />
    </Wrapper>
  );
}

// The headline "Scope" story: the host owns search + paging and drops its own
// controls into the `toolbar` / `footer` slots, passing DataList the already
// filtered + paged rows. DataList itself owns no query/paging logic.
export function dataListComposed(): ReactNode {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(3);
  const [sort, setSort] = React.useState<SortState | null>({
    key: "name",
    direction: "asc",
  });

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? people.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q),
        )
      : people;
    return sortPeople(matched, sort);
  }, [query, sort]);

  // The pager clamps the page it DISPLAYS; the host clamps the page it SLICES,
  // so a search that shrinks the result never shows an empty page.
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  return (
    <Wrapper className="block">
      <DataList
        columns={columns}
        data={pageRows}
        getRowId={(p) => p.id}
        sort={sort}
        onSortChange={setSort}
        toolbar={
          <InputGroup className="max-w-xs">
            <InputGroupAddon>
              <Search className="size-4" aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search people…"
              value={query}
              aria-label="Search people"
              onChange={(e) => {
                setQuery(e.currentTarget.value);
                setPage(1);
              }}
            />
          </InputGroup>
        }
        footer={
          // `DataListPager` owns the footer's layout: its range, chooser and
          // page list wrap and narrow with the pane, so the footer fits a
          // 320px viewport instead of overflowing it.
          <DataListPager
            page={safePage}
            pageSize={pageSize}
            pageSizes={[3, 5]}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      />
    </Wrapper>
  );
}

export function dataListCustomEmpty(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList
        columns={columns}
        data={[]}
        getRowId={(p) => p.id}
        emptyState={
          <Empty className="border bg-card">
            <EmptyHeader>
              <EmptyMedia>
                <Search />
              </EmptyMedia>
              <EmptyTitle>No people match your filters</EmptyTitle>
              <EmptyDescription>
                Try clearing the search or adjusting the filters above.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm">
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        }
      />
    </Wrapper>
  );
}

interface Family {
  id: string;
  name: string;
  category: string;
  products: number;
  subfamilies: number;
  missing: number;
  image: string | null;
}

const IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect width='16' height='9' fill='%23d6d3d1'/><circle cx='8' cy='4.5' r='2.5' fill='%23a8a29e'/></svg>";

const FAMILIES: Family[] = [
  {
    id: "f1",
    name: "Aurora Downlight",
    category: "indoor",
    products: 8,
    subfamilies: 3,
    missing: 2,
    image: IMG,
  },
  {
    id: "f2",
    name: "Beacon Track",
    category: "indoor",
    products: 5,
    subfamilies: 1,
    missing: 0,
    image: null,
  },
  {
    id: "f3",
    name: "Cove Linear",
    category: "indoor",
    products: 12,
    subfamilies: 4,
    missing: 0,
    image: IMG,
  },
  {
    id: "f4",
    name: "Drift Pendant",
    category: "indoor",
    products: 3,
    subfamilies: 0,
    missing: 1,
    image: IMG,
  },
  {
    id: "f5",
    name: "Harbor Bollard",
    category: "outdoor",
    products: 6,
    subfamilies: 2,
    missing: 0,
    image: null,
  },
  {
    id: "f6",
    name: "Summit Flood",
    category: "outdoor",
    products: 9,
    subfamilies: 3,
    missing: 4,
    image: IMG,
  },
];

const SECTIONS: DataListSection[] = [
  { id: "indoor", label: "Indoor Luminaires" },
  { id: "outdoor", label: "Outdoor Luminaires" },
];

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

function MissingPill({ n }: { n: number }) {
  return n > 0 ? (
    <Badge variant="warning">
      <TriangleAlert aria-hidden />
      {plural(n, "missing spec", "missing specs")}
    </Badge>
  ) : null;
}

const COLUMNS: DataListColumn<Family>[] = [
  {
    key: "name",
    header: "Family",
    mobile: "visible",
    minWidth: 200,
    thumbnail: (f) => f.image,
    render: (f) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate">{f.name}</span>
        <MissingPill n={f.missing} />
      </span>
    ),
  },
  {
    key: "products",
    header: "Products",
    align: "end",
    minWidth: 96,
    mergedRender: (f) => plural(f.products, "product", "products"),
  },
  {
    key: "subfamilies",
    header: "Sub-families",
    align: "end",
    minWidth: 110,
    mergedRender: (f) => plural(f.subfamilies, "sub-family", "sub-families"),
  },
];

const ACTIONS = (): RowAction[] => [
  { label: "Copy link", onSelect: () => {} },
  { label: "Settings", onSelect: () => {} },
  { type: "separator" },
  { label: "Delete family", destructive: true, onSelect: () => {} },
];

const common = {
  "aria-label": "Families",
  columns: COLUMNS,
  data: FAMILIES,
  getRowId: (f: Family) => f.id,
  getRowLabel: (f: Family) => f.name,
  getRowHref: (f: Family) => `#${f.id}`,
  rowActions: ACTIONS,
  thumbnailFallback: <Lamp aria-hidden />,
};

/** The list view with a thumbnail column. */
export function dataListThumbnails(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList<Family> {...common} />
    </Wrapper>
  );
}

/** The grid view: one MediaCard per row. */
export function dataListGrid(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList<Family> {...common} view="grid" />
    </Wrapper>
  );
}

/** The grid view with groups: a heading and count over each group's cards. */
export function dataListGridGroups(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList<Family>
        {...common}
        view="grid"
        sections={SECTIONS}
        getRowSection={(f) => f.category}
      />
    </Wrapper>
  );
}

/** The grid view at `gridSize="lg"`: a 16:9 image on top. */
export function dataListGridLg(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList<Family> {...common} view="grid" gridSize="lg" />
    </Wrapper>
  );
}

/** A custom card through `renderCard`. */
export function dataListGridCustomCard(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList<Family>
        {...common}
        view="grid"
        renderCard={(f) => (
          <MediaCard
            href={`#${f.id}`}
            image={f.image}
            fallback={<Lamp aria-hidden />}
            title={f.name}
            meta={plural(f.products, "product", "products")}
            badge={<MissingPill n={f.missing} />}
            timestamp="2h ago"
          />
        )}
      />
    </Wrapper>
  );
}

/** The view toggle, in the FilterBar's view slot, remembered for the session. */
export function dataListViewToggle(): ReactNode {
  const [view, setView] = React.useState<DataListView>("grid");
  const [q, setQ] = React.useState("");
  const rows = FAMILIES.filter((f) =>
    f.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  return (
    <Wrapper className="block">
      <DataList<Family>
        {...common}
        data={rows}
        view={view}
        onViewChange={setView}
        viewStorageKey="docs-data-list-view-toggle"
        sections={SECTIONS}
        getRowSection={(f) => f.category}
        noResults={q ? { onClear: () => setQ("") } : undefined}
        toolbar={
          <FilterBar
            aria-label="Family filters"
            search={{
              value: q,
              onValueChange: setQ,
              placeholder: "Search families",
            }}
          />
        }
      />
    </Wrapper>
  );
}

interface Task {
  id: string;
  title: string;
  status: "open" | "in_progress" | "done";
  due: string;
}

const TASKS: Task[] = [
  {
    id: "t1",
    title: "Send quote to Arora Builders",
    status: "open",
    due: "Today",
  },
  { id: "t2", title: "Photograph Cove samples", status: "open", due: "Fri" },
  {
    id: "t3",
    title: "Review Summit spec sheet",
    status: "in_progress",
    due: "Tomorrow",
  },
  { id: "t4", title: "Close March PO", status: "done", due: "Mon" },
];

const LANES: DataListSection[] = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

/** The board view: sections become lanes, cards drag between them. */
export function dataListBoard(): ReactNode {
  const [tasks, setTasks] = React.useState(TASKS);
  const [view, setView] = React.useState<DataListView>("board");
  return (
    <Wrapper className="block">
      <DataList<Task>
        aria-label="Tasks"
        columns={[
          { key: "title", header: "Task", mobile: "visible", minWidth: 220 },
          { key: "due", header: "Due", minWidth: 96 },
        ]}
        data={tasks}
        getRowId={(t) => t.id}
        getRowLabel={(t) => t.title}
        sections={LANES}
        getRowSection={(t) => t.status}
        view={view}
        onViewChange={setView}
        views={["list", "board"]}
        viewStorageKey="docs-data-list-board"
        boardHeight="24rem"
        onMove={(task, _from, to) =>
          setTasks((all) =>
            all.map((t) =>
              t.id === task.id ? { ...t, status: to as Task["status"] } : t,
            ),
          )
        }
      />
    </Wrapper>
  );
}

/** Client sorting: click a header to cycle its order — ascending, descending, none. */
export function dataListSortable(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList
        aria-label="People, sortable"
        columns={columns}
        data={people}
        getRowId={(p) => p.id}
        sortMode="client"
      />
    </Wrapper>
  );
}

/** Highlighted rows: `highlightedIds` flashes rows the user just created or changed. */
export function dataListHighlighted(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList
        aria-label="People, one just added"
        columns={columns}
        data={people.slice(0, 4)}
        getRowId={(p) => p.id}
        highlightedIds={new Set(["2"])}
      />
    </Wrapper>
  );
}

/** No results: the list is empty because of a search, with a Clear filters action. */
export function dataListNoResults(): ReactNode {
  const [q, setQ] = React.useState("zzz");
  const rows = people.filter((p) =>
    p.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  return (
    <Wrapper className="block">
      <DataList
        aria-label="People search"
        columns={columns}
        data={rows}
        getRowId={(p) => p.id}
        noResults={q ? { onClear: () => setQ("") } : undefined}
        toolbar={
          <FilterBar
            aria-label="People filters"
            search={{
              value: q,
              onValueChange: setQ,
              placeholder: "Search people",
            }}
          />
        }
      />
    </Wrapper>
  );
}

/** Row actions with submenus: an action with `items` opens a submenu. */
export function dataListRowActionSubmenu(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList
        aria-label="People with submenus"
        columns={columns.slice(0, 3)}
        data={people.slice(0, 3)}
        getRowId={(p) => p.id}
        getRowLabel={(p) => p.name}
        rowActions={() => [
          { label: "Open", onSelect: () => {} },
          { label: "Copy link", onSelect: () => {} },
          {
            label: "Change status",
            items: [
              { label: "Active", onSelect: () => {} },
              { label: "Invited", onSelect: () => {} },
              { label: "Suspended", onSelect: () => {} },
            ],
          },
          {
            label: "Assign",
            items: [
              { label: "Ada Lovelace", onSelect: () => {} },
              { label: "Cole Train", onSelect: () => {} },
            ],
          },
          { type: "separator" },
          { label: "Remove", destructive: true, onSelect: () => {} },
        ]}
      />
    </Wrapper>
  );
}

interface WorkItem {
  id: string;
  title: string;
  project: string;
  customer: string;
  status: "todo" | "doing" | "review" | "done";
  due: number;
  priority?: "urgent" | "high" | "medium" | "low";
  owner: string;
  meeting?: boolean;
}

const DAY = 86_400_000;
const WORK: WorkItem[] = [
  {
    id: "w1",
    title: "Send the revised lighting schedule",
    project: "Harbour Tower",
    customer: "Acme Build",
    status: "todo",
    due: -1,
    priority: "urgent",
    owner: "Priya Shah",
    meeting: true,
  },
  {
    id: "w2",
    title: "Confirm the fixture count for level 3",
    project: "Harbour Tower",
    customer: "Acme Build",
    status: "todo",
    due: 0,
    priority: "high",
    owner: "Manoj Kumar",
  },
  {
    id: "w3",
    title: "Draft the lobby pendant quote",
    project: "Riverside",
    customer: "Northwind",
    status: "doing",
    due: 3,
    owner: "Alex Lee",
  },
  {
    id: "w4",
    title: "Share the photometric report",
    project: "Riverside",
    customer: "Northwind",
    status: "done",
    due: -3,
    owner: "Alex Lee",
  },
];

const WORK_LANES: DataListSection[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "review", label: "In review" },
  { id: "done", label: "Done" },
];

/**
 * The board view with BoardCard content (`boardCard`), "+ Add task" per lane (`onAddToSection`),
 * an empty lane, a collapsible lane, and card actions with a submenu.
 */
export function dataListBoardCards(): ReactNode {
  const [items, setItems] = React.useState(WORK);
  const [done, setDone] = React.useState<ReadonlySet<string>>(new Set(["w4"]));
  return (
    <Wrapper className="block">
      <DataList<WorkItem>
        aria-label="Work"
        view="board"
        boardHeight="28rem"
        columns={[{ key: "title", header: "Task", mobile: "visible" }]}
        data={items}
        getRowId={(t) => t.id}
        getRowLabel={(t) => t.title}
        sections={WORK_LANES}
        getRowSection={(t) => t.status}
        sectionCountLabel={(n) => `${n} ${n === 1 ? "task" : "tasks"}`}
        boardCard={(t) => ({
          title: t.title,
          context: `${t.project} · ${t.customer}`,
          done: done.has(t.id),
          onDoneChange: (next) =>
            setDone((prev) => {
              const out = new Set(prev);
              if (next) out.add(t.id);
              else out.delete(t.id);
              return out;
            }),
          due: new Date(Date.now() + t.due * DAY),
          priority: t.priority,
          assignee: { name: t.owner },
        })}
        rowActions={() => [
          { label: "Open", onSelect: () => {} },
          {
            label: "Change priority",
            items: [
              { label: "Urgent", onSelect: () => {} },
              { label: "High", onSelect: () => {} },
            ],
          },
          { type: "separator" },
          { label: "Cancel task", destructive: true, onSelect: () => {} },
        ]}
        onAddToSection={() => {}}
        addLabel="Add task"
        onMove={(task, _from, to) =>
          setItems((all) =>
            all.map((t) =>
              t.id === task.id ? { ...t, status: to as WorkItem["status"] } : t,
            ),
          )
        }
      />
    </Wrapper>
  );
}

/** The board view while loading: each lane shows skeleton cards; one lane is still fetching. */
export function dataListBoardLoading(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList<WorkItem>
        aria-label="Work, loading"
        view="board"
        boardHeight="22rem"
        columns={[{ key: "title", header: "Task", mobile: "visible" }]}
        data={WORK.filter((t) => t.status !== "doing")}
        getRowId={(t) => t.id}
        getRowLabel={(t) => t.title}
        sections={WORK_LANES.map((lane) =>
          lane.id === "doing" ? { ...lane, loading: true } : lane,
        )}
        getRowSection={(t) => t.status}
        boardCard={(t) => ({ title: t.title, context: t.project })}
      />
    </Wrapper>
  );
}

const MEMBERS = [
  "Ada Lovelace",
  "Alan Turing",
  "Grace Hopper",
  "Katherine Johnson",
  "Linus Torvalds",
];

/** The searched member list a `submenu` slot renders: a `PanelSearch` row leads plain menu items. */
function AssignSubmenu({ onAssign }: { onAssign: (name: string) => void }) {
  const [query, setQuery] = React.useState("");
  const matches = MEMBERS.filter((m) =>
    m.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <PanelSearch>
        <PanelSearchField
          aria-label="Search members"
          placeholder="Search members"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Keep the menu's typeahead from swallowing the letters typed into the field.
          onKeyDown={(e) => e.stopPropagation()}
        />
      </PanelSearch>
      {matches.length === 0 ? (
        <DropdownMenuItem disabled>No members</DropdownMenuItem>
      ) : (
        matches.map((m) => (
          <DropdownMenuItem key={m} onClick={() => onAssign(m)}>
            {m}
          </DropdownMenuItem>
        ))
      )}
    </>
  );
}

/** A row action whose submenu is custom content — here a searchable member list (`submenu`). */
export function dataListRowActionSearchSubmenu(): ReactNode {
  return (
    <Wrapper className="block">
      <DataList
        columns={columns}
        data={people.slice(0, 4)}
        getRowId={(p) => p.id}
        getRowLabel={(p) => p.name}
        rowActions={() => [
          { label: "Open", onSelect: () => {} },
          { label: "Assign", submenu: <AssignSubmenu onAssign={() => {}} /> },
          { type: "separator" },
          { label: "Remove", destructive: true, onSelect: () => {} },
        ]}
      />
    </Wrapper>
  );
}

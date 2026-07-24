"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/data-list` (dogfoods the registry) → auto-scanned.
import { Search } from "lucide-react";
import {
  DataList,
  type DataListColumn,
  type SortState,
} from "@/components/ui/data-list";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    render: (p) => (
      <Badge variant="subtle" intent={STATUS[p.status].color} dot size="sm">
        {STATUS[p.status].label}
      </Badge>
    ),
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
          <p className="text-base text-muted-foreground" aria-live="polite">
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
        className="font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
          <p className="text-base text-muted-foreground" aria-live="polite">
            {lastActivated
              ? `Row activated: ${lastActivated}`
              : "Tab to the name link to activate by keyboard; click elsewhere on the row for mouse."}
          </p>
        }
      />
    </Wrapper>
  );
}

const PAGE_SIZE = 3;

// The headline "Scope" story: the host owns search + paging and drops its own
// controls into the `toolbar` / `footer` slots, passing DataList the already
// filtered + paged rows. DataList itself owns no query/paging logic.
export function dataListComposed(): ReactNode {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
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

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
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
          <Input
            type="search"
            placeholder="Search people…"
            value={query}
            prefix={<Search className="size-(--icon-default)" aria-hidden />}
            aria-label="Search people"
            containerClassName="max-w-xs"
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setPage(0);
            }}
          />
        }
        footer={
          <div className="flex items-center justify-between">
            <p className="text-base text-muted-foreground" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="text-base tabular-nums text-muted-foreground">
                Page {safePage + 1} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
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
          <Empty size="sm" surface="card">
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

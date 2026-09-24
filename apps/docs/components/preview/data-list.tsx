"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/data-list` (dogfoods the registry) → auto-scanned.
import { Search } from "lucide-react";
import {
  DataList,
  rowActionsColumn,
  type DataListColumn,
  type SortState,
} from "@/components/ui/data-list";
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

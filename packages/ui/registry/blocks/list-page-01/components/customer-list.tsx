// @vegastack list-page-01@0.20.0 sha256-z7H8gARnB3A2N0djTr6+/gg+CgebMo6DPZZpdyE+o0A=

"use client";

import * as React from "react";
import {
  LayoutGrid,
  List,
  SearchX,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DataList,
  rowActionsColumn,
  type DataListColumn,
} from "@/components/ui/data-list";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FilterBar, FilterBarFacet } from "@/components/ui/filter-bar";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { LoadMore } from "@/components/ui/load-more";
import { RelativeTime } from "@/components/ui/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  CURRENT_USER,
  CUSTOMERS,
  PAGE_SIZE,
  type Customer,
} from "./sample-customers";

type View = "list" | "grid";
type Scope = "mine" | "team";
type Status = Customer["status"];

const STATUSES: Status[] = ["Active", "Prospect", "Paused"];
const STATUS_BADGE: Record<Status, BadgeVariant> = {
  Active: "success",
  Prospect: "info",
  Paused: "outline",
};
const INDUSTRIES: Customer["industry"][] = ["Hospitality", "Retail", "Offices"];

/** Props for {@link CustomerList}. */
export interface CustomerListProps {
  /**
   * Every customer the list can show. Replace with your paged API.
   * @default the sample customers
   */
  customers?: Customer[];
  /**
   * Where the data stands: the first load, a failed load, or ready.
   * @default "ready"
   */
  status?: "loading" | "error" | "ready";
  /**
   * Called by "Try again" after a failed load.
   * @default undefined
   */
  onRetry?: () => void;
  /**
   * The view to open with. Keep the last choice per person, e.g. in `sessionStorage`.
   * @default "list"
   */
  defaultView?: View;
}

const customerHref = (customer: Customer) => `/customers/${customer.id}`;

/**
 * The customer list: a `FilterBar` (search first, a Status facet, a Mine | Team switch and a
 * Grid | List view switch) over the same records as a `DataList` or a grid of whole-tile links
 * grouped by industry, paged with Load more. Three empty tiers: nothing yet, no matches (with
 * "Clear filters"), and a failed load (with "Try again").
 *
 * @example
 * <CustomerList customers={customers} status={isError ? "error" : "ready"} onRetry={refetch} />
 */
export function CustomerList({
  customers = CUSTOMERS,
  status = "ready",
  onRetry,
  defaultView = "list",
}: CustomerListProps) {
  const [view, setView] = React.useState<View>(defaultView);
  const [scope, setScope] = React.useState<Scope>("team");
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<Status | null>(null);
  const [pages, setPages] = React.useState(1);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const inScope = customers.filter(
    (c) => scope === "team" || c.owner === CURRENT_USER,
  );
  const needle = query.trim().toLowerCase();
  const matching = inScope.filter(
    (c) =>
      (statusFilter === null || c.status === statusFilter) &&
      (needle === "" ||
        c.name.toLowerCase().includes(needle) ||
        c.city.toLowerCase().includes(needle)),
  );
  const shown = matching.slice(0, pages * PAGE_SIZE);
  const hasMore = shown.length < matching.length;
  const filtering = needle !== "" || statusFilter !== null;

  function clearFilters() {
    setQuery("");
    setStatusFilter(null);
    setPages(1);
  }

  // Stand-in for fetching the next page.
  function loadMore() {
    setLoadingMore(true);
    window.setTimeout(() => {
      setPages((n) => n + 1);
      setLoadingMore(false);
    }, 500);
  }

  const columns: DataListColumn<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (c) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{c.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {c.city}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => <Badge variant={STATUS_BADGE[c.status]}>{c.status}</Badge>,
    },
    {
      key: "projects",
      header: "Projects",
      className: "text-end tabular-nums",
      headerClassName: "text-end",
      render: (c) => c.projects,
    },
    {
      key: "updated",
      header: "Updated",
      render: (c) => (
        <RelativeTime date={c.updatedAt} className="text-muted-foreground" />
      ),
    },
    rowActionsColumn<Customer>({
      getRowLabel: (c) => c.name,
      actions: (c) => [
        { label: "Edit", render: <a href={`${customerHref(c)}/edit`} /> },
        { label: "Archive", destructive: true, onSelect: () => {} },
      ],
    }),
  ];

  let body: React.ReactNode;
  if (status === "error") {
    body = (
      <Empty className="border border-dashed" role="alert">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert aria-hidden className="text-destructive-text" />
          </EmptyMedia>
          <EmptyTitle render={<h2 />}>Couldn’t load customers.</EmptyTitle>
          <EmptyDescription>
            Check your connection, then try again.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  } else if (status === "ready" && inScope.length === 0) {
    body = (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersRound aria-hidden />
          </EmptyMedia>
          <EmptyTitle render={<h2 />}>
            {scope === "mine"
              ? "You have no customers yet"
              : "No customers yet"}
          </EmptyTitle>
          <EmptyDescription>
            Customers you add show up here, with their projects and status.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <a href="/customers/new" className={buttonVariants()}>
            New customer
          </a>
        </EmptyContent>
      </Empty>
    );
  } else if (status === "ready" && matching.length === 0) {
    body = (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX aria-hidden />
          </EmptyMedia>
          <EmptyTitle render={<h2 />}>No matches</EmptyTitle>
          <EmptyDescription>
            No customer matches these filters.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </EmptyContent>
      </Empty>
    );
  } else if (view === "list") {
    body = (
      <DataList<Customer>
        aria-label="Customers"
        columns={columns}
        data={shown}
        getRowId={(c) => c.id}
        getRowHref={customerHref}
        loading={status === "loading"}
        loadMore={
          status === "ready"
            ? { hasMore, loading: loadingMore, onLoadMore: loadMore }
            : undefined
        }
      />
    );
  } else {
    body = (
      <div className="@container flex flex-col gap-8">
        {status === "loading" ? (
          <div
            aria-busy="true"
            className="grid gap-3 @sm:grid-cols-2 @4xl:grid-cols-3"
          >
            <span className="sr-only">Loading customers</span>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          INDUSTRIES.map((industry) => {
            const tiles = shown.filter((c) => c.industry === industry);
            if (tiles.length === 0) return null;
            const headingId = `list-page-01-${industry.toLowerCase()}`;
            return (
              <section
                key={industry}
                aria-labelledby={headingId}
                className="flex flex-col gap-3"
              >
                <h2
                  id={headingId}
                  className="font-heading text-base font-medium"
                >
                  {industry}
                </h2>
                <ItemGroup
                  aria-labelledby={headingId}
                  className="grid gap-3 @sm:grid-cols-2 @4xl:grid-cols-3"
                >
                  {tiles.map((c) => (
                    <Item
                      key={c.id}
                      variant="outline"
                      render={<a href={customerHref(c)} />}
                    >
                      <ItemContent>
                        <ItemTitle>{c.name}</ItemTitle>
                        <ItemDescription>
                          {c.city} ·{" "}
                          <span className="tabular-nums">{c.projects}</span>{" "}
                          {c.projects === 1 ? "project" : "projects"}
                        </ItemDescription>
                      </ItemContent>
                      <Badge variant={STATUS_BADGE[c.status]}>{c.status}</Badge>
                    </Item>
                  ))}
                </ItemGroup>
              </section>
            );
          })
        )}
        {status === "ready" ? (
          <LoadMore
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <FilterBar
        aria-label="Customer filters"
        searchPlacement="start"
        search={{
          value: query,
          onValueChange: (value) => {
            setQuery(value);
            setPages(1);
          },
          placeholder: "Search customers",
        }}
        trailing={
          <div className="flex flex-wrap items-center gap-2">
            <FilterBarFacet<{ id: Status; name: Status }>
              label="Status"
              items={STATUSES.map((st) => ({ id: st, name: st }))}
              value={
                statusFilter ? { id: statusFilter, name: statusFilter } : null
              }
              onValueChange={(item) => {
                setStatusFilter(item ? item.id : null);
                setPages(1);
              }}
              itemToKey={(item) => item.id}
              itemToStringLabel={(item) => item.name}
              searchLabel="Search statuses"
            />
            {filtering ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
            <ToggleGroup
              variant="outline"
              size="sm"
              aria-label="Owner"
              deselectable={false}
              value={[scope]}
              onValueChange={(value) => {
                if (value[0]) setScope(value[0] as Scope);
                setPages(1);
              }}
            >
              <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
              <ToggleGroupItem value="team">Team</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
              variant="outline"
              size="sm"
              aria-label="View"
              deselectable={false}
              value={[view]}
              onValueChange={(value) => {
                if (value[0]) setView(value[0] as View);
              }}
            >
              <ToggleGroupItem value="grid" aria-label="Grid">
                <LayoutGrid />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List">
                <List />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        }
      />
      {body}
    </div>
  );
}

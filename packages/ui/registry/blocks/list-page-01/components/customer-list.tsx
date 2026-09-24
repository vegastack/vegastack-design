// @vegastack list-page-01@0.21.0 sha256-WBJq6uDrjw0Ohqpa2fW443G3PU8uCBfX5x15gm3Y3Zs=

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
type Industry = Customer["industry"];
const INDUSTRIES: Industry[] = ["Hospitality", "Retail", "Offices"];
const STATUS_BADGE: Record<Status, BadgeVariant> = {
  Active: "success",
  Prospect: "info",
  Paused: "outline",
};

/** Props for {@link CustomerList}. */
export interface CustomerListProps {
  /**
   * Every customer the list can show. Replace with your paged API.
   * @default the sample customers
   */
  customers?: Customer[];
  /**
   * The first load is in flight.
   * @default false
   */
  loading?: boolean;
  /**
   * The first load failed: why, shown under "Couldn’t load customers" with "Try again".
   * @default undefined
   */
  error?: React.ReactNode;
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
  /**
   * A read-only list: no "New customer" in the empty state.
   * @default false
   */
  readOnly?: boolean;
}

const customerHref = (customer: Customer) => `/customers/${customer.id}`;

/**
 * The customer list: a `FilterBar` (search first, Status and Industry facets, a Mine | Team switch and a
 * Grid | List view switch) over the same records as a `DataList` or a grid of whole-tile links
 * grouped by industry, paged with Load more. Three empty tiers: nothing yet, no matches (with
 * "Clear filters"), and a failed load (with "Try again").
 *
 * @example
 * <CustomerList customers={customers} loading={isPending} error={error?.message} onRetry={refetch} />
 */
export function CustomerList({
  customers = CUSTOMERS,
  loading = false,
  error,
  onRetry,
  defaultView = "list",
  readOnly = false,
}: CustomerListProps) {
  const [view, setView] = React.useState<View>(defaultView);
  const [scope, setScope] = React.useState<Scope>("team");
  // The field follows every keystroke; the list follows the settled (debounced) query.
  const [query, setQuery] = React.useState("");
  const [committedQuery, setCommittedQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<Status | null>(null);
  const [industryFilter, setIndustryFilter] = React.useState<Industry | null>(
    null,
  );
  const [pages, setPages] = React.useState(1);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const inScope = customers.filter(
    (c) => scope === "team" || c.owner === CURRENT_USER,
  );
  const needle = committedQuery.trim().toLowerCase();
  const matching = inScope.filter(
    (c) =>
      (statusFilter === null || c.status === statusFilter) &&
      (industryFilter === null || c.industry === industryFilter) &&
      (needle === "" ||
        c.name.toLowerCase().includes(needle) ||
        c.city.toLowerCase().includes(needle)),
  );
  const shown = matching.slice(0, pages * PAGE_SIZE);
  const hasMore = shown.length < matching.length;
  const filtering =
    query.trim() !== "" || statusFilter !== null || industryFilter !== null;

  function clearFilters() {
    setQuery("");
    setCommittedQuery("");
    setStatusFilter(null);
    setIndustryFilter(null);
    setPages(1);
    // The button that called this unmounts; keep focus in the filters.
    searchRef.current?.focus();
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
      mobile: "visible",
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
      mobile: "merge",
      render: (c) => <Badge variant={STATUS_BADGE[c.status]}>{c.status}</Badge>,
    },
    {
      key: "projects",
      header: "Projects",
      mobile: "merge",
      className: "text-end tabular-nums",
      headerClassName: "text-end",
      render: (c) => c.projects,
    },
    {
      key: "updated",
      header: "Updated",
      mobile: "hidden",
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

  const ready = !loading && error == null;

  let body: React.ReactNode;
  if (error != null) {
    body = (
      <Empty className="border border-dashed" role="alert">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert aria-hidden className="text-destructive-text" />
          </EmptyMedia>
          <EmptyTitle render={<h2 />}>Couldn’t load customers</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  } else if (ready && inScope.length === 0) {
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
        {readOnly ? null : (
          <EmptyContent>
            <a href="/customers/new" className={buttonVariants()}>
              New customer
            </a>
          </EmptyContent>
        )}
      </Empty>
    );
  } else if (ready && matching.length === 0) {
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
        loading={loading}
        loadMore={
          ready
            ? { hasMore, loading: loadingMore, onLoadMore: loadMore }
            : undefined
        }
      />
    );
  } else {
    body = (
      <div className="@container flex flex-col gap-8">
        {loading ? (
          <div
            aria-busy="true"
            className="grid gap-3 @sm:grid-cols-2 @4xl:grid-cols-3"
          >
            <span className="sr-only">Loading customers…</span>
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
        {ready ? (
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
    <div className="flex min-w-0 flex-col gap-3">
      <FilterBar
        aria-label="Customer filters"
        searchPlacement="start"
        search={{
          value: query,
          onValueChange: setQuery,
          onValueCommitted: (value) => {
            setCommittedQuery(value);
            setPages(1);
          },
          placeholder: "Search customers…",
          "aria-label": "Search customers",
        }}
        searchInputProps={{ ref: searchRef }}
        facets={
          <>
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
            <FilterBarFacet<{ id: Industry; name: Industry }>
              label="Industry"
              items={INDUSTRIES.map((ind) => ({ id: ind, name: ind }))}
              value={
                industryFilter
                  ? { id: industryFilter, name: industryFilter }
                  : null
              }
              onValueChange={(item) => {
                setIndustryFilter(item ? item.id : null);
                setPages(1);
              }}
              itemToKey={(item) => item.id}
              itemToStringLabel={(item) => item.name}
              searchLabel="Search industries"
            />
          </>
        }
        trailing={
          <div className="flex flex-wrap items-center gap-2">
            {filtering ? (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
            <ToggleGroup
              variant="outline"
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

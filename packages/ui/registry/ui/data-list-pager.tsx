"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ---
`DataListPager` is the paging control `DataList`'s `footer` slot was always
waiting for: a range summary ("1–15 of 40"), a rows-per-page `Select`, and
upstream's `Pagination` with a windowed page list. It adds no visual primitive
of its own — every control is the system's.

It is CONTROLLED and owns no data, per the G7 split `DataList` already draws:
the host holds `page` and `pageSize`, fetches or slices the rows, and passes
`total`. A server-paged host sends `limit = pageSize` and
`offset = (page - 1) * pageSize`.

Behaviour reference: the Regent consumer's `list-pager.tsx`, adopted into the
system on 2026-09-23 (docs/plans/2026-09-23-consumer-alignment-fixes.md § 2).

Deliberately NOT done here:
- No internal page state. A pager that kept its own page would disagree with
  the URL, the query cache, or the host's reset-on-filter the moment one
  exists.
- No reset on page-size change. Whether a new page size returns to page 1 or
  keeps the first visible row is the host's paging policy; `onPageSizeChange`
  reports the request and the host decides (the docs show the reset).
--- */

/** One entry of the windowed page list: a page number, or a collapsed run. */
export type DataListPagerItem = number | "ellipsis";

/**
 * The windowed page list: every page when there are seven or fewer, otherwise
 * the first and last page plus the current page and its neighbours, with an
 * `"ellipsis"` wherever a run of pages is collapsed.
 *
 * @example
 * pagerWindow(5, 10); // [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
 */
export function pagerWindow(
  current: number,
  pages: number,
): DataListPagerItem[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const kept = [...new Set([1, pages, current - 1, current, current + 1])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  const out: DataListPagerItem[] = [];
  let previous = 0;
  for (const n of kept) {
    if (n - previous > 1) out.push("ellipsis");
    out.push(n);
    previous = n;
  }
  return out;
}

/** Props accepted by `DataListPager`. */
export interface DataListPagerProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The active page, 1-based. Clamped into range for display. */
  page: number;
  /** Rows per page. */
  pageSize: number;
  /** Total number of rows across every page. */
  total: number;
  /** Called with the next 1-based page when a page control is activated. */
  onPageChange: (page: number) => void;
  /**
   * Called with the next page size when the rows-per-page choice changes. The
   * page is left alone — reset it in this handler if that is your policy.
   */
  onPageSizeChange: (pageSize: number) => void;
  /**
   * The rows-per-page choices. A `pageSize` that is not in the list is added,
   * so the chooser always shows the current value.
   * @default [15, 30, 50]
   */
  pageSizes?: readonly number[];
  /**
   * Visible label and accessible name of the rows-per-page chooser.
   * @default "Rows per page"
   */
  pageSizeLabel?: string;
}

/** The rows-per-page choices a pager offers when the host names none. */
const DEFAULT_PAGE_SIZES: readonly number[] = [15, 30, 50];

/**
 * `DataListPager` — a controlled paging footer for `DataList`: a range summary
 * in tabular numerals, a rows-per-page `Select`, and upstream's `Pagination`.
 * The page controls are hidden when everything fits on one page; the range and
 * the rows-per-page chooser stay, so a reader can still widen the page.
 *
 * Previous and Next stay focusable at either end (`aria-disabled`, pointer
 * events alive), and a page change announces the new range politely.
 *
 * @example
 * const [page, setPage] = React.useState(1);
 * const [pageSize, setPageSize] = React.useState(15);
 * <DataList
 *   columns={columns}
 *   data={rows.slice((page - 1) * pageSize, page * pageSize)}
 *   getRowId={(r) => r.id}
 *   footer={
 *     <DataListPager
 *       page={page}
 *       pageSize={pageSize}
 *       total={rows.length}
 *       onPageChange={setPage}
 *       onPageSizeChange={(size) => {
 *         setPageSize(size);
 *         setPage(1);
 *       }}
 *     />
 *   }
 * />
 */
export function DataListPager({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizes = DEFAULT_PAGE_SIZES,
  pageSizeLabel = "Rows per page",
  className,
  ...props
}: DataListPagerProps) {
  const labelId = React.useId();
  const size = Math.max(1, Math.floor(pageSize));
  const count = Math.max(0, Math.floor(total));
  const pages = Math.max(1, Math.ceil(count / size));
  const current = Math.min(Math.max(1, Math.floor(page)), pages);
  const first = count === 0 ? 0 : (current - 1) * size + 1;
  const last = Math.min(current * size, count);
  const range = count === 0 ? "0 of 0" : `${first}–${last} of ${count}`;

  const sizes = React.useMemo(
    () =>
      [...new Set([...pageSizes, size])]
        .filter((n) => n > 0)
        .sort((a, b) => a - b),
    [pageSizes, size],
  );

  // Announce the DESTINATION after a change, never the initial state: the
  // range is already on screen at mount, and a region that speaks on first
  // paint competes with the page's own heading.
  const { announce, Announcer } = useAnnouncer();
  const announcedRange = React.useRef(range);
  React.useEffect(() => {
    if (announcedRange.current === range) return;
    announcedRange.current = range;
    announce(`Showing ${range}`);
  }, [range, announce]);

  const atStart = current <= 1;
  const atEnd = current >= pages;

  return (
    <div
      data-slot="data-list-pager"
      className={cn(
        "flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <p
          data-slot="data-list-pager-range"
          className="text-sm whitespace-nowrap text-muted-foreground tabular-nums"
        >
          {range}
        </p>
        <div
          data-slot="data-list-pager-size"
          className="flex items-center gap-2"
        >
          <span
            id={labelId}
            className="text-sm whitespace-nowrap text-muted-foreground"
          >
            {pageSizeLabel}
          </span>
          <Select
            value={String(size)}
            onValueChange={(value) => {
              if (value != null) onPageSizeChange(Number(value));
            }}
          >
            <SelectTrigger
              size="sm"
              aria-labelledby={labelId}
              className="tabular-nums"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((option) => (
                <SelectItem
                  key={option}
                  value={String(option)}
                  className="tabular-nums"
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {pages > 1 ? (
        <Pagination
          data-slot="data-list-pager-nav"
          className="mx-0 w-auto justify-end"
        >
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                aria-disabled={atStart || undefined}
                className="aria-disabled:opacity-50"
                onClick={(event) => {
                  event.preventDefault();
                  if (!atStart) onPageChange(current - 1);
                }}
              />
            </PaginationItem>
            {pagerWindow(current, pages).map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={item === current}
                    aria-label={`Go to page ${item}`}
                    className="tabular-nums"
                    onClick={(event) => {
                      event.preventDefault();
                      if (item !== current) onPageChange(item);
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                aria-disabled={atEnd || undefined}
                className="aria-disabled:opacity-50"
                onClick={(event) => {
                  event.preventDefault();
                  if (!atEnd) onPageChange(current + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
      <Announcer />
    </div>
  );
}

DataListPager.displayName = "DataListPager";

// @vegastack data-list-pager@0.12.2 sha256-dMIM68rryoFZTRMTx7JuuvwdVi4Dp+uL9fEfpkPD8Hs=

"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
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
import { useContainerWidth } from "@/components/ui/data-table-parts";
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
 * The windowed page list: the first and last page plus the current page and
 * `siblings` pages either side of it, with an `"ellipsis"` wherever a run of
 * pages is collapsed — or every page when that many fit in the same number of
 * slots (`5 + 2 × siblings`: seven with the default one sibling, five with
 * none).
 *
 * @example
 * pagerWindow(5, 10); // [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
 * pagerWindow(5, 10, 0); // [1, "ellipsis", 5, "ellipsis", 10]
 */
export function pagerWindow(
  current: number,
  pages: number,
  siblings = 1,
): DataListPagerItem[] {
  if (pages <= 5 + 2 * siblings)
    return Array.from({ length: pages }, (_, i) => i + 1);
  const around = Array.from(
    { length: 2 * siblings + 1 },
    (_, i) => current - siblings + i,
  );
  const kept = [...new Set([1, pages, ...around])]
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
  /**
   * The active page, 1-based. Clamped into range for display; a non-finite
   * value (`NaN`, `undefined` from a loading query) reads as page 1.
   */
  page: number;
  /**
   * Rows per page. A value that is not a positive finite number (`0`, a
   * negative, `NaN`, `undefined`) is not a page size: the pager shows the first
   * `pageSizes` entry instead, and never adds the bad value to the chooser.
   */
  pageSize: number;
  /**
   * Total number of rows across every page. A value that is not a finite
   * number ≥ 0 (`NaN`, `undefined` while a count loads, a negative) reads as
   * `0`, so the pager renders its empty state ("0 of 0") rather than `NaN`.
   */
  total: number;
  /** Called with the next 1-based page when a page control is activated. */
  onPageChange: (page: number) => void;
  /**
   * Called with the next page size when the rows-per-page choice changes. The
   * page is left alone — reset it in this handler if that is your policy.
   */
  onPageSizeChange: (pageSize: number) => void;
  /**
   * The rows-per-page choices. A valid `pageSize` that is not in the list is
   * added, so the chooser always shows the current value. Entries that are not
   * positive finite numbers are dropped; an empty result falls back to the
   * default list.
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
 * The three page-list layouts, widest first, and the pager width each needs.
 *
 * - `full` — the window with one neighbour either side of the current page
 *   (at most seven 32px slots) and labelled Previous/Next: about 480px.
 * - `compact` — no neighbours (at most five 32px slots) and 32px icon-only
 *   ends: 7 × 32 + 6 × 2px gaps = 236px, so it needs 240.
 * - `minimal` — the icon-only ends around a "Page 3 of 12" label, about
 *   150px. It fits any pager of 200px or more (a 320px viewport's docs
 *   preview is 204px), and it is the declared server answer because it is
 *   the one layout that fits everywhere.
 *
 * The page list never wraps: a wrapped run of page numbers reads as two
 * lists. It changes layout instead, and the range and the rows-per-page
 * chooser wrap onto their own lines above it.
 */
const FULL_FROM = 480;
const COMPACT_FROM = 240;

/** Which page-list layout a pager of `width` px uses (`null`: unmeasured). */
type PagerLayout = "full" | "compact" | "minimal";
function pagerLayout(width: number | null): PagerLayout {
  if (width == null) return "minimal";
  if (width >= FULL_FROM) return "full";
  if (width >= COMPACT_FROM) return "compact";
  return "minimal";
}

/** A positive finite integer, or `null`. */
function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : null;
}

/**
 * `DataListPager` — a controlled paging footer for `DataList`: a range summary
 * in tabular numerals, a rows-per-page `Select`, and upstream's `Pagination`.
 * The page controls are hidden when everything fits on one page; the range and
 * the rows-per-page chooser stay, so a reader can still widen the page.
 *
 * Previous and Next stay focusable at either end (`aria-disabled`, pointer
 * events alive), and a page change announces the new range politely. The page
 * list follows the pager's own width (`data-layout`): `full` from 480px,
 * `compact` from 240px (no neighbours, icon-only ends), and `minimal` below
 * that (icon-only ends around "Page N of M"), so the pager fits any container
 * of 200px or more and never scrolls sideways.
 *
 * Bad numbers render a sane state instead of `NaN`: a non-finite or negative
 * `total` is `0`, a non-finite `page` is `1`, and a `pageSize` that is not a
 * positive finite number shows the first `pageSizes` entry.
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
  ref,
  ...props
}: DataListPagerProps) {
  const labelId = React.useId();
  // Container width, not viewport: a pager in a narrow card on a wide screen
  // must narrow too. This is a JS branch because the three layouts are
  // different item lists, which CSS cannot derive (LAY-9's last rung), and its
  // declared server answer is MINIMAL — the layout that fits everywhere, so an
  // unmeasured pager never overflows. The layout effect corrects it before
  // first paint.
  const [measureRef, width] = useContainerWidth();
  const layout = pagerLayout(width);
  const rootRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(measureRef, ref),
    [measureRef, ref],
  );
  // Sanitised once, here, so nothing below can print `NaN` or offer a bogus
  // choice (a loading `data?.total`, a `pageSize` of 0).
  const choices = React.useMemo(() => {
    const valid = pageSizes
      .map(positiveInteger)
      .filter((n): n is number => n !== null);
    return valid.length > 0 ? valid : [...DEFAULT_PAGE_SIZES];
  }, [pageSizes]);
  const size = positiveInteger(pageSize) ?? choices[0]!;
  const count =
    typeof total === "number" && Number.isFinite(total) && total > 0
      ? Math.floor(total)
      : 0;
  const pages = Math.max(1, Math.ceil(count / size));
  const requested =
    typeof page === "number" && Number.isFinite(page) ? Math.floor(page) : 1;
  const current = Math.min(Math.max(1, requested), pages);
  const first = count === 0 ? 0 : (current - 1) * size + 1;
  const last = Math.min(current * size, count);
  const range = count === 0 ? "0 of 0" : `${first}–${last} of ${count}`;

  const sizes = React.useMemo(
    () => [...new Set([...choices, size])].sort((a, b) => a - b),
    [choices, size],
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
      ref={rootRef}
      data-slot="data-list-pager"
      data-layout={layout}
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
              {layout === "full" ? (
                <PaginationPrevious
                  aria-disabled={atStart || undefined}
                  className="aria-disabled:opacity-50"
                  onClick={(event) => {
                    event.preventDefault();
                    if (!atStart) onPageChange(current - 1);
                  }}
                />
              ) : (
                // Narrow: a 32px icon end, not upstream's `default`-size
                // Previous with its text emptied, which stayed ~34px wide.
                <PaginationLink
                  size="icon"
                  aria-label="Go to previous page"
                  aria-disabled={atStart || undefined}
                  className="aria-disabled:opacity-50"
                  onClick={(event) => {
                    event.preventDefault();
                    if (!atStart) onPageChange(current - 1);
                  }}
                >
                  <ChevronLeftIcon className="rtl:rotate-180" />
                </PaginationLink>
              )}
            </PaginationItem>
            {layout === "minimal" ? (
              <PaginationItem>
                <span
                  data-slot="data-list-pager-position"
                  className="px-2 text-sm whitespace-nowrap text-muted-foreground tabular-nums"
                >
                  Page {current} of {pages}
                </span>
              </PaginationItem>
            ) : (
              pagerWindow(current, pages, layout === "full" ? 1 : 0).map(
                (item, index) =>
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
              )
            )}
            <PaginationItem>
              {layout === "full" ? (
                <PaginationNext
                  aria-disabled={atEnd || undefined}
                  className="aria-disabled:opacity-50"
                  onClick={(event) => {
                    event.preventDefault();
                    if (!atEnd) onPageChange(current + 1);
                  }}
                />
              ) : (
                <PaginationLink
                  size="icon"
                  aria-label="Go to next page"
                  aria-disabled={atEnd || undefined}
                  className="aria-disabled:opacity-50"
                  onClick={(event) => {
                    event.preventDefault();
                    if (!atEnd) onPageChange(current + 1);
                  }}
                >
                  <ChevronRightIcon className="rtl:rotate-180" />
                </PaginationLink>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
      <Announcer />
    </div>
  );
}

DataListPager.displayName = "DataListPager";

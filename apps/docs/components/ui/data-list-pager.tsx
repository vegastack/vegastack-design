// @vegastack data-list-pager@0.23.4 sha256-8LeJ4LyqOzn2EO+H6TCF9Bn5l/db2ybnEGzP5CYjzmk=

"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
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
   * Omit it for a fixed page size: the rows-per-page chooser is not rendered.
   * @default undefined
   */
  onPageSizeChange?: (pageSize: number) => void;
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
 * The page-list rungs, widest first, and the pager width each needs with
 * page numbers of up to two digits.
 *
 * - `full` — the window with one neighbour either side of the current page
 *   (at most seven number slots) and labelled Previous/Next: about 480px.
 * - `compact` — no neighbours (at most five slots, numbers and ellipses) and
 *   32px icon-only ends: 7 × 32 + 6 × 2px gaps = 236px, so it starts at 240.
 *   A three-digit last page already outgrows that: its slot is about 37.4px,
 *   so the list is about 241.4px, and at exactly 240px the pager measures
 *   and steps down to `minimal`.
 * - `minimal` — the icon-only ends around a "Page 3 of 12" label, about
 *   150px, and the declared server answer.
 * - `minimal-short` — the same ends around "3 / 12". Its label is the one
 *   part that may shrink, truncating as the very last resort, so the page
 *   list fits any pager: the 64px of the two ends is its only fixed width.
 *
 * Width picks the starting rung. A number slot is at least 32px and grows to
 * hold its number, so a four- or five-digit page count widens the list past
 * what width alone predicts; the pager then MEASURES and steps down a rung
 * until nothing overflows (see `DataListPager`).
 *
 * The page list never wraps: a wrapped run of page numbers reads as two
 * lists. It changes layout instead, and the range and the rows-per-page
 * chooser wrap onto their own lines above it.
 */
const FULL_FROM = 480;
const COMPACT_FROM = 240;

const RUNGS = ["full", "compact", "minimal", "minimal-short"] as const;
type PagerRung = (typeof RUNGS)[number];

/** The rung a pager of `width` px starts from (`null`: unmeasured). */
function startingRung(width: number | null): number {
  if (width == null) return RUNGS.indexOf("minimal");
  if (width >= FULL_FROM) return RUNGS.indexOf("full");
  if (width >= COMPACT_FROM) return RUNGS.indexOf("compact");
  return RUNGS.indexOf("minimal");
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
 * The page controls are buttons, not links — they change state, they do not
 * navigate (DS-71); the current page carries `aria-current="page"`. Previous
 * and Next stay focusable at either end (`aria-disabled`, pointer events
 * alive), and a page change announces the new range politely. Without
 * `onPageSizeChange` the pager shows no rows-per-page chooser. The page
 * list follows the pager's own width (`data-layout`): `full` from 480px,
 * `compact` from 240px (no neighbours, icon-only ends), and `minimal` below
 * that (icon-only ends around "Page N of M"). A page count too long for the
 * layout its width picks — four or five digits — steps down a layout, and at
 * the last step the position shortens to "N / M" (`data-short`) and may
 * truncate, while its accessible text stays "Page N of M". So the page list
 * never scrolls sideways at any page count; below about 200px the range and
 * the rows-per-page chooser, each one unbreakable line, are what overflow.
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
  // `exact`: the fit below has zero slack, so its trigger must too. The
  // table's 1px quantization kept a 242px verdict at 241 and 240.5px, with
  // Next up to 0.86px outside (review round 4).
  const [measureRef, width] = useContainerWidth({ exact: true });
  const rootNode = React.useRef<HTMLDivElement | null>(null);
  const rootRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(measureRef, rootNode, ref),
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

  // Width picks the starting rung; the page count can still overflow it (a
  // five-digit number slot, a long "Page N of M"). Measured in a layout
  // effect, so each step lands before paint: while the page list overflows,
  // step down one rung. The verdict is keyed by identity to the inputs that
  // move the list's width and re-taken only when one changes — never by
  // re-measuring its own result — so it cannot oscillate at a boundary.
  //
  // The page list's CONTENT can widen with no change to any of those inputs —
  // a web font swapping in, a stylesheet's letter-spacing — so every element
  // in the page list is watched too, and a change in one's size re-takes the
  // check. That
  // re-check can only step further DOWN (it is not part of `fitKey`, so it
  // never resets the steps), which bounds it at the last rung: it cannot
  // oscillate either: a new rung's items re-take it once more, and settle.
  const [contentChanges, setContentChanges] = React.useState(0);
  const fitKey = React.useMemo(
    () => ({}),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the identity IS the signal
    [width, current, pages],
  );
  const [stepsDown, setStepsDown] = React.useState<{
    for: object;
    steps: number;
  } | null>(null);
  const steps = stepsDown?.for === fitKey ? stepsDown.steps : 0;
  const rungIndex = Math.min(startingRung(width) + steps, RUNGS.length - 1);
  const rung: PagerRung = RUNGS[rungIndex]!;
  const layout = rung === "minimal-short" ? "minimal" : rung;
  React.useLayoutEffect(() => {
    if (width == null || rungIndex === RUNGS.length - 1) return;
    const root = rootNode.current;
    const nav = root?.querySelector('[data-slot="data-list-pager-nav"]');
    if (!root || !nav) return;
    // Zero slack, from fractional rects: integer `scrollWidth` with a 1px
    // allowance let a 241.4px compact list (a three-digit last page) sit in a
    // 240px pager with Next 1.4px outside. Every page item must lie inside
    // the root's own box, in either writing direction.
    const box = root.getBoundingClientRect();
    const spills = Array.from(
      nav.querySelectorAll('[data-slot="pagination-item"]'),
      (item) => item.getBoundingClientRect(),
    ).some((rect) => rect.left < box.left || rect.right > box.right);
    if (
      spills ||
      nav.scrollWidth > nav.clientWidth ||
      root.scrollWidth > root.clientWidth
    )
      setStepsDown({ for: fitKey, steps: steps + 1 });
  }, [fitKey, steps, rungIndex, width, contentChanges]);
  React.useLayoutEffect(() => {
    const nav = rootNode.current?.querySelector(
      '[data-slot="data-list-pager-nav"]',
    );
    if (!nav) return;
    // Any notification re-takes the check, the first one included: a baseline
    // taken from the first notification could already hold the widened size
    // (a font that lands between the render and the observer's first frame).
    const observer = new ResizeObserver(() => setContentChanges((n) => n + 1));
    // Every element in the list, not just its items: a flex item can hold its
    // box while the link inside it outgrows it.
    for (const part of nav.querySelectorAll("*")) observer.observe(part);
    return () => observer.disconnect();
  }, [rung, current, pages]);

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
        {onPageSizeChange ? (
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
                className="w-fit tabular-nums"
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
        ) : null}
      </div>

      {pages > 1 ? (
        <Pagination
          data-slot="data-list-pager-nav"
          className="mx-0 w-auto min-w-0 justify-end"
        >
          <PaginationContent className="min-w-0">
            <PaginationItem>
              {layout === "full" ? (
                <Button
                  variant="ghost"
                  aria-label="Go to previous page"
                  data-slot="data-list-pager-previous"
                  disabled={atStart}
                  className="ps-1.5"
                  onClick={() => onPageChange(current - 1)}
                >
                  <ChevronLeftIcon className="rtl:rotate-180" />
                  <span className="hidden sm:block">Previous</span>
                </Button>
              ) : (
                // Narrow: a 32px icon end, not a `default`-size Previous with
                // its text emptied, which stayed ~34px wide.
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Go to previous page"
                  data-slot="data-list-pager-previous"
                  disabled={atStart}
                  onClick={() => onPageChange(current - 1)}
                >
                  <ChevronLeftIcon className="rtl:rotate-180" />
                </Button>
              )}
            </PaginationItem>
            {rung === "minimal" ? (
              <PaginationItem>
                <span
                  data-slot="data-list-pager-position"
                  className="block px-2 text-sm whitespace-nowrap text-muted-foreground tabular-nums"
                >
                  Page {current} of {pages}
                </span>
              </PaginationItem>
            ) : rung === "minimal-short" ? (
              // The last rung, and the one part of the pager that may shrink.
              // The visible "N / M" is hidden from assistive technology, which
              // hears the whole sentence instead.
              <PaginationItem className="min-w-0">
                <span
                  data-slot="data-list-pager-position"
                  data-short=""
                  className="block min-w-0 px-2 text-sm text-muted-foreground tabular-nums"
                >
                  <span className="sr-only">
                    Page {current} of {pages}
                  </span>
                  <span aria-hidden="true" className="block truncate">
                    {current} / {pages}
                  </span>
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
                      <Button
                        variant={item === current ? "outline" : "ghost"}
                        size="icon"
                        aria-label={`Go to page ${item}`}
                        aria-current={item === current ? "page" : undefined}
                        data-slot="data-list-pager-page"
                        data-active={item === current}
                        // At least the 32px square, and wider for a number
                        // that needs it: a fixed slot spilled `10000`.
                        className="w-auto min-w-8 px-1.5 tabular-nums"
                        onClick={() => {
                          if (item !== current) onPageChange(item);
                        }}
                      >
                        {item}
                      </Button>
                    </PaginationItem>
                  ),
              )
            )}
            <PaginationItem>
              {layout === "full" ? (
                <Button
                  variant="ghost"
                  aria-label="Go to next page"
                  data-slot="data-list-pager-next"
                  disabled={atEnd}
                  className="pe-1.5"
                  onClick={() => onPageChange(current + 1)}
                >
                  <span className="hidden sm:block">Next</span>
                  <ChevronRightIcon className="rtl:rotate-180" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Go to next page"
                  data-slot="data-list-pager-next"
                  disabled={atEnd}
                  onClick={() => onPageChange(current + 1)}
                >
                  <ChevronRightIcon className="rtl:rotate-180" />
                </Button>
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

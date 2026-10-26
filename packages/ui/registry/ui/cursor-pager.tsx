// @vegastack cursor-pager@0.25.80 sha256-3YopIGv0rutD+GlJo8L2H9s7XJf44vedB+telNN8ygQ=

"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ---
`CursorPager` is the pager for KEYSET paging: Previous and Next, and nothing else. A cursor-paged
list knows whether a page exists on either side and what the current page holds, but not how many
pages there are or where page 7 starts — so it cannot honestly show page numbers or a total, which
is why `DataListPager` (page numbers, totals, a page-size chooser) does not fit it.

It is controlled and owns no cursors: the host keeps its cursor history (the stack of "previous"
cursors) and fetches; the pager only reports the request. `DataGrid`'s `pagedMode` renders it under
the grid for people who page instead of scroll (a screen-reader setting).

Deliberately NOT done here:
- No page numbers, no total, no page-size chooser (`DataListPager` has those).
- No cursor state.
--- */

/** Props accepted by `CursorPager`. */
export interface CursorPagerProps extends Omit<
  React.ComponentProps<"nav">,
  "children"
> {
  /** A page exists before this one. */
  hasPrevious: boolean;
  /** A page exists after this one. */
  hasNext: boolean;
  /** Go to the previous page (the host pops its cursor history). */
  onPrevious: () => void;
  /** Go to the next page (the host pushes the current cursor). */
  onNext: () => void;
  /**
   * What the current page holds, shown at the leading edge and announced when it changes — for
   * example "Rows 101–200".
   * @default undefined
   */
  label?: React.ReactNode;
  /**
   * A page is loading: both buttons hold still until it lands.
   * @default false
   */
  loading?: boolean;
  /**
   * The Previous button's text.
   * @default "Previous"
   */
  previousLabel?: string;
  /**
   * The Next button's text.
   * @default "Next"
   */
  nextLabel?: string;
}

/**
 * `CursorPager` — Previous / Next for keyset paging, with an optional range label. The buttons stay
 * focusable at either end (`aria-disabled`, as every disabled `Button`), and a new `label` is
 * announced politely.
 *
 * @example
 * <CursorPager
 *   label="Rows 101–200"
 *   hasPrevious={history.length > 0}
 *   hasNext={page.nextCursor != null}
 *   onPrevious={() => setCursor(history.pop())}
 *   onNext={() => { history.push(cursor); setCursor(page.nextCursor); }}
 * />
 */
export function CursorPager({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  label,
  loading = false,
  previousLabel = "Previous",
  nextLabel = "Next",
  className,
  "aria-label": ariaLabel = "Pagination",
  ...props
}: CursorPagerProps) {
  const { announce, Announcer } = useAnnouncer();
  const text = typeof label === "string" ? label : null;
  const announced = React.useRef(text);
  React.useEffect(() => {
    if (text == null || announced.current === text) return;
    announced.current = text;
    announce(text);
  }, [text, announce]);

  return (
    <nav
      data-slot="cursor-pager"
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={cn(
        "flex min-w-0 flex-wrap items-center justify-between gap-2",
        className,
      )}
      {...props}
    >
      <span
        data-slot="cursor-pager-label"
        className="min-w-0 truncate text-sm text-muted-foreground tabular-nums"
      >
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          data-slot="cursor-pager-previous"
          disabled={!hasPrevious || loading}
          className="ps-1.5"
          onClick={onPrevious}
        >
          <ChevronLeftIcon className="rtl:rotate-180" />
          {previousLabel}
        </Button>
        <Button
          variant="ghost"
          data-slot="cursor-pager-next"
          disabled={!hasNext || loading}
          className="pe-1.5"
          onClick={onNext}
        >
          {nextLabel}
          <ChevronRightIcon className="rtl:rotate-180" />
        </Button>
      </div>
      <Announcer />
    </nav>
  );
}

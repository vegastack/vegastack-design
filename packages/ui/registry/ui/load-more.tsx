// @vegastack load-more@0.25.16 sha256-/K7G9GKFtuX66Ys8oGrieXWpFO/3eSNyWz17cke0N1Y=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/* ---
`LoadMore` is the one infinite-loading tail for keyset lists: DataList's and
DataGrid's `loadMore`, board lanes, SearchableSelect's panel and any host-paged
feed. A keyset list has no total and no page numbers, so nothing asks the
reader to page: a sentinel at the list's end fetches the next cursor page as
it nears the scroll container's edge, and skeleton rows hold the space the
new rows will take while the page loads.

It is CONTROLLED and owns no data: the host holds `hasMore`, `loading` and
`error`, and `onLoadMore` fetches the next batch. `LoadMoreState` is that
contract on its own, so a list can take it as one prop and a data hook can
return it as one value.

- The sentinel is observed against its nearest scrolling ancestor (the page
  when there is none), `rootMargin` ahead of the edge, so the next page is
  usually on screen before the reader reaches it. A list shorter than its box
  keeps loading until it fills it or the cursor runs out.
- One request per page: after `onLoadMore` the tail waits for the host — for
  `loading` to rise and fall again when the host reports it, or for the next
  render when it does not — before it can fire again.
- No button and no spinner while paging. The one control is the "Try again"
  a failed page shows, because retrying a failure automatically on scroll
  would hammer a broken endpoint; rows already loaded stay.
- Appending below the reader never moves the scroll position, and nothing
  takes focus, so a keyboard reader's row cursor stays where it was.
--- */

/** The keyset paging contract a list, a lane or a data hook passes around. */
export interface LoadMoreState {
  /** More rows exist beyond the ones already loaded (the host has a next cursor). */
  hasMore: boolean;
  /** Fetch the next batch. Also the retry after an `error`. */
  onLoadMore: () => void;
  /**
   * The next page is in flight: skeleton rows show at the end of the list and no further request
   * fires.
   * @default false
   */
  loading?: boolean;
  /**
   * The last fetch failed. Shown as a message above a "Try again" button; rows already loaded stay
   * and loading pauses until the retry.
   * @default undefined
   */
  error?: React.ReactNode;
}

/** Props accepted by `LoadMore`. */
export interface LoadMoreProps extends LoadMoreState {
  /**
   * Formerly the "Load more" button's label. Paging is automatic now and nothing shows it.
   * @deprecated No button renders; the prop is ignored.
   * @default undefined
   */
  label?: string;
  /**
   * The button's label after an `error`.
   * @default "Try again"
   */
  retryLabel?: string;
  /**
   * What to show once `hasMore` is false. Nothing renders when omitted.
   * @default undefined
   */
  endLabel?: React.ReactNode;
  /**
   * The placeholder rows shown while the next page loads — pass rows the height of the list's own,
   * or `null` when the host draws them in place (a table appending skeleton rows to its body).
   * @default three 36px skeleton bars
   */
  skeleton?: React.ReactNode;
  /**
   * How far ahead of the scroll container's edge the next page starts loading, as an
   * IntersectionObserver `rootMargin`.
   * @default "0px 0px 320px 0px"
   */
  rootMargin?: string;
  /**
   * Classes merged onto the root.
   * @default undefined
   */
  className?: string;
  /**
   * Ref to the root `div`.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

/** The nearest ancestor that scrolls vertically, or `null` for the viewport. */
function scrollRoot(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (el === document.body || el === document.documentElement) return null;
    if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY)) return el;
  }
  return null;
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

/**
 * The infinite-loading tail for keyset lists: a sentinel that fetches the next cursor page as the
 * list nears its scroll container's edge, skeleton rows while it loads, an error line with a retry,
 * and an optional end caption.
 *
 * @example
 * <LoadMore
 *   hasMore={page.nextCursor != null}
 *   loading={isFetchingNextPage}
 *   error={fetchError ? "Couldn't load more tasks." : undefined}
 *   onLoadMore={fetchNextPage}
 * />
 */
export function LoadMore({
  hasMore,
  onLoadMore,
  loading = false,
  error,
  retryLabel = "Try again",
  endLabel,
  skeleton,
  rootMargin = "0px 0px 320px 0px",
  className,
  ref,
}: LoadMoreProps) {
  const failed = error != null && error !== false && !loading;
  const armed = hasMore && !loading && !failed;

  const latest = React.useRef({ armed, onLoadMore });
  React.useLayoutEffect(() => {
    latest.current = { armed, onLoadMore };
  });
  // The duplicate-fetch guard: set when a page is requested, cleared once the host has answered.
  const pending = React.useRef(false);
  const hostReportsLoading = React.useRef(false);
  const loadingSinceRequest = React.useRef(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const [sentinel, setSentinel] = React.useState<HTMLDivElement | null>(null);

  const request = React.useCallback(() => {
    if (!latest.current.armed || pending.current) return;
    pending.current = true;
    loadingSinceRequest.current = false;
    latest.current.onLoadMore();
  }, []);

  React.useEffect(() => {
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) request();
      },
      { root: scrollRoot(sentinel), rootMargin },
    );
    observer.observe(sentinel);
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      if (observerRef.current === observer) observerRef.current = null;
    };
  }, [sentinel, rootMargin, request]);

  // After every render: once the host has answered the last request, release the guard and look
  // again — a page that left the sentinel in view (a short page, a tall box) loads the next one.
  React.useEffect(() => {
    if (loading) {
      hostReportsLoading.current = true;
      loadingSinceRequest.current = true;
      return;
    }
    if (!pending.current) return;
    if (hostReportsLoading.current && !loadingSinceRequest.current) return;
    pending.current = false;
    const observer = observerRef.current;
    if (observer && sentinel) {
      // Re-observing reports the sentinel's current intersection, which IO alone would not.
      observer.unobserve(sentinel);
      observer.observe(sentinel);
    }
  });

  if (!hasMore) {
    if (endLabel == null) return null;
    return (
      <div
        ref={ref}
        data-slot="load-more"
        data-state="done"
        className={cn(
          "flex justify-center text-xs text-muted-foreground",
          className,
        )}
      >
        {endLabel}
      </div>
    );
  }

  if (failed) {
    return (
      <div
        ref={ref}
        data-slot="load-more"
        data-state="error"
        className={cn("flex flex-col items-center gap-2", className)}
      >
        <p
          role="alert"
          data-slot="load-more-error"
          className="text-center text-sm text-destructive-text"
        >
          {error}
        </p>
        <Button variant="outline" size="sm" onClick={onLoadMore}>
          {retryLabel}
        </Button>
      </div>
    );
  }

  const placeholder = skeleton === undefined ? <DefaultSkeleton /> : skeleton;
  const showPlaceholder = loading && placeholder != null;
  return (
    <div
      ref={ref}
      data-slot="load-more"
      data-state={loading ? "loading" : "idle"}
      // Decoration only: the rows arrive in the list itself, and the host's own status region
      // (or the list's `aria-busy`) is what a screen reader hears.
      aria-hidden
      // Idle, the tail is a 1px sentinel and takes none of the host's padding.
      className={cn(showPlaceholder ? className : "contents")}
    >
      <div
        ref={setSentinel}
        data-slot="load-more-sentinel"
        className="h-px w-full shrink-0"
      />
      {showPlaceholder ? (
        <div data-slot="load-more-skeleton">{placeholder}</div>
      ) : null}
    </div>
  );
}

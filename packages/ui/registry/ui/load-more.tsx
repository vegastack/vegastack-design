// @vegastack load-more@0.25.48 sha256-n10VkSLH6NxwLXZQxxDIJJOyROyx+648uFbsRCOM//g=

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
- One request per page: after `onLoadMore` the tail waits for the host — the
  promise it returned to settle, or `loading` to rise and fall, or, for a host
  that reports neither, the rows to land (the sentinel moves) — before it can
  fire again. Pass `loading` or return a promise; the last is a heuristic.
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
  /**
   * Fetch the next batch. Also the retry after an `error`. Returning a promise lets the tail
   * release its one-request guard exactly when the page settles.
   */
  onLoadMore: () => void | Promise<unknown>;
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

/** Requests in a row that brought no rows before the tail stops asking on its own. */
const MAX_STALLS = 5;

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
  // The duplicate-fetch guard: set when a page is requested, cleared once the host has answered —
  // the promise `onLoadMore` returned settling, else `loading` rising and falling, else (a host
  // that reports neither) the sentinel moving because rows were appended above it.
  const pending = React.useRef(false);
  const hostReportsLoading = React.useRef(false);
  const loadingSinceRequest = React.useRef(false);
  const requestedAt = React.useRef<number | null>(null);
  const wasArmed = React.useRef(armed);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const rootRef = React.useRef<HTMLElement | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const [sentinel, setSentinel] = React.useState<HTMLDivElement | null>(null);
  // A promise from `onLoadMore` is the exact answer: the guard holds until it settles.
  const settling = React.useRef(false);
  const stalls = React.useRef(0);
  const stalledAt = React.useRef(0);
  const [settled, setSettled] = React.useState(0);
  const lookedAtSettle = React.useRef(0);

  /** The sentinel's offset in its scroll root's content — unchanged by scrolling, moved by rows. */
  const position = React.useCallback((el: HTMLElement) => {
    const top = el.getBoundingClientRect().top;
    const root = rootRef.current;
    return root
      ? top - root.getBoundingClientRect().top + root.scrollTop
      : top + window.scrollY;
  }, []);

  const request = React.useCallback(() => {
    if (!latest.current.armed || pending.current) return;
    if (stalls.current >= MAX_STALLS) return;
    pending.current = true;
    loadingSinceRequest.current = false;
    requestedAt.current = sentinelRef.current
      ? position(sentinelRef.current)
      : null;
    const result = latest.current.onLoadMore();
    if (result && typeof result.then === "function") {
      settling.current = true;
      const settle = () => {
        settling.current = false;
        pending.current = false;
        setSettled((n) => n + 1);
      };
      result.then(settle, settle);
    }
  }, [position]);

  React.useEffect(() => {
    sentinelRef.current = sentinel;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const root = scrollRoot(sentinel);
    rootRef.current = root;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) request();
      },
      { root, rootMargin },
    );
    observer.observe(sentinel);
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      if (observerRef.current === observer) observerRef.current = null;
    };
  }, [sentinel, rootMargin, request]);

  // After every render: release the guard once the host has answered, and look again whenever the
  // tail re-arms (a page landed, a retry cleared the error, a first load finished) — IO reports
  // only changes, so a sentinel still in view after a short page would otherwise sit there.
  React.useEffect(() => {
    if (loading) {
      hostReportsLoading.current = true;
      loadingSinceRequest.current = true;
      wasArmed.current = false;
      return;
    }
    let look = false;
    if (failed) pending.current = false;
    else if (settling.current) {
      // Waiting on the host's promise; `settled` re-renders and looks again when it lands.
    } else if (pending.current) {
      const answered = hostReportsLoading.current
        ? loadingSinceRequest.current
        : sentinel != null &&
          requestedAt.current != null &&
          Math.abs(position(sentinel) - requestedAt.current) >= 1;
      if (answered) {
        pending.current = false;
        look = true;
      }
    }
    if (settled !== lookedAtSettle.current) {
      lookedAtSettle.current = settled;
      look = true;
    }
    if (armed && !wasArmed.current) look = true;
    wasArmed.current = armed;
    if (failed) stalls.current = 0;
    if (look && requestedAt.current != null && sentinel) {
      // A request that brought no rows (the sentinel never moved) counts as a stall; after a few
      // in a row the tail stops asking on its own, so a host that answers without progress can
      // never spin. New rows, or a retry after an error, start the count again.
      const at = position(sentinel);
      const moved = Math.abs(at - requestedAt.current) >= 1;
      requestedAt.current = null;
      stalls.current = moved ? 0 : stalls.current + 1;
      if (stalls.current >= MAX_STALLS) {
        stalledAt.current = at;
        look = false;
      }
    } else if (
      stalls.current >= MAX_STALLS &&
      sentinel &&
      Math.abs(position(sentinel) - stalledAt.current) >= 1
    ) {
      // Rows arrived some other way: the tail is live again.
      stalls.current = 0;
      look = true;
    }
    const observer = observerRef.current;
    if (look && observer && sentinel) {
      // Re-observing reports the sentinel's current intersection.
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

// @vegastack use-async-search@0.23.1 sha256-I3UyWWXDaCxp7erKjev7dT+Piv3/KO33a0RhfhnclCY=

"use client";

import * as React from "react";
import { TIMINGS } from "@vegastack/design";
import type { LoadMoreState } from "@/components/ui/load-more";

/* ---
`useAsyncSearch` is the server-search state machine behind a searched,
keyset-paged list: SearchableSelect's `remote` mode, a FilterBar facet whose
options come from the server, a picker dialog. It owns the four things every
hand-rolled copy gets wrong:

- **Debounce.** The query updates on every keystroke (the input stays
  instant); the request waits for `debounceMs` of quiet.
- **Races.** Every request gets an `AbortSignal`, and starting a new one
  aborts the last. A response that arrives after a newer request started is
  dropped even when the loader ignores the signal, so a slow "a" can never
  overwrite a fast "ab".
- **Paging.** `loadMore` is a `LoadMoreState`: the next page is fetched with
  the cursor the last page returned and appended.
- **Failure.** Items already loaded stay; `error` is set; `loadMore.onLoadMore`
  retries the request that failed, and `reload()` starts over.

It renders nothing and owns no cache — the loader is the host's (a fetch, a
server action, a query client's `fetchQuery`).
--- */

/** One page of results, and the cursor for the next (absent or `null` when it was the last). */
export interface AsyncSearchPage<T> {
  items: T[];
  nextCursor?: string | null;
}

/** Context passed to the loader with each request. */
export interface AsyncSearchContext {
  /** The cursor of the page to load — `null` for the first page. */
  cursor: string | null;
  /** Aborted when a newer request starts or the host unmounts. */
  signal: AbortSignal;
}

/** Loads one page of results for `query`. */
export type AsyncSearchLoader<T> = (
  query: string,
  context: AsyncSearchContext,
) => Promise<AsyncSearchPage<T>>;

/** Options accepted by `useAsyncSearch`. */
export interface UseAsyncSearchOptions {
  /**
   * Quiet time after the last keystroke before a request is sent.
   * @default TIMINGS.searchDebounceMs (300)
   */
  debounceMs?: number;
  /**
   * Values that, when they change, clear the results and load the first page
   * again (a scope, a parent record, a filter outside the query). Compared by
   * their JSON value, so pass plain values.
   * @default []
   */
  deps?: readonly unknown[];
  /**
   * Load the first page on mount (and whenever `deps` change). Pass `false` to
   * wait — until a popup opens, say; typing still searches.
   * @default true
   */
  enabled?: boolean;
  /**
   * The query to start from.
   * @default ""
   */
  initialQuery?: string;
  /**
   * Turns a failed request into the message shown to the reader. The thrown
   * value is never shown as-is.
   * @default () => "Couldn't load results."
   */
  errorMessage?: (error: unknown) => React.ReactNode;
}

/** What `useAsyncSearch` returns — spread the fields onto a searched list. */
export interface UseAsyncSearchResult<T> {
  /** Every item loaded for the current query, in page order. */
  items: T[];
  /** The query as typed (instant, not debounced). */
  query: string;
  /** Pass to the search input's change handler. */
  onSearchChange: (query: string) => void;
  /** A request is in flight. Items already loaded stay. */
  loading: boolean;
  /** The last request failed; `undefined` otherwise. */
  error: React.ReactNode | undefined;
  /**
   * The next-page contract for `LoadMore` or a list's `loadMore` prop. `hasMore`
   * also holds while `error` is set, so the footer's Try again can retry.
   */
  loadMore: LoadMoreState;
  /** Clear the results and load the first page for the current query now. */
  reload: () => void;
}

const defaultErrorMessage = () => "Couldn't load results.";

interface Request {
  query: string;
  cursor: string | null;
}

/**
 * Debounced, abortable, cursor-paged search over a host-supplied loader.
 *
 * @example
 * const search = useAsyncSearch(
 *   (query, { cursor, signal }) =>
 *     fetch(`/api/customers?q=${encodeURIComponent(query)}&cursor=${cursor ?? ""}`, { signal })
 *       .then((res) => res.json()),
 * );
 *
 * <SearchableSelect
 *   remote
 *   items={search.items}
 *   onSearchChange={search.onSearchChange}
 *   loading={search.loading}
 *   error={search.error}
 *   loadMore={search.loadMore}
 *   {...selectProps}
 * />
 */
export function useAsyncSearch<T>(
  load: AsyncSearchLoader<T>,
  options: UseAsyncSearchOptions = {},
): UseAsyncSearchResult<T> {
  const {
    debounceMs = TIMINGS.searchDebounceMs,
    deps = [],
    enabled = true,
    initialQuery = "",
    errorMessage = defaultErrorMessage,
  } = options;

  const [query, setQuery] = React.useState(initialQuery);
  const [items, setItems] = React.useState<T[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<React.ReactNode | undefined>();

  // The latest loader and message mapper, so an inline arrow never restarts anything.
  const loadRef = React.useRef(load);
  const errorMessageRef = React.useRef(errorMessage);
  React.useLayoutEffect(() => {
    loadRef.current = load;
    errorMessageRef.current = errorMessage;
  });

  const queryRef = React.useRef(initialQuery);
  const controllerRef = React.useRef<AbortController | null>(null);
  const sequenceRef = React.useRef(0);
  const failedRef = React.useRef<Request | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const run = React.useCallback((request: Request) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const sequence = ++sequenceRef.current;
    const isCurrent = () =>
      sequence === sequenceRef.current && !controller.signal.aborted;
    setLoading(true);
    setError(undefined);
    failedRef.current = null;
    let pending: Promise<AsyncSearchPage<T>>;
    try {
      pending = loadRef.current(request.query, {
        cursor: request.cursor,
        signal: controller.signal,
      });
    } catch (thrown) {
      pending = Promise.reject(thrown);
    }
    pending.then(
      (page) => {
        if (!isCurrent()) return;
        setItems((previous) =>
          request.cursor == null ? page.items : [...previous, ...page.items],
        );
        setNextCursor(page.nextCursor ?? null);
        setLoading(false);
      },
      (thrown: unknown) => {
        if (!isCurrent()) return;
        failedRef.current = request;
        setError(errorMessageRef.current(thrown));
        setLoading(false);
      },
    );
  }, []);

  const loadFirstPage = React.useCallback(() => {
    clearTimer();
    run({ query: queryRef.current, cursor: null });
  }, [run]);

  const onSearchChange = React.useCallback(
    (next: string) => {
      queryRef.current = next;
      setQuery(next);
      clearTimer();
      // The in-flight request answers the previous query: drop it now, so its response can't
      // fill the list with stale results while the new query waits out its debounce.
      controllerRef.current?.abort();
      sequenceRef.current++;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        run({ query: next, cursor: null });
      }, debounceMs);
    },
    [debounceMs, run],
  );

  // First load, and a reset whenever a dep changes. Keyed on the deps' values, not the array.
  const depsKey = JSON.stringify(deps);
  React.useEffect(() => {
    if (!enabled) return;
    setItems([]);
    setNextCursor(null);
    loadFirstPage();
  }, [enabled, depsKey, loadFirstPage]);

  // Unmount: abort what is in flight and drop a pending debounce.
  React.useEffect(
    () => () => {
      clearTimer();
      controllerRef.current?.abort();
    },
    [],
  );

  const onLoadMore = React.useCallback(() => {
    // A typed query is waiting out its debounce: the cursor and a failed request belong to the
    // previous query, and the new query's first page is about to replace the list.
    if (timerRef.current != null) return;
    const failed = failedRef.current;
    if (failed) {
      run(failed);
      return;
    }
    if (nextCursor == null) return;
    run({ query: queryRef.current, cursor: nextCursor });
  }, [nextCursor, run]);

  const reload = React.useCallback(() => {
    setNextCursor(null);
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = React.useMemo<LoadMoreState>(
    // A failed request keeps the footer up, so its Try again can retry it.
    () => ({
      hasMore: nextCursor != null || error != null,
      onLoadMore,
      loading,
      error,
    }),
    [nextCursor, onLoadMore, loading, error],
  );

  return {
    items,
    query,
    onSearchChange,
    loading,
    error,
    loadMore,
    reload,
  };
}
